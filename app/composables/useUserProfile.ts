import { doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { useFirestore, useDocument } from "vuefire";
import { useAppAuth } from "./useAuth";
import type { IUserProfile } from "~/types";

export const useUserProfile = () => {
  const db = useFirestore();
  const { user } = useAppAuth();

  const profileDoc = computed(() => {
    if (!user.value) return null;
    return doc(db, "userProfiles", user.value.id);
  });

  const { data: profile, pending } = useDocument<IUserProfile>(profileDoc, {
    wait: false,
  });

  const updateProfile = async (
    updates: Partial<Omit<IUserProfile, "userId" | "createdAt" | "updatedAt">>
  ) => {
    if (!user.value || !profileDoc.value) {
      throw new Error("User not authenticated");
    }

    try {
      const currentProfile = profile.value;
      await setDoc(
        profileDoc.value,
        {
          ...updates,
          userId: user.value.id,
          createdAt: currentProfile?.createdAt || serverTimestamp(),
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
    profile,
    pending,
    updateProfile,
  };
};
