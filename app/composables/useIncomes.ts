import {
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { useFirestore, useCollection } from "vuefire";
import { useAppAuth } from "./useAuth";
import type { IIncome, IIncomeForm } from "~/types";

export const useIncomes = () => {
  const db = useFirestore();
  const { user } = useAppAuth();

  const incomesCollection = computed(() => {
    if (!user.value) return null;
    return collection(db, "incomes");
  });

  const incomesQuery = computed(() => {
    if (!user.value || !incomesCollection.value) return null;
    return query(
      incomesCollection.value,
      where("userId", "==", user.value.id),
      orderBy("date", "desc")
    );
  });

  const { data: incomes, pending } = useCollection<IIncome>(incomesQuery);

  const totalIncome = computed(() => {
    return incomes.value?.reduce((sum, inc) => sum + inc.amount, 0) || 0;
  });

  const incomesByProject = computed(() => {
    const grouped = new Map<string, IIncome[]>();
    incomes.value?.forEach((income) => {
      if (income.projectId) {
        const projectIncomes = grouped.get(income.projectId) || [];
        projectIncomes.push(income);
        grouped.set(income.projectId, projectIncomes);
      }
    });
    return grouped;
  });

  const createIncome = async (data: IIncomeForm) => {
    if (!user.value || !incomesCollection.value)
      throw new Error("User not authenticated");

    const incomeData = {
      ...data,
      userId: user.value.id,
      date: Timestamp.fromDate(data.date),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(incomesCollection.value, incomeData as any);
      return { id: docRef.id, error: null };
    } catch (error: any) {
      return { id: null, error: error.message };
    }
  };

  const updateIncome = async (id: string, data: Partial<IIncomeForm>) => {
    if (!incomesCollection.value) throw new Error("Collection not available");

    try {
      const updateData: any = {
        updatedAt: serverTimestamp(),
      };

      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.description) updateData.description = data.description;
      if (data.projectId !== undefined) updateData.projectId = data.projectId;
      if (data.accountId !== undefined) updateData.accountId = data.accountId;
      if (data.date) updateData.date = Timestamp.fromDate(data.date);

      await updateDoc(doc(incomesCollection.value, id), updateData);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const deleteIncome = async (id: string) => {
    if (!incomesCollection.value) throw new Error("Collection not available");

    try {
      await deleteDoc(doc(incomesCollection.value, id));
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  return {
    incomes,
    totalIncome,
    incomesByProject,
    pending,
    createIncome,
    updateIncome,
    deleteIncome,
  };
};
