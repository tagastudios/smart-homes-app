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
import type { ICardBrand } from "~/types";
import { CARD_BRANDS } from "~/types";

export const useCardBrands = () => {
  const db = useFirestore();
  const { user } = useAppAuth();

  const cardBrandsCollection = computed(() => {
    if (!user.value) return null;
    return collection(db, "cardBrands");
  });

  const cardBrandsQuery = computed(() => {
    if (!user.value || !cardBrandsCollection.value) return null;
    return query(
      cardBrandsCollection.value,
      where("userId", "in", [user.value.id, "__default__"])
    );
  });

  const { data: customCardBrands, pending } = useCollection<ICardBrand>(
    cardBrandsQuery,
    {
      wait: true,
      once: false,
    }
  );

  const allCardBrands = computed(() => {
    const defaults = Object.entries(CARD_BRANDS).map(([key, brand], index) => ({
      ...brand,
      id: `default-${index}`,
      name: brand.label,
      value: key,
      isDefault: true,
      userId: "__default__",
      createdAt: new Date(),
    }));

    return [...defaults, ...(customCardBrands.value || [])];
  });

  const getCardBrandByName = (name: string) => {
    return allCardBrands.value.find(
      (brand) => brand.name.toLowerCase() === name.toLowerCase()
    );
  };

  const createCardBrand = async (name: string, icon: string, color: string) => {
    if (!user.value || !cardBrandsCollection.value)
      throw new Error("User not authenticated");

    // Check if card brand already exists
    const existing = getCardBrandByName(name);
    if (existing) {
      return { id: null, error: "Card brand already exists" };
    }

    const cardBrandData = {
      name,
      icon,
      color,
      isDefault: false,
      userId: user.value.id,
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(
        cardBrandsCollection.value,
        cardBrandData as any
      );
      return { id: docRef.id, error: null };
    } catch (error: unknown) {
      return {
        id: null,
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const updateCardBrand = async (id: string, updates: Partial<ICardBrand>) => {
    if (!cardBrandsCollection.value)
      throw new Error("Collection not available");

    try {
      await updateDoc(doc(cardBrandsCollection.value, id), updates as any);
      return { error: null };
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const deleteCardBrand = async (id: string) => {
    if (!cardBrandsCollection.value)
      throw new Error("Collection not available");

    try {
      await deleteDoc(doc(cardBrandsCollection.value, id));
      return { error: null };
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  return {
    allCardBrands,
    customCardBrands,
    pending,
    getCardBrandByName,
    createCardBrand,
    updateCardBrand,
    deleteCardBrand,
  };
};
