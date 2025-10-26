import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  getAuth,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import type { IUser } from "~/types";

export const useAppAuth = () => {
  const auth = getAuth();
  const router = useRouter();
  const currentUser = ref<User | null>(auth.currentUser);
  const isInitialized = ref(false);

  // Initialize auth state
  if (!isInitialized.value) {
    onAuthStateChanged(auth, (user) => {
      currentUser.value = user;
      isInitialized.value = true;
    });
  }

  const user = computed(() => {
    if (!currentUser.value) return null;
    return {
      id: currentUser.value.uid,
      email: currentUser.value.email!,
      displayName: currentUser.value.displayName || undefined,
      createdAt: currentUser.value.metadata.creationTime
        ? new Date(currentUser.value.metadata.creationTime)
        : new Date(),
    } as IUser;
  });

  const isAuthenticated = computed(() => !!currentUser.value);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
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
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      await router.push("/auth/login");
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  return {
    user,
    isAuthenticated,
    login,
    signup,
    resetPassword,
    signOut,
  };
};
