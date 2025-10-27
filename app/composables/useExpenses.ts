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
import { useProjects } from "./useProjects";
import type { IExpense, IExpenseForm } from "~/types";

export const useExpenses = () => {
  const db = useFirestore();
  const { user } = useAppAuth();
  const { updateProjectSpent } = useProjects();

  const expensesCollection = computed(() => {
    if (!user.value) return null;
    return collection(db, "expenses");
  });

  const expensesQuery = computed(() => {
    if (!user.value || !expensesCollection.value) return null;
    return query(
      expensesCollection.value,
      where("userId", "==", user.value.id),
      orderBy("date", "desc")
    );
  });

  const { data: expenses, pending } = useCollection<IExpense>(expensesQuery, {
    wait: true,
    once: false,
  });

  const expensesByProject = computed(() => {
    const grouped = new Map<string, IExpense[]>();
    expenses.value?.forEach((expense) => {
      const projectExpenses = grouped.get(expense.projectId) || [];
      projectExpenses.push(expense);
      grouped.set(expense.projectId, projectExpenses);
    });
    return grouped;
  });

  const expensesByCategory = computed(() => {
    const grouped = new Map<string, IExpense[]>();
    expenses.value?.forEach((expense) => {
      const categoryExpenses = grouped.get(expense.category) || [];
      categoryExpenses.push(expense);
      grouped.set(expense.category, categoryExpenses);
    });
    return grouped;
  });

  const totalExpenses = computed(() => {
    return expenses.value?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  });

  const createExpense = async (
    data: IExpenseForm,
    receiptId?: string,
    receiptImageUrl?: string,
    ocrData?: any
  ) => {
    if (!user.value || !expensesCollection.value)
      throw new Error("User not authenticated");

    const expenseData = {
      ...data,
      receiptId,
      receiptImageUrl,
      ocrData,
      isManualEntry: !receiptId,
      userId: user.value.id,
      date: Timestamp.fromDate(data.date),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(expensesCollection.value, expenseData as any);

      // Update project spent amount
      if (data.projectId) {
        await updateProjectSpent(data.projectId, data.amount);
      }

      return { id: docRef.id, error: null };
    } catch (error: unknown) {
      return {
        id: null,
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const updateExpense = async (
    id: string,
    data: Partial<IExpenseForm>,
    oldAmount?: number
  ) => {
    if (!expensesCollection.value) throw new Error("Collection not available");

    const expense = expenses.value?.find((e) => e.id === id);
    if (!expense) return { error: "Expense not found" };

    try {
      const updateData: any = {
        updatedAt: serverTimestamp(),
      };

      if (data.amount !== undefined) {
        updateData.amount = data.amount;
      }
      if (data.category) updateData.category = data.category;
      if (data.projectId) updateData.projectId = data.projectId;
      if (data.accountId) updateData.accountId = data.accountId;
      if (data.description) updateData.description = data.description;
      if (data.date) updateData.date = Timestamp.fromDate(data.date);

      await updateDoc(doc(expensesCollection.value, id), updateData);

      // Update project spent if amount or project changed
      if (data.amount !== undefined || data.projectId !== undefined) {
        const newAmount =
          data.amount !== undefined ? data.amount : expense.amount;
        const oldAmount = expense.amount;
        const oldProjectId =
          data.projectId !== undefined ? expense.projectId : data.projectId;
        const newProjectId =
          data.projectId !== undefined ? data.projectId : expense.projectId;

        // Remove from old project
        if (oldProjectId && oldAmount) {
          await updateProjectSpent(oldProjectId, -oldAmount);
        }

        // Add to new project
        if (newProjectId && newAmount) {
          await updateProjectSpent(newProjectId, newAmount);
        }
      }

      return { error: null };
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const deleteExpense = async (id: string) => {
    if (!expensesCollection.value) throw new Error("Collection not available");

    const expense = expenses.value?.find((e) => e.id === id);
    if (!expense) return { error: "Expense not found" };

    try {
      await deleteDoc(doc(expensesCollection.value, id));

      // Update project spent amount (subtract)
      if (expense.projectId) {
        await updateProjectSpent(expense.projectId, -expense.amount);
      }

      return { error: null };
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  return {
    expenses,
    expensesByProject,
    expensesByCategory,
    totalExpenses,
    pending,
    createExpense,
    updateExpense,
    deleteExpense,
  };
};
