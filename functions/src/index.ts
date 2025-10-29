import { onObjectFinalized } from "firebase-functions/v2/storage";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import OpenAI from "openai";

// Initialize Firebase Admin only if not already initialized
if (getApps().length === 0) {
  initializeApp();
}

// OpenAI API key is hardcoded in processWithOpenAI function

// V2 Functions with comprehensive error handling and inline initialization

interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number; // NEW: Individual item price
  price: number; // EXISTING: Total price (quantity * unitPrice)
  category: string;
}

interface OCRResult {
  totalAmount: number;
  subtotal?: number; // NEW
  tax?: number; // NEW
  merchant?: string;
  date?: string;
  creditCardLastFour?: string;
  items: ReceiptItem[];
  rawText?: string;
  needsReview?: boolean; // NEW: Flag for manual review
  validationWarnings?: string[]; // NEW: List of validation issues
}

// V2: Process receipt when image is uploaded to Storage
export const processReceiptV2 = onObjectFinalized(
  {
    region: "us-east1",
    memory: "256MiB",
  },
  async (event) => {
    // IMMEDIATE LOGGING - Before any try-catch
    console.log("=== PROCESS RECEIPT V2 INVOKED ===");

    try {
      console.log("Event data name:", event.data.name);
      console.log("Event data bucket:", event.data.bucket);

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

      // Extract receipt ID from path - handle both original and resized images
      const pathParts = name.split("/");
      const fileName = pathParts[2];

      // Remove any resize suffixes to get the original document ID
      let receiptId = fileName.replace(".jpg", "").replace(".jpeg", "");
      receiptId = receiptId.replace(/_800x800$/, "").replace(/_resized$/, "");

      console.log("Original filename:", fileName);
      console.log("Extracted receipt ID:", receiptId);

      // INLINE INITIALIZATION - Initialize Firebase services inside function
      console.log("Initializing Firebase services...");
      const storage = getStorage();
      const bucketObj = storage.bucket(bucket);
      const file = bucketObj.file(name);
      console.log("Storage initialized successfully");

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
      console.log("Initializing Vision API client...");
      const visionClient = new ImageAnnotatorClient();
      console.log("Running OCR with Google Vision API...");
      const [result] = await visionClient.textDetection({
        image: { content: imageBuffer },
      });
      console.log("Vision API call completed");

      const detections = result.textAnnotations;
      if (!detections || detections.length === 0) {
        console.log("No text detected in image");
        await updateReceiptStatusV2(
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
      const ocrResult = await processWithOpenAI(fullText);
      console.log("OpenAI processing completed");
      console.log(
        "OpenAI result preview:",
        JSON.stringify(ocrResult).substring(0, 500)
      );

      // Step 3: Update Firestore with results
      console.log("Updating Firestore with results...");
      await updateReceiptStatusV2(receiptId, "processed", ocrResult);
      console.log("Firestore update completed");

      // Step 4: Note that original image deletion is handled by resize extension
      console.log(
        "Original image deletion is handled by Firebase resize extension"
      );
      console.log("Storage cost optimization completed");

      console.log("=== RECEIPT PROCESSING COMPLETED SUCCESSFULLY ===");
    } catch (error) {
      console.error("=== ERROR IN PROCESS RECEIPT V2 FUNCTION ===");
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

      // Try to save error to Firestore
      try {
        const pathParts = event.data.name.split("/");
        const fileName = pathParts[2];
        let receiptId = fileName.replace(".jpg", "").replace(".jpeg", "");
        receiptId = receiptId.replace(/_800x800$/, "").replace(/_resized$/, "");

        await updateReceiptStatusV2(receiptId, "error", {
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : "No stack trace",
          timestamp: new Date(),
        });
        console.log("Error saved to Firestore");
      } catch (updateError) {
        console.error("Failed to save error to Firestore:", updateError);
      }
    }
  }
);

async function processWithOpenAI(text: string): Promise<OCRResult> {
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
You are an expert at analyzing construction business receipts, particularly from hardware stores like Home Depot, Lowe's, etc.

RECEIPT TEXT:
${text}

AVAILABLE CATEGORIES: ${categories.join(", ")}

CRITICAL PARSING INSTRUCTIONS:

1. TOTAL AMOUNT - Look for the final "TOTAL" at the bottom (after tax). This is the authoritative amount.

2. QUANTITY FORMATS - Recognize these patterns:
   - "3@64.90" means 3 items at $64.90 each = $194.70 total
   - "2 x 4 @ 8.99" means 2 items at $8.99 each = $17.98 total
   - "QTY 5 $12.00" means 5 items at $12.00 each = $60.00 total

3. ITEM EXTRACTION:
   - Item descriptions often span multiple lines with product codes first
   - Ignore product codes/SKUs in the description
   - Extract clean product names (e.g., "24 WHITE VAN. W/CULT. MARBLE GLAC BAY BATH VAN. WITH SINK")
   - For each item, calculate: totalPrice = quantity * unitPrice

4. DISCOUNTS:
   - "NLP Savings" or "NEW LOWER PRICE" affects the item above it
   - Subtract discount from the item's price
   - If "NLP Savings $20.00" appears, reduce that item by $20

5. SUBTOTAL & TAX:
   - Extract "SUBTOTAL" value (before tax)
   - Extract "SALES TAX" or "TAX" value
   - Verify: SUBTOTAL + TAX = TOTAL (within $0.10 tolerance)

6. CARD INFO:
   - Extract last 4 digits from patterns like "XXXXXXXXXXXX7974" or "CARD 5287"

7. DATE:
   - Convert to YYYY-MM-DD format
   - Handle formats like "09/07/20", "04/25/19", "12/20/17"

8. CATEGORIZATION:
   - Assign each item to most relevant category
   - Bathroom items → Plumbing
   - Ceiling panels, lumber → Materials
   - Faucets, sinks → Plumbing
   - Spray paint → Materials or Tools
   - Power tools → Tools
   - If unclear → Other

Return JSON with this EXACT structure:
{
  "totalAmount": number,
  "subtotal": number,
  "tax": number,
  "merchant": "string",
  "date": "YYYY-MM-DD",
  "creditCardLastFour": "string (4 digits only)",
  "items": [
    {
      "name": "string (clean description)",
      "quantity": number,
      "unitPrice": number,
      "price": number (quantity * unitPrice),
      "category": "string (from available categories)"
    }
  ],
  "rawText": "string"
}

VALIDATION RULES:
- Sum of all item prices should approximately equal subtotal (within 5%)
- If you cannot determine quantity, use 1 and set unitPrice = price
- If you cannot determine a price, set unitPrice and price to 0
- Always return valid JSON, no additional text
`;

  try {
    // Use hardcoded API key for now
    const apiKey =
      "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";

    const openai = new OpenAI({
      apiKey: apiKey.trim(),
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

    // NEW: Add validation and warnings
    const validatedResult = validateOCRResult(ocrResult);

    // Log warnings if any
    if (
      validatedResult.validationWarnings &&
      validatedResult.validationWarnings.length > 0
    ) {
      console.warn("Validation warnings:", validatedResult.validationWarnings);
    }

    console.log("OpenAI processing completed successfully");
    return validatedResult;
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

function validateOCRResult(ocrResult: OCRResult): OCRResult {
  const warnings: string[] = [];
  let needsReview = false;

  // Calculate sum of item prices
  const calculatedSubtotal = ocrResult.items.reduce(
    (sum, item) => sum + (item.price || 0),
    0
  );

  // Check if we have subtotal from receipt
  if (ocrResult.subtotal) {
    const subtotalDiff = Math.abs(calculatedSubtotal - ocrResult.subtotal);
    const subtotalDiffPercent = (subtotalDiff / ocrResult.subtotal) * 100;

    if (subtotalDiffPercent > 5) {
      warnings.push(
        `Item total mismatch: Items sum to $${calculatedSubtotal.toFixed(
          2
        )}, but receipt subtotal is $${ocrResult.subtotal.toFixed(
          2
        )} (${subtotalDiffPercent.toFixed(1)}% difference)`
      );
      needsReview = true;
    }
  }

  // Check if total = subtotal + tax
  if (ocrResult.subtotal && ocrResult.tax) {
    const expectedTotal = ocrResult.subtotal + ocrResult.tax;
    const totalDiff = Math.abs(expectedTotal - ocrResult.totalAmount);

    if (totalDiff > 0.1) {
      warnings.push(
        `Total calculation mismatch: Subtotal ($${ocrResult.subtotal.toFixed(
          2
        )}) + Tax ($${ocrResult.tax.toFixed(2)}) = $${expectedTotal.toFixed(
          2
        )}, but receipt total is $${ocrResult.totalAmount.toFixed(2)}`
      );
      needsReview = true;
    }
  }

  // Check for items with 0 price
  const itemsWithZeroPrice = ocrResult.items.filter((item) => item.price === 0);
  if (itemsWithZeroPrice.length > 0) {
    warnings.push(
      `${itemsWithZeroPrice.length} item(s) have unknown prices and were set to $0.00`
    );
    needsReview = true;
  }

  // Check for missing critical data
  if (!ocrResult.merchant || ocrResult.merchant === "Unknown") {
    warnings.push("Merchant name could not be determined");
    needsReview = true;
  }

  if (!ocrResult.date) {
    warnings.push("Transaction date could not be determined");
    needsReview = true;
  }

  // Add validation results to OCR result
  const result = {
    ...ocrResult,
    needsReview,
  };

  // Only add validationWarnings if there are warnings
  if (warnings.length > 0) {
    result.validationWarnings = warnings;
  }

  return result;
}

// V2: Update receipt status with inline Firestore initialization
async function updateReceiptStatusV2(
  receiptId: string,
  status: "processing" | "processed" | "error",
  data?: any
) {
  console.log("=== UPDATE RECEIPT STATUS V2 FUNCTION STARTED ===");
  console.log("Receipt ID:", receiptId);
  console.log("Status:", status);
  console.log(
    "Data preview:",
    data ? JSON.stringify(data).substring(0, 200) + "..." : "null"
  );

  try {
    // INLINE INITIALIZATION - Initialize Firestore inside function
    console.log("Initializing Firestore...");
    const db = getFirestore();
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

      // Add review flags (only if they exist)
      if (data.needsReview) {
        updateData.needsReview = true;
      }
      // Only add validationWarnings if it exists and has items
      if (
        data.validationWarnings &&
        Array.isArray(data.validationWarnings) &&
        data.validationWarnings.length > 0
      ) {
        updateData.validationWarnings = data.validationWarnings;
      }

      console.log("Adding processed data to update");
    } else if (status === "error") {
      if (typeof data === "string") {
        updateData.errorMessage = data;
      } else if (data && typeof data === "object") {
        // Handle error objects with detailed information
        updateData.errorMessage = data.errorMessage || "Unknown error";
        updateData.errorStack = data.errorStack;
        updateData.errorTimestamp = data.timestamp;
      }
      console.log("Adding error data to update");
    }

    console.log("Update data:", JSON.stringify(updateData, null, 2));
    await receiptRef.update(updateData);
    console.log(`Updated receipt ${receiptId} status to ${status}`);
    console.log(
      "=== UPDATE RECEIPT STATUS V2 FUNCTION COMPLETED SUCCESSFULLY ==="
    );
  } catch (error) {
    console.error("=== ERROR IN UPDATE RECEIPT STATUS V2 FUNCTION ===");
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

// V2: Alternative trigger: Process receipt when document is created
export const processReceiptOnCreateV2 = onDocumentCreated(
  {
    region: "us-east1",
    memory: "256MiB",
    document: "receipts/{receiptId}",
  },
  async (event) => {
    // IMMEDIATE LOGGING - Before any try-catch
    console.log("=== PROCESS RECEIPT ON CREATE V2 INVOKED ===");

    try {
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
        console.log("=== PROCESS RECEIPT ON CREATE V2 COMPLETED - SKIPPED ===");
        return;
      }

      console.log("Processing receipt document:", receiptId);
      console.log("Receipt data:", JSON.stringify(receiptData, null, 2));

      // INLINE INITIALIZATION - Initialize Firebase services inside function
      console.log("Initializing Firebase services...");
      const storage = getStorage();
      const visionClient = new ImageAnnotatorClient();
      console.log("Firebase services initialized successfully");

      // Wait a moment for Storage upload to complete
      console.log("Waiting for Storage upload to complete...");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Get image from Storage using the receiptId as filename
      const userId = receiptData.userId;
      const storagePath = `receipts/${userId}/${receiptId}.jpg`;
      console.log("Looking for image at path:", storagePath);

      // Try the original filename first
      const bucketObj = storage.bucket();
      let file = bucketObj.file(storagePath);

      // Check if file exists
      const [exists] = await file.exists();
      console.log("File exists at original path:", exists);

      // If file doesn't exist, try resized version
      if (!exists) {
        console.log("Original file not found, trying resized version...");
        const resizedPath = `receipts/${userId}/${receiptId}_800x800.jpg`;
        file = bucketObj.file(resizedPath);
        console.log("Looking for resized image at path:", resizedPath);
        const [resizedExists] = await file.exists();
        console.log("File exists at resized path:", resizedExists);

        if (!resizedExists) {
          console.error(
            "Image file not found at either original or resized path"
          );
          await updateReceiptStatusV2(
            receiptId,
            "error",
            "Image file not found at any path"
          );
          return;
        }
      } else {
        console.log("Found file at original path, proceeding with OCR");
      }

      // Download image for OCR processing
      console.log("Downloading image for OCR...");
      const [imageBuffer] = await file.download();
      console.log("Image downloaded, size:", imageBuffer.length, "bytes");

      // Run OCR with Google Vision API
      console.log("Running OCR with Google Vision API...");
      const [result] = await visionClient.textDetection({
        image: { content: imageBuffer },
      });
      console.log("Vision API call completed");

      const detections = result.textAnnotations;
      if (!detections || detections.length === 0) {
        console.log("No text detected in image");
        await updateReceiptStatusV2(receiptId, "error", "No text detected");
        return;
      }

      // Extract full text
      const fullText = detections[0]?.description || "";
      console.log("Extracted text length:", fullText.length);
      console.log(
        "Extracted text preview:",
        fullText.substring(0, 200) + "..."
      );

      // Process with OpenAI
      console.log("Processing with OpenAI...");
      const ocrResult = await processWithOpenAI(fullText);
      console.log("OpenAI processing completed");
      console.log(
        "OpenAI result preview:",
        JSON.stringify(ocrResult).substring(0, 500)
      );

      // Update Firestore with results
      console.log("Updating Firestore with results...");
      await updateReceiptStatusV2(receiptId, "processed", ocrResult);
      console.log("Firestore update completed");

      console.log("=== RECEIPT PROCESSING COMPLETED SUCCESSFULLY ===");
    } catch (error) {
      console.error("=== ERROR IN PROCESS RECEIPT ON CREATE V2 FUNCTION ===");
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

      // Try to save error to Firestore
      try {
        const receiptId = event.params.receiptId;
        await updateReceiptStatusV2(receiptId, "error", {
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : "No stack trace",
          timestamp: new Date(),
        });
        console.log("Error saved to Firestore");
      } catch (updateError) {
        console.error("Failed to save error to Firestore:", updateError);
      }
    }
  }
);
