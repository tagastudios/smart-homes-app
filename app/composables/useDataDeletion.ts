import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref, listAll, deleteObject } from "firebase/storage";
import { useFirestore, useStorage } from "vuefire";
import { useAppAuth } from "./useAuth";
import { useExpenses } from "./useExpenses";
import { useIncomes } from "./useIncomes";
import { useProjects } from "./useProjects";
import { useAccounts } from "./useAccounts";
import { useReceipts } from "./useReceipts";

export const useDataDeletion = () => {
  const db = useFirestore();
  const storage = useStorage();
  const { user } = useAppAuth();

  const deleteAllUserData = async () => {
    if (!user.value) {
      return { error: "User not authenticated" };
    }

    try {
      const userId = user.value.id;

      // Delete all expenses
      const expensesQuery = query(
        collection(db, "expenses"),
        where("userId", "==", userId)
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      const expenseDeletes = expensesSnapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "expenses", docSnap.id))
      );
      await Promise.all(expenseDeletes);

      // Delete all incomes
      const incomesQuery = query(
        collection(db, "incomes"),
        where("userId", "==", userId)
      );
      const incomesSnapshot = await getDocs(incomesQuery);
      const incomeDeletes = incomesSnapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "incomes", docSnap.id))
      );
      await Promise.all(incomeDeletes);

      // Delete all projects
      const projectsQuery = query(
        collection(db, "projects"),
        where("userId", "==", userId)
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      const projectDeletes = projectsSnapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "projects", docSnap.id))
      );
      await Promise.all(projectDeletes);

      // Delete all accounts
      const accountsQuery = query(
        collection(db, "accounts"),
        where("userId", "==", userId)
      );
      const accountsSnapshot = await getDocs(accountsQuery);
      const accountDeletes = accountsSnapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "accounts", docSnap.id))
      );
      await Promise.all(accountDeletes);

      // Delete all receipts
      const receiptsQuery = query(
        collection(db, "receipts"),
        where("userId", "==", userId)
      );
      const receiptsSnapshot = await getDocs(receiptsQuery);
      const receiptDeletes = receiptsSnapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "receipts", docSnap.id))
      );
      await Promise.all(receiptDeletes);

      // Delete user-specific categories
      const categoriesQuery = query(
        collection(db, "categories"),
        where("userId", "==", userId)
      );
      const categoriesSnapshot = await getDocs(categoriesQuery);
      const categoryDeletes = categoriesSnapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "categories", docSnap.id))
      );
      await Promise.all(categoryDeletes);

      // Delete user-specific account types
      const accountTypesQuery = query(
        collection(db, "accountTypes"),
        where("userId", "==", userId)
      );
      const accountTypesSnapshot = await getDocs(accountTypesQuery);
      const accountTypeDeletes = accountTypesSnapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "accountTypes", docSnap.id))
      );
      await Promise.all(accountTypeDeletes);

      // Delete user-specific project statuses
      const projectStatusesQuery = query(
        collection(db, "projectStatuses"),
        where("userId", "==", userId)
      );
      const projectStatusesSnapshot = await getDocs(projectStatusesQuery);
      const projectStatusDeletes = projectStatusesSnapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "projectStatuses", docSnap.id))
      );
      await Promise.all(projectStatusDeletes);

      // Delete user-specific card brands
      const cardBrandsQuery = query(
        collection(db, "cardBrands"),
        where("userId", "==", userId)
      );
      const cardBrandsSnapshot = await getDocs(cardBrandsQuery);
      const cardBrandDeletes = cardBrandsSnapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "cardBrands", docSnap.id))
      );
      await Promise.all(cardBrandDeletes);

      // Delete all receipt images from storage
      const receiptsFolderRef = ref(storage, `receipts/${userId}`);
      try {
        const receiptFilesList = await listAll(receiptsFolderRef);
        const fileDeletes = receiptFilesList.items.map((fileRef) =>
          deleteObject(fileRef)
        );
        await Promise.all(fileDeletes);
      } catch (storageError) {
        // Storage folder might not exist, continue
        console.log("No receipt files to delete or error:", storageError);
      }

      return { error: null };
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  return {
    deleteAllUserData,
  };
};
