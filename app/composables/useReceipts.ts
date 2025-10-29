import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable,
  listAll,
} from "firebase/storage";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy,
  deleteDoc,
  getDoc,
  getDocs,
  limit,
} from "firebase/firestore";
import { useStorage, useFirestore, useCollection } from "vuefire";
import { useAppAuth } from "./useAuth";
import type { IReceipt, IOcrResult } from "~/types";

export const useReceipts = () => {
  const storage = useStorage();
  const db = useFirestore();
  const { user } = useAppAuth();

  const receiptsCollection = computed(() => {
    if (!user.value) return null;
    return collection(db, "receipts");
  });

  const receiptsQuery = computed(() => {
    if (!user.value || !receiptsCollection.value) return null;
    return query(
      receiptsCollection.value,
      where("userId", "==", user.value.id),
      orderBy("uploadDate", "desc")
    );
  });

  // Real-time receipts collection - only when user is authenticated
  const receipts = useCollection(receiptsQuery, {
    wait: true,
    once: false,
  });
  const isLoading = computed(() => receipts.value === undefined);

  const uploadReceiptImage = async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ receiptId: string; imageUrl: string; error: string | null }> => {
    if (!user.value || !storage) {
      return {
        receiptId: "",
        imageUrl: "",
        error: "User not authenticated or storage not available",
      };
    }

    try {
      // Set metadata for 5-year auto-delete
      const deleteAfterDate = new Date(
        Date.now() + 5 * 365 * 24 * 60 * 60 * 1000
      );

      // Get the next receipt number for this user
      const receiptsCol = receiptsCollection.value;
      if (!receiptsCol) {
        return {
          receiptId: "",
          imageUrl: "",
          error: "Receipts collection not available",
        };
      }

      // Query for the latest receipt number for this user
      const latestReceiptQuery = query(
        receiptsCol,
        where("userId", "==", user.value.id),
        orderBy("receiptNumber", "desc"),
        limit(1)
      );

      const latestReceiptSnapshot = await getDocs(latestReceiptQuery);
      const nextReceiptNumber = latestReceiptSnapshot.empty
        ? 1
        : (latestReceiptSnapshot.docs[0].data().receiptNumber || 0) + 1;

      // Create receipt record first
      const receiptData = {
        imageUrl: "", // Will be updated after upload
        uploadDate: serverTimestamp(),
        status: "uploaded" as const,
        userId: user.value.id,
        receiptNumber: nextReceiptNumber,
      };

      const docRef = await addDoc(receiptsCol, receiptData as any);

      // Use Firestore document ID as filename
      const fileName = `${docRef.id}.jpg`;
      const storagePath = `receipts/${user.value.id}/${fileName}`;
      const storageRef = ref(storage, storagePath);

      console.log("Uploading to Storage path:", storagePath);
      console.log("Storage ref:", storageRef);

      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file, {
        customMetadata: {
          deleteAfter: deleteAfterDate.toISOString(),
          firestoreDocId: docRef.id, // Use Firestore doc ID
          userId: user.value.id,
        },
      });

      // Track upload progress
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          throw error;
        }
      );

      await uploadTask;

      // Get download URL
      const imageUrl = await getDownloadURL(storageRef);
      console.log("Generated download URL:", imageUrl);

      // Update receipt with image URL
      await updateDoc(doc(receiptsCol, docRef.id), {
        imageUrl,
        status: "processing",
      });

      return {
        receiptId: docRef.id,
        imageUrl,
        error: null,
      };
    } catch (error: unknown) {
      console.error("Error uploading receipt:", error);
      return {
        receiptId: "",
        imageUrl: "",
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const getReceiptById = async (
    receiptId: string
  ): Promise<IReceipt | null> => {
    if (!db) return null;

    try {
      const docRef = doc(db, "receipts", receiptId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as IReceipt;
      }
      return null;
    } catch (error) {
      console.error("Error fetching receipt:", error);
      return null;
    }
  };

  const getReceiptsByStatus = (status: string) => {
    return computed(() => {
      if (!receipts.value) return [];
      return receipts.value.filter((receipt) => receipt.status === status);
    });
  };

  const updateReceiptStatus = async (
    receiptId: string,
    status: IReceipt["status"],
    ocrData?: IOcrResult
  ) => {
    if (!receiptsCollection.value) return { error: "Collection not available" };

    try {
      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (status === "processed" && ocrData) {
        updateData.processedDate = serverTimestamp();
        updateData.ocrData = ocrData;
      }

      await updateDoc(
        doc(receiptsCollection.value, receiptId),
        updateData as any
      );
      return { error: null };
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const deleteReceipt = async (receiptId: string, imageUrl: string) => {
    if (!storage || !receiptsCollection.value) {
      return { error: "Storage or collection not available" };
    }

    try {
      // Delete from Storage
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);

      // Delete from Firestore
      await deleteDoc(doc(receiptsCollection.value, receiptId));

      return { error: null };
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const approveReceipt = async (
    receiptId: string,
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      category: string;
    }>,
    projectId: string,
    accountId: string
  ) => {
    if (!receiptsCollection.value) return { error: "Collection not available" };

    try {
      // Update receipt status to approved
      await updateDoc(doc(receiptsCollection.value, receiptId), {
        status: "approved",
        approvedAt: serverTimestamp(),
        approvedItems: items,
        projectId,
        accountId,
      });

      return { error: null };
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const rejectReceipt = async (receiptId: string, imageUrl: string) => {
    return await deleteReceipt(receiptId, imageUrl);
  };

  const getReceiptImageUrl = (imageUrl: string) => {
    return imageUrl;
  };

  const listStorageFiles = async (userId: string) => {
    if (!storage) return [];

    try {
      const listRef = ref(storage, `receipts/${userId}/`);
      const result = await listAll(listRef);
      console.log(
        "Files in Storage:",
        result.items.map((item) => item.name)
      );
      return result.items;
    } catch (error) {
      console.error("Error listing storage files:", error);
      return [];
    }
  };

  const findCorrectImageUrl = async (
    receiptId: string,
    userId: string,
    currentImageUrl: string
  ) => {
    if (!storage) return currentImageUrl;

    try {
      // Try the expected filename first
      const expectedPath = `receipts/${userId}/${receiptId}.jpg`;
      const expectedRef = ref(storage, expectedPath);

      try {
        const url = await getDownloadURL(expectedRef);
        console.log("Found image with expected filename:", url);
        return url;
      } catch (error) {
        console.log("Expected filename not found, searching alternatives...");
      }

      // List all files and find one that might match
      const listRef = ref(storage, `receipts/${userId}/`);
      const result = await listAll(listRef);

      for (const item of result.items) {
        // Check if the filename contains the receipt ID
        if (
          item.name.includes(receiptId) ||
          item.name.includes(receiptId.slice(-8))
        ) {
          try {
            const url = await getDownloadURL(item);
            console.log("Found alternative image:", item.name, url);
            return url;
          } catch (error) {
            console.log("Failed to get URL for:", item.name);
          }
        }
      }

      console.log("No matching image found, using original URL");
      return currentImageUrl;
    } catch (error) {
      console.error("Error finding correct image URL:", error);
      return currentImageUrl;
    }
  };

  return {
    receipts,
    isLoading,
    receiptsQuery,
    uploadReceiptImage,
    getReceiptById,
    getReceiptsByStatus,
    updateReceiptStatus,
    deleteReceipt,
    approveReceipt,
    rejectReceipt,
    getReceiptImageUrl,
    listStorageFiles,
    findCorrectImageUrl,
  };
};
