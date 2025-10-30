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
import type { IProjectStatus } from "~/types";
import { DEFAULT_PROJECT_STATUSES } from "~/types";

export const useProjectStatuses = () => {
  const db = useFirestore();
  const { user } = useAppAuth();

  const projectStatusesCollection = computed(() => {
    if (!user.value) return null;
    return collection(db, "projectStatuses");
  });

  const projectStatusesQuery = computed(() => {
    if (!user.value || !projectStatusesCollection.value) return null;
    return query(
      projectStatusesCollection.value,
      where("userId", "in", [user.value.id, "__default__"])
    );
  });

  const { data: customProjectStatuses, pending } =
    useCollection<IProjectStatus>(projectStatusesQuery, {
      wait: true,
      once: false,
    });

  const allProjectStatuses = computed(() => {
    const defaults = DEFAULT_PROJECT_STATUSES.map((status, index) => ({
      ...status,
      id: `default-${index}`,
      userId: "__default__",
      createdAt: new Date(),
    }));

    return [...defaults, ...(customProjectStatuses.value || [])];
  });

  const getProjectStatusByName = (name: string) => {
    return allProjectStatuses.value.find(
      (status) => status.name.toLowerCase() === name.toLowerCase()
    );
  };

  const createProjectStatus = async (
    name: string,
    icon: string,
    color: string
  ) => {
    if (!user.value || !projectStatusesCollection.value)
      throw new Error("User not authenticated");

    // Check if project status already exists
    const existing = getProjectStatusByName(name);
    if (existing) {
      return { id: null, error: "Project status already exists" };
    }

    const projectStatusData = {
      name,
      icon,
      color,
      isDefault: false,
      userId: user.value.id,
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(
        projectStatusesCollection.value,
        projectStatusData as any
      );
      return { id: docRef.id, error: null };
    } catch (error: unknown) {
      return {
        id: null,
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const updateProjectStatus = async (
    id: string,
    updates: Partial<IProjectStatus>
  ) => {
    if (!projectStatusesCollection.value)
      throw new Error("Collection not available");

    try {
      await updateDoc(doc(projectStatusesCollection.value, id), updates as any);
      return { error: null };
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const deleteProjectStatus = async (id: string) => {
    if (!projectStatusesCollection.value)
      throw new Error("Collection not available");

    try {
      await deleteDoc(doc(projectStatusesCollection.value, id));
      return { error: null };
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  return {
    allProjectStatuses,
    customProjectStatuses,
    pending,
    getProjectStatusByName,
    createProjectStatus,
    updateProjectStatus,
    deleteProjectStatus,
  };
};
