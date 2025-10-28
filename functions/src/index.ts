import { onObjectFinalized } from "firebase-functions/v2/storage";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import OpenAI from "openai";
import { defineSecret } from "firebase-functions/params";

// Initialize Firebase Admin
initializeApp();

const storage = getStorage();
const db = getFirestore();
const visionClient = new ImageAnnotatorClient();

// Define secrets for OpenAI API key
const openaiApiKey = defineSecret("OPENAI_API_KEY");

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
    secrets: [openaiApiKey],
  },
  async (event) => {
    console.log("=== PROCESS RECEIPT FUNCTION STARTED ===");
    console.log("Event data:", JSON.stringify(event.data, null, 2));

    const { name, bucket } = event.data;
    console.log("File name:", name);
    console.log("Bucket:", bucket);

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
      console.log("Starting receipt processing...");

      // Extract receipt ID from path - handle both original and resized images
      const pathParts = name.split("/");
      const fileName = pathParts[2];

      // Remove any resize suffixes to get the original document ID
      let receiptId = fileName.replace(".jpg", "").replace(".jpeg", "");
      receiptId = receiptId.replace(/_800x800$/, "").replace(/_resized$/, "");

      console.log("Original filename:", fileName);
      console.log("Extracted receipt ID:", receiptId);

      // Get the image from Storage
      console.log("Getting storage bucket...");
      const bucketObj = storage.bucket(bucket);
      const file = bucketObj.file(name);
      console.log("Storage file reference created");

      // Download image for OCR processing
      console.log("Downloading image for OCR...");

      // Check if the file exists before trying to download
      const [exists] = await file.exists();
      if (!exists) {
        console.log(`File ${name} does not exist, skipping processing`);
        return;
      }

      const [imageBuffer] = await file.download();
      console.log("Image downloaded, size:", imageBuffer.length, "bytes");

      // Step 1: Use Google Vision API for text detection
      console.log("Running OCR with Google Vision API...");
      const [result] = await visionClient.textDetection({
        image: { content: imageBuffer },
      });
      console.log("Vision API call completed");

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
      console.log("Extracted text length:", fullText.length);
      console.log(
        "Extracted text preview:",
        fullText.substring(0, 200) + "..."
      );

      // Step 2: Use OpenAI to parse and categorize items
      console.log("Processing with OpenAI...");

      const ocrResult = await processWithOpenAI(fullText, openaiApiKey.value());
      console.log("OpenAI processing completed");
      console.log(
        "OpenAI result preview:",
        JSON.stringify(ocrResult).substring(0, 500)
      );

      // Step 3: Update Firestore with results
      console.log("Updating Firestore with results...");
      await updateReceiptStatus(receiptId, "processed", ocrResult);
      console.log("Firestore update completed");

      // Step 4: Delete the original large image to save storage costs
      // Only delete if this is the original image (not a resized version)
      if (!fileName.includes("_800x800") && !fileName.includes("_resized")) {
        console.log("Deleting original large image to save storage costs...");
        await file.delete();
        console.log(`Successfully deleted original image: ${name}`);
        console.log("Storage cost optimization completed");
      } else {
        console.log("Skipping deletion - this is a resized image");
      }

      console.log("=== RECEIPT PROCESSING COMPLETED SUCCESSFULLY ===");
    } catch (error) {
      console.error("=== ERROR IN PROCESS RECEIPT FUNCTION ===");
      console.error("Error type:", typeof error);
      console.error(
        "Error message:",
        error instanceof Error ? error.message : String(error)
      );
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );
      console.error("Full error object:", JSON.stringify(error, null, 2));

      // Extract receipt ID for error update - handle both original and resized images
      const pathParts = name.split("/");
      const fileName = pathParts[2];
      let receiptId = fileName.replace(".jpg", "").replace(".jpeg", "");
      receiptId = receiptId.replace(/_800x800$/, "").replace(/_resized$/, "");
      console.log("Updating receipt status to error for ID:", receiptId);

      await updateReceiptStatus(
        receiptId,
        "error",
        error instanceof Error ? error.message : "Unknown error"
      );
      console.log("=== PROCESS RECEIPT FUNCTION COMPLETED WITH ERROR ===");
    }
  }
);

