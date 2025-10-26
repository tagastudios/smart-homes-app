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
import type { IProject, IProjectForm } from "~/types";

export const useProjects = () => {
  const db = useFirestore();
  const { user } = useAppAuth();

  const projectsCollection = computed(() => {
    if (!user.value) return null;
    return collection(db, "projects");
  });

  const projectsQuery = computed(() => {
    if (!user.value || !projectsCollection.value) return null;
    return query(
      projectsCollection.value,
      where("userId", "==", user.value.id)
    );
  });

  const { data: projects, pending } = useCollection<IProject>(projectsQuery);

  const activeProjects = computed(() => {
    return projects.value?.filter((p) => p.status === "active") || [];
  });

  const projectById = computed(() => {
    return (id: string) => projects.value?.find((p) => p.id === id);
  });

  const getAmountLeftToSpend = (project: IProject) => {
    return Math.max(0, project.budget - project.spent);
  };

  const getBudgetPercentage = (project: IProject) => {
    if (project.budget === 0) return 0;
    return Math.min(100, (project.spent / project.budget) * 100);
  };

  const isOverBudget = (project: IProject) => {
    return project.spent > project.budget;
  };

  const createProject = async (data: IProjectForm) => {
    if (!user.value || !projectsCollection.value)
      throw new Error("User not authenticated");

    const projectData = {
      ...data,
      spent: 0,
      userId: user.value.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(projectsCollection.value, projectData as any);
      return { id: docRef.id, error: null };
    } catch (error: any) {
      return { id: null, error: error.message };
    }
  };

  const updateProject = async (id: string, data: Partial<IProjectForm>) => {
    if (!projectsCollection.value) throw new Error("Collection not available");

    try {
      await updateDoc(doc(projectsCollection.value, id), {
        ...data,
        updatedAt: serverTimestamp(),
      } as any);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const deleteProject = async (id: string) => {
    if (!projectsCollection.value) throw new Error("Collection not available");

    try {
      await deleteDoc(doc(projectsCollection.value, id));
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const updateProjectSpent = async (id: string, additionalAmount: number) => {
    if (!projectsCollection.value) throw new Error("Collection not available");

    const project = projects.value?.find((p) => p.id === id);
    if (!project) return { error: "Project not found" };

    const newSpent = project.spent + additionalAmount;

    try {
      await updateDoc(doc(projectsCollection.value, id), {
        spent: newSpent,
        updatedAt: serverTimestamp(),
      } as any);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  return {
    projects,
    activeProjects,
    pending,
    projectById,
    getAmountLeftToSpend,
    getBudgetPercentage,
    isOverBudget,
    createProject,
    updateProject,
    deleteProject,
    updateProjectSpent,
  };
};
