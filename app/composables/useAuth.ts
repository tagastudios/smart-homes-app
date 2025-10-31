import { useCurrentUser } from "vuefire";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import type { IUser } from "~/types";

export const useAppAuth = () => {
  const user = useCurrentUser(); // VueFire's reactive user
  const router = useRouter();
  const auth = getAuth();

  const appUser = computed(() => {
    if (!user.value) return null;
    return {
      id: user.value.uid,
      email: user.value.email!,
      displayName: user.value.displayName || undefined,
      createdAt: user.value.metadata.creationTime
        ? new Date(user.value.metadata.creationTime)
        : new Date(),
    } as IUser;
  });

  const isAuthenticated = computed(() => !!user.value);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return { user: userCredential.user, error: null };
    } catch (error: unknown) {
      return {
        user: null,
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      return { user: userCredential.user, error: null };
    } catch (error: unknown) {
      return {
        user: null,
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      return { user: userCredential.user, error: null };
    } catch (error: unknown) {
      return {
        user: null,
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      await router.push("/auth/login");
      return { error: null };
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    try {
      if (!user.value || !user.value.email) {
        return { error: "User not authenticated" };
      }

      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        user.value.email,
        currentPassword
      );
      await reauthenticateWithCredential(user.value, credential);

      // Update password
      await updatePassword(user.value, newPassword);
      return { error: null };
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  return {
    user: appUser,
    isAuthenticated,
    login,
    signup,
    signInWithGoogle,
    resetPassword,
    signOut,
    changePassword,
  };
};
