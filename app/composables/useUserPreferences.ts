import { doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { useFirestore, useDocument } from "vuefire";
import { useAppAuth } from "./useAuth";
import type { IUserPreferences } from "~/types";

const DEFAULT_PREFERENCES: Omit<IUserPreferences, "userId" | "updatedAt"> = {
  currency: "USD",
  dateFormat: "MM/DD/YYYY",
  theme: "dark",
  budgetAlertEnabled: false,
  budgetAlertThreshold: 80,
};

export const useUserPreferences = () => {
  const db = useFirestore();
  const { user } = useAppAuth();

  const preferencesDoc = computed(() => {
    if (!user.value) return null;
    return doc(db, "userPreferences", user.value.id);
  });

  const { data: preferences, pending } = useDocument<IUserPreferences>(
    preferencesDoc,
    {
      wait: false,
    }
  );

  const mergedPreferences = computed(() => {
    if (!preferences.value) {
      return {
        ...DEFAULT_PREFERENCES,
        userId: user.value?.id || "",
      };
    }
    return {
      ...DEFAULT_PREFERENCES,
      ...preferences.value,
    };
  });

  const updatePreferences = async (
    updates: Partial<Omit<IUserPreferences, "userId" | "updatedAt">>
  ) => {
    if (!user.value || !preferencesDoc.value) {
      throw new Error("User not authenticated");
    }

    try {
      await setDoc(
        preferencesDoc.value,
        {
          ...updates,
          userId: user.value.id,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return { error: null };
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  return {
    preferences: mergedPreferences,
    pending,
    updatePreferences,
  };
};
