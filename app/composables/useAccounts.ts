import {
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useFirestore, useCollection, useDocument } from "vuefire";
import { useAppAuth } from "./useAuth";
import type { IAccount, IAccountForm } from "~/types";

export const useAccounts = () => {
  const db = useFirestore();
  const { user } = useAppAuth();

  const accountsCollection = computed(() => {
    if (!user.value) return null;
    return collection(db, "accounts");
  });

  const accountsQuery = computed(() => {
    if (!user.value || !accountsCollection.value) return null;
    return query(
      accountsCollection.value,
      where("userId", "==", user.value.id)
    );
  });

  const { data: accounts, pending } = useCollection<IAccount>(accountsQuery, {
    wait: true,
    once: false,
  });

  const activeAccounts = computed(() => {
    return accounts.value?.filter((acc) => acc.isActive) || [];
  });

  const createAccount = async (data: IAccountForm) => {
    if (!user.value || !accountsCollection.value)
      throw new Error("User not authenticated");

    const accountData = {
      ...data,
      userId: user.value.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const docRef = await addDoc(accountsCollection.value, accountData);
      return { id: docRef.id, error: null };
    } catch (error: unknown) {
      return {
        id: null,
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const updateAccount = async (id: string, data: Partial<IAccountForm>) => {
    if (!accountsCollection.value) throw new Error("Collection not available");

    try {
      await updateDoc(doc(accountsCollection.value, id), {
        ...data,
        updatedAt: new Date(),
      });
      return { error: null };
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const deleteAccount = async (id: string) => {
    if (!accountsCollection.value) throw new Error("Collection not available");

    try {
      await deleteDoc(doc(accountsCollection.value, id));
      return { error: null };
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const toggleAccountStatus = async (id: string, isActive: boolean) => {
    return updateAccount(id, { isActive });
  };

  return {
    accounts,
    activeAccounts,
    pending,
    createAccount,
    updateAccount,
    deleteAccount,
    toggleAccountStatus,
  };
};
