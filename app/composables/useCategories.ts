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
import type { ICategory } from "~/types";
import { DEFAULT_CATEGORIES } from "~/types";

export const useCategories = () => {
  const db = useFirestore();
  const { user } = useAppAuth();

  const categoriesCollection = computed(() => {
    if (!user.value) return null;
    return collection(db, "categories");
  });

  const categoriesQuery = computed(() => {
    if (!user.value || !categoriesCollection.value) return null;
    return query(
      categoriesCollection.value,
      where("userId", "in", [user.value.id, "__default__"])
    );
  });

  const { data: customCategories, pending } =
    useCollection<ICategory>(categoriesQuery);

  const allCategories = computed(() => {
    const defaults = DEFAULT_CATEGORIES.map((cat, index) => ({
      ...cat,
      id: `default-${index}`,
      userId: "__default__",
      createdAt: new Date(),
    }));

    return [...defaults, ...(customCategories.value || [])];
  });

  const getCategoryById = (id: string) => {
    return allCategories.value.find((cat) => cat.id === id);
  };

  const getCategoryByName = (name: string) => {
    return allCategories.value.find(
      (cat) => cat.name.toLowerCase() === name.toLowerCase()
    );
  };

  const createCategory = async (name: string, color: string, icon?: string) => {
    if (!user.value || !categoriesCollection.value)
      throw new Error("User not authenticated");

    // Check if category already exists
    const existing = getCategoryByName(name);
    if (existing) {
      return { id: null, error: "Category already exists" };
    }

    const categoryData = {
      name,
      color,
      icon,
      isDefault: false,
      userId: user.value.id,
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(
        categoriesCollection.value,
        categoryData as any
      );
      return { id: docRef.id, error: null };
    } catch (error: any) {
      return { id: null, error: error.message };
    }
  };

  const updateCategory = async (id: string, updates: Partial<ICategory>) => {
    if (!categoriesCollection.value)
      throw new Error("Collection not available");

    try {
      await updateDoc(doc(categoriesCollection.value, id), updates as any);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const deleteCategory = async (id: string) => {
    if (!categoriesCollection.value)
      throw new Error("Collection not available");

    try {
      await deleteDoc(doc(categoriesCollection.value, id));
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  return {
    allCategories,
    customCategories,
    pending,
    getCategoryById,
    getCategoryByName,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
