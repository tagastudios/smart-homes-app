import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
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
} from "firebase/firestore";
import { useStorage, useFirestore } from "vuefire";
import { useAppAuth } from "./useAuth";
import type { IReceipt } from "~/types";

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

  const uploadReceipt = async (
    file: File
  ): Promise<{ receiptId: string; imageUrl: string; error: string | null }> => {
    if (!user.value || !storage) {
      return {
        receiptId: "",
        imageUrl: "",
        error: "User not authenticated or storage not available",
      };
    }

    try {
      // Create unique filename
      const timestamp = Date.now();
      const fileName = `${user.value.id}/${timestamp}-${file.name}`;
      const storageRef = ref(storage, `receipts/${fileName}`);

      // Upload file
      await uploadBytes(storageRef, file);

      // Get download URL
      const imageUrl = await getDownloadURL(storageRef);

      // Create receipt record
      const receiptData = {
        imageUrl,
        uploadDate: serverTimestamp(),
        status: "uploaded" as const,
        userId: user.value.id,
      };

      const receiptsCol = receiptsCollection.value;
      if (!receiptsCol) {
        return {
          receiptId: "",
          imageUrl: "",
          error: "Receipts collection not available",
        };
      }

      const docRef = await addDoc(receiptsCol, receiptData as any);

      return {
        receiptId: docRef.id,
        imageUrl,
        error: null,
      };
    } catch (error: any) {
      console.error("Error uploading receipt:", error);
      return { receiptId: "", imageUrl: "", error: error.message };
    }
  };

  const updateReceiptStatus = async (
    receiptId: string,
    status: IReceipt["status"],
    ocrData?: any
  ) => {
    if (!receiptsCollection.value) return { error: "Collection not available" };

    try {
      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (status === "processed") {
        updateData.processedDate = serverTimestamp();
      }

      await updateDoc(
        doc(receiptsCollection.value, receiptId),
        updateData as any
      );
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
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
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const getReceiptImageUrl = (imageUrl: string) => {
    return imageUrl;
  };

  return {
    receiptsQuery,
    uploadReceipt,
    updateReceiptStatus,
    deleteReceipt,
    getReceiptImageUrl,
  };
};