async function processWithOpenAI(
  text: string,
  apiKey: string
): Promise<OCRResult> {
  console.log("Processing receipt with OpenAI...");

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
`;

  try {
    const openai = new OpenAI({
      apiKey: apiKey,
    });

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

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error("No response from OpenAI");
    }

    const ocrResult = JSON.parse(response) as OCRResult;

    // Validate the result
    if (!ocrResult.items || !Array.isArray(ocrResult.items)) {
      throw new Error("Invalid OCR result: missing items array");
    }

    console.log("OpenAI processing completed successfully");
    return ocrResult;
  } catch (error) {
    console.error("Error processing with OpenAI:", error);

    // Fallback: return basic structure with raw text
    const fallbackResult = {
      totalAmount: 0,
      merchant: "Unknown",
      date: new Date().toISOString().split("T")[0],
      creditCardLastFour: "",
      items: [],
      rawText: text,
    };

    console.log("Returning fallback result due to error");
    return fallbackResult;
  }
}

async function updateReceiptStatus(
  receiptId: string,
  status: "processing" | "processed" | "error",
  data?: any
) {
  console.log("=== UPDATE RECEIPT STATUS FUNCTION STARTED ===");
  console.log("Receipt ID:", receiptId);
  console.log("Status:", status);
  console.log(
    "Data preview:",
    data ? JSON.stringify(data).substring(0, 200) + "..." : "null"
  );

  try {
    const receiptRef = db.collection("receipts").doc(receiptId);
    console.log("Firestore reference created for document:", receiptId);

    // Check if document exists
    console.log("Checking if document exists...");
    const docSnap = await receiptRef.get();
    if (!docSnap.exists) {
      console.error(`Receipt document ${receiptId} not found`);
      return;
    }
    console.log("Document exists, proceeding with update");

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === "processed" && data) {
      updateData.processedDate = new Date();
      updateData.ocrData = data;
      console.log("Adding processed data to update");
    } else if (status === "error" && typeof data === "string") {
      updateData.errorMessage = data;
      console.log("Adding error message to update");
    }

    console.log("Update data:", JSON.stringify(updateData, null, 2));
    await receiptRef.update(updateData);
    console.log(`Updated receipt ${receiptId} status to ${status}`);
    console.log(
      "=== UPDATE RECEIPT STATUS FUNCTION COMPLETED SUCCESSFULLY ==="
    );
  } catch (error) {
    console.error("=== ERROR IN UPDATE RECEIPT STATUS FUNCTION ===");
    console.error("Error type:", typeof error);
    console.error(
      "Error message:",
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    console.error("Full error object:", JSON.stringify(error, null, 2));
  }
}

// Alternative trigger: Process receipt when document is created
export const processReceiptOnCreate = onDocumentCreated(
  {
    region: "us-east1",
    document: "receipts/{receiptId}",
    secrets: [openaiApiKey],
  },
  async (event) => {
    console.log("=== PROCESS RECEIPT ON CREATE FUNCTION STARTED ===");
    console.log("Event params:", JSON.stringify(event.params, null, 2));
    console.log("Event data:", JSON.stringify(event.data?.data(), null, 2));

    const receiptId = event.params.receiptId;
    const receiptData = event.data?.data();
    console.log("Extracted receipt ID:", receiptId);
    console.log("Receipt data status:", receiptData?.status);

    if (!receiptData || receiptData.status !== "uploaded") {
      console.log(
        "Skipping receipt, not in uploaded status. Status:",
        receiptData?.status
      );
      console.log(
        "=== PROCESS RECEIPT ON CREATE FUNCTION COMPLETED - SKIPPED ==="
      );
      return;
    }

    console.log("Processing receipt document:", receiptId);
    console.log("Receipt data:", JSON.stringify(receiptData, null, 2));

    try {
      // Initialize Firebase Admin inside the function
      console.log("Initializing Firebase Admin...");
      initializeApp();
      console.log("Firebase Admin initialized successfully");

      const storage = getStorage();
      const visionClient = new ImageAnnotatorClient();

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

      const ocrResult = await processWithOpenAI(fullText, openaiApiKey.value());
      console.log(
        "OpenAI result:",
        JSON.stringify(ocrResult).substring(0, 500)
      );

      // Update Firestore with results
      await updateReceiptStatus(receiptId, "processed", ocrResult);

      console.log("Receipt processing completed successfully");
    } catch (error) {
      console.error("=== ERROR IN FUNCTION ===");
      console.error("Error type:", typeof error);
      console.error(
        "Error message:",
        error instanceof Error ? error.message : String(error)
      );
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );
      console.error("Full error object:", JSON.stringify(error, null, 2));

      await updateReceiptStatus(
        receiptId,
        "error",
        error instanceof Error ? error.message : "Unknown error"
      );
    }

    console.log("=== FUNCTION COMPLETED ===");
  }
);
