import {
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { useFirestore, useCollection } from "vuefire";
import { useAppAuth } from "./useAuth";
import type { IAccountType } from "~/types";
import { DEFAULT_ACCOUNT_TYPES } from "~/types";

export const useAccountTypes = () => {
  const db = useFirestore();
  const { user } = useAppAuth();

  const accountTypesCollection = computed(() => {
    if (!user.value) return null;
    return collection(db, "accountTypes");
  });

  const accountTypesQuery = computed(() => {
    if (!user.value || !accountTypesCollection.value) return null;
    return query(
      accountTypesCollection.value,
      where("userId", "in", [user.value.id, "__default__"])
    );
  });

  const { data: customAccountTypes, pending } = useCollection<IAccountType>(
    accountTypesQuery,
    {
      wait: true,
      once: false,
    }
  );

  const allAccountTypes = computed(() => {
    const defaults = DEFAULT_ACCOUNT_TYPES.map((type, index) => ({
      ...type,
      id: `default-${index}`,
      userId: "__default__",
      createdAt: new Date(),
    }));

    return [...defaults, ...(customAccountTypes.value || [])];
  });

  const getAccountTypeByName = (name: string) => {
    return allAccountTypes.value.find(
      (type) => type.name.toLowerCase() === name.toLowerCase()
    );
  };

  const createAccountType = async (
    name: string,
    icon: string,
    color: string
  ) => {
    if (!user.value || !accountTypesCollection.value)
      throw new Error("User not authenticated");

    // Check if account type already exists
    const existing = getAccountTypeByName(name);
    if (existing) {
      return { id: null, error: "Account type already exists" };
    }

    const accountTypeData = {
      name,
      icon,
      color,
      isDefault: false,
      userId: user.value.id,
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(
        accountTypesCollection.value,
        accountTypeData as any
      );
      return { id: docRef.id, error: null };
    } catch (error: unknown) {
      return {
        id: null,
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const updateAccountType = async (
    id: string,
    updates: Partial<IAccountType>
  ) => {
    if (!accountTypesCollection.value)
      throw new Error("Collection not available");

    try {
      await updateDoc(doc(accountTypesCollection.value, id), updates as any);
      return { error: null };
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const deleteAccountType = async (id: string) => {
    if (!accountTypesCollection.value)
      throw new Error("Collection not available");

    try {
      await deleteDoc(doc(accountTypesCollection.value, id));
      return { error: null };
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  return {
    allAccountTypes,
    customAccountTypes,
    pending,
    getAccountTypeByName,
    createAccountType,
    updateAccountType,
    deleteAccountType,
  };
};
