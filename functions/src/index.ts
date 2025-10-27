import { onObjectFinalized } from "firebase-functions/v2/storage";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import OpenAI from "openai";

// Initialize Firebase Admin
initializeApp();

const storage = getStorage();
const db = getFirestore();
const visionClient = new ImageAnnotatorClient();

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  category: string;
}

interface OCRResult {
  totalAmount: number;
  merchant?: string;
  date?: string;
  creditCardLastFour?: string;
  items: ReceiptItem[];
  rawText?: string;
}

// Process receipt when image is uploaded to Storage
export const processReceipt = onObjectFinalized(
  {
    region: "us-east1",
  },
  async (event) => {
    const { name, bucket } = event.data;

    // Only process receipts and skip resized versions
    if (
      !name.startsWith("receipts/") ||
      name.includes("_800x800") ||
      name.includes("_resized")
    ) {
      console.log("Skipping file:", name);
      return;
    }

    console.log("Processing receipt:", name);

    try {
      // Extract receipt ID from path
      const pathParts = name.split("/");
      const fileName = pathParts[2];
      const receiptId = fileName.replace(".jpg", "");

      // Get the image from Storage
      const bucketObj = storage.bucket(bucket);
      const file = bucketObj.file(name);

      // Download image for OCR processing
      const [imageBuffer] = await file.download();

      // Step 1: Use Google Vision API for text detection
      console.log("Running OCR with Google Vision API...");
      const [result] = await visionClient.textDetection({
        image: { content: imageBuffer },
      });

      const detections = result.textAnnotations;
      if (!detections || detections.length === 0) {
        console.log("No text detected in image");
        await updateReceiptStatus(
          receiptId,
          "error",
          "No text detected in image"
        );
        return;
      }

      const fullText = detections[0].description || "";
      console.log("Extracted text:", fullText.substring(0, 200) + "...");

      // Step 2: Use OpenAI to parse and categorize items
      console.log("Processing with OpenAI...");
      console.log("OpenAI configured:", !!openai);
      const ocrResult = await processWithOpenAI(fullText);
      console.log("OpenAI result:", JSON.stringify(ocrResult).substring(0, 500));

      // Step 3: Update Firestore with results
      await updateReceiptStatus(receiptId, "processed", ocrResult);

      console.log("Receipt processing completed successfully");
    } catch (error) {
      console.error("Error processing receipt:", error);

      // Extract receipt ID for error update
      const pathParts = name.split("/");
      const fileName = pathParts[2];
      const receiptId = fileName.replace(".jpg", "");

      await updateReceiptStatus(
        receiptId,
        "error",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

async function processWithOpenAI(text: string): Promise<OCRResult> {
  if (!openai) {
    console.log("OpenAI not configured, returning basic OCR result");
    return {
      totalAmount: 0,
      merchant: "Unknown",
      date: new Date().toISOString().split("T")[0],
      creditCardLastFour: "",
      items: [],
      rawText: text,
    };
  }

  const categories = [
    "Flooring",
    "Plumbing",
    "Electrical",
    "Materials",
    "Labor",
    "Equipment",
    "Tools",
    "Transportation",
    "Permits",
    "Other",
  ];

  const prompt = `
You are an expert at analyzing construction business receipts. Extract the following information from this receipt text:

RECEIPT TEXT:
${text}

AVAILABLE CATEGORIES: ${categories.join(", ")}

Please analyze this receipt and return a JSON object with the following structure:
{
  "totalAmount": number,
  "merchant": "string",
  "date": "YYYY-MM-DD",
  "creditCardLastFour": "string (last 4 digits only)",
  "items": [
    {
      "name": "string",
      "quantity": number,
      "price": number,
      "category": "string (must be one of the available categories)"
    }
  ],
  "rawText": "string (original text)"
}

IMPORTANT RULES:
1. Split the receipt into individual items with quantities and prices
2. Assign each item to the most appropriate category from the list
3. Extract the total amount, merchant name, date, and credit card info
4. If you can't determine quantity, use 1
5. If you can't determine a category, use "Other"
6. Return ONLY valid JSON, no other text

Example:
{
  "totalAmount": 5000.00,
  "merchant": "Home Depot",
  "date": "2024-01-15",
  "creditCardLastFour": "1234",
  "items": [
    {
      "name": "Flooring tiles",
      "quantity": 3,
      "price": 1500.00,
      "category": "Flooring"
    },
    {
      "name": "PVC pipes",
      "quantity": 5,
      "price": 500.00,
      "category": "Plumbing"
    }
  ],
  "rawText": "${text}"
}
`;

  try {
    console.log("Calling OpenAI API with model: gpt-4o");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert at analyzing construction business receipts. Always return valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    console.log("OpenAI response received");

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    // Parse JSON response
    const ocrResult = JSON.parse(response) as OCRResult;

    // Validate the result
    if (!ocrResult.items || !Array.isArray(ocrResult.items)) {
      throw new Error("Invalid OCR result: missing items array");
    }

    return ocrResult;
  } catch (error) {
    console.error("OpenAI API error:", error);
    console.error("Error details:", error instanceof Error ? error.message : "Unknown");

    // Fallback: return basic structure with raw text
    return {
      totalAmount: 0,
      merchant: "Unknown",
      date: new Date().toISOString().split("T")[0],
      creditCardLastFour: "",
      items: [],
      rawText: text,
    };
  }
}

async function updateReceiptStatus(
  receiptId: string,
  status: "processing" | "processed" | "error",
  data?: any
) {
  try {
    const receiptRef = db.collection("receipts").doc(receiptId);

    // Check if document exists
    const docSnap = await receiptRef.get();
    if (!docSnap.exists) {
      console.error(`Receipt document ${receiptId} not found`);
      return;
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === "processed" && data) {
      updateData.processedDate = new Date();
      updateData.ocrData = data;
    } else if (status === "error" && typeof data === "string") {
      updateData.errorMessage = data;
    }

    await receiptRef.update(updateData);
    console.log(`Updated receipt ${receiptId} status to ${status}`);
  } catch (error) {
    console.error("Error updating receipt status:", error);
  }
}

// Alternative trigger: Process receipt when document is created
export const processReceiptOnCreate = onDocumentCreated(
  {
    region: "us-east1",
    document: "receipts/{receiptId}",
    secrets: ["OPENAI_API_KEY"],
  },
  async (event) => {
    const receiptId = event.params.receiptId;
    const receiptData = event.data?.data();

    if (!receiptData || receiptData.status !== "uploaded") {
      console.log("Skipping receipt, not in uploaded status");
      return;
    }

    console.log("Processing receipt document:", receiptId);

    try {
      // Wait a moment for Storage upload to complete
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Get image from Storage using the receiptId as filename
      const userId = receiptData.userId;
      const storagePath = `receipts/${userId}/${receiptId}.jpg`;
      const bucketObj = storage.bucket();
      const file = bucketObj.file(storagePath);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        console.error("Image file not found:", storagePath);
        await updateReceiptStatus(receiptId, "error", "Image file not found");
        return;
      }

      // Download image for OCR processing
      const [imageBuffer] = await file.download();

      // Run OCR with Google Vision API
      console.log("Running OCR with Google Vision API...");
      const [result] = await visionClient.textDetection({
        image: { content: imageBuffer },
      });

      const detections = result.textAnnotations;
      if (!detections || detections.length === 0) {
        console.log("No text detected in image");
        await updateReceiptStatus(receiptId, "error", "No text detected");
        return;
      }

      // Extract full text
      const fullText = detections[0]?.description || "";
      console.log("OCR Detections:", fullText);

      // Process with OpenAI
      console.log("Processing with OpenAI...");
      console.log("OpenAI configured:", !!openai);
      const ocrResult = await processWithOpenAI(fullText);
      console.log("OpenAI result:", JSON.stringify(ocrResult).substring(0, 500));

      // Update Firestore with results
      await updateReceiptStatus(receiptId, "processed", ocrResult);

      console.log("Receipt processing completed successfully");
    } catch (error) {
      console.error("Error processing receipt:", error);
      await updateReceiptStatus(
        receiptId,
        "error",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);
