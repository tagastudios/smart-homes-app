<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Projects
        </h1>
        <p class="text-gray-600 dark:text-gray-300 mt-1">
          Manage your construction projects and track budgets
        </p>
      </div>
      <UButton @click="openModal()" icon="i-heroicons-plus">
        New Project
      </UButton>
    </div>

    <div v-if="pending" class="text-center py-12">
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-8 h-8 animate-spin mx-auto"
      />
      <p class="text-gray-600 dark:text-gray-300 mt-2">Loading projects...</p>
    </div>

    <div
      v-else-if="projects && projects.length === 0"
      class="text-center py-12"
    >
      <p class="text-gray-600 dark:text-gray-300">
        No projects yet. Create your first project to start tracking expenses.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <UCard
        v-for="project in projects"
        :key="project.id"
        class="hover:shadow-lg transition-shadow"
      >
        <div class="space-y-4">
          <!-- Header -->
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ project.name }}
              </h3>
              <p
                v-if="project.description"
                class="text-sm text-gray-600 dark:text-gray-300 mt-1"
              >
                {{ project.description }}
              </p>
            </div>
            <UBadge :color="getStatusColor(project.status)">
              {{ project.status }}
            </UBadge>
          </div>

          <!-- Budget Progress -->
          <div>
            <div class="flex justify-between text-sm mb-2">
              <span class="text-gray-600 dark:text-gray-300">Budget</span>
              <span class="font-semibold text-gray-900 dark:text-white">
                ${{ formatCurrency(project.spent) }} / ${{
                  formatCurrency(project.budget)
                }}
              </span>
            </div>
            <UProgress
              :value="getBudgetPercentage(project)"
              :color="getBudgetColor(project)"
              size="md"
            />
            <div class="flex justify-between text-xs mt-2">
              <span class="text-gray-500 dark:text-gray-400">
                {{ getBudgetPercentage(project).toFixed(1) }}% used
              </span>
              <span
                :class="
                  isOverBudget(project) ? 'text-red-600' : 'text-green-600'
                "
              >
                {{
                  isOverBudget(project)
                    ? "$" +
                      formatCurrency(Math.abs(getAmountLeftToSpend(project))) +
                      " over"
                    : "$" +
                      formatCurrency(getAmountLeftToSpend(project)) +
                      " left"
                }}
              </span>
            </div>
          </div>

          <!-- Dates -->
          <div class="flex gap-4 text-sm text-gray-600 dark:text-gray-300">
            <div>
              <span class="font-semibold">Start:</span>
              {{ formatDate(project.startDate) }}
            </div>
            <div v-if="project.endDate">
              <span class="font-semibold">End:</span>
              {{ formatDate(project.endDate) }}
            </div>
          </div>

          <!-- Actions -->
          <div
            class="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700"
          >
            <UButton
              size="xs"
              color="primary"
              variant="ghost"
              @click="openModal(project)"
            >
              Edit
            </UButton>
            <UButton
              size="xs"
              color="red"
              variant="ghost"
              @click="confirmDelete(project)"
            >
              Delete
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Add/Edit Modal -->
    <UModal v-model="showModal">
      <UCard>
        <template #header>
          <h3 class="text-xl font-semibold">
            {{ editingProject ? "Edit Project" : "New Project" }}
          </h3>
        </template>

        <UForm :state="form" @submit="submitForm" class="space-y-4">
          <UFormField label="Project Name" name="name" required>
            <UInput
              v-model="form.name"
              placeholder="e.g., Downtown Office Building"
            />
          </UFormField>

          <UFormField label="Description" name="description">
            <UTextarea
              v-model="form.description"
              placeholder="Project description..."
            />
          </UFormField>

          <UFormField label="Budget" name="budget" required>
            <UInput
              v-model.number="form.budget"
              type="number"
              step="0.01"
              min="0"
              prefix="$"
              placeholder="0.00"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Start Date" name="startDate" required>
              <UInput v-model="form.startDate" type="date" />
            </UFormField>

            <UFormField label="End Date" name="endDate">
              <UInput v-model="form.endDate" type="date" />
            </UFormField>
          </div>

          <UFormField label="Status" name="status" required>
            <USelect
              v-model="form.status"
              :options="statusOptions"
              placeholder="Select status"
            />
          </UFormField>

          <div v-if="error" class="text-red-600 text-sm">
            {{ error }}
          </div>

          <div class="flex gap-2 justify-end">
            <UButton color="gray" variant="ghost" @click="closeModal">
              Cancel
            </UButton>
            <UButton type="submit" :loading="loading">
              {{ editingProject ? "Update" : "Create" }}
            </UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model="showDeleteModal">
      <UCard>
        <template #header>
          <h3 class="text-xl font-semibold text-red-600">Delete Project</h3>
        </template>

        <p class="text-gray-600 dark:text-gray-300">
          Are you sure you want to delete the project "{{
            projectToDelete?.name
          }}"? This action cannot be undone.
        </p>

        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton
              color="gray"
              variant="ghost"
              @click="showDeleteModal = false"
            >
              Cancel
            </UButton>
            <UButton color="red" @click="handleDelete" :loading="loading">
              Delete
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { IProject, IProjectForm } from "~/types";

definePageMeta({
  middleware: "auth",
  ssr: false,
});

const {
  projects,
  pending,
  createProject,
  updateProject,
  deleteProject,
  getAmountLeftToSpend,
  getBudgetPercentage,
  isOverBudget,
} = useProjects();

const showModal = ref(false);
const showDeleteModal = ref(false);
const editingProject = ref<IProject | null>(null);
const projectToDelete = ref<IProject | null>(null);
const loading = ref(false);
const error = ref("");

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Paused", value: "paused" },
];

const form = reactive<IProjectForm>({
  name: "",
  description: "",
  budget: 0,
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  status: "active",
});

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "green";
    case "completed":
      return "blue";
    case "paused":
      return "yellow";
    default:
      return "gray";
  }
};

const getBudgetColor = (project: IProject) => {
  const percentage = getBudgetPercentage(project);
  if (percentage >= 100) return "red";
  if (percentage >= 80) return "yellow";
  return "green";
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date | any) => {
  if (!date) return "N/A";
  const d =
    date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString();
};

const openModal = (project?: IProject) => {
  if (project) {
    editingProject.value = project;
    form.name = project.name;
    form.description = project.description || "";
    form.budget = project.budget;
    form.startDate = formatDateForInput(project.startDate);
    form.endDate = project.endDate ? formatDateForInput(project.endDate) : "";
    form.status = project.status;
  } else {
    editingProject.value = null;
    form.name = "";
    form.description = "";
    form.budget = 0;
    form.startDate = new Date().toISOString().split("T")[0];
    form.endDate = "";
    form.status = "active";
  }
  error.value = "";
  showModal.value = true;
};

const formatDateForInput = (date: Date | any) => {
  if (!date) return "";
  const d =
    date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
  return d.toISOString().split("T")[0];
};

const closeModal = () => {
  showModal.value = false;
  editingProject.value = null;
  error.value = "";
};

const submitForm = async () => {
  loading.value = true;
  error.value = "";

  const projectData = {
    ...form,
    startDate: new Date(form.startDate),
    endDate: form.endDate ? new Date(form.endDate) : undefined,
  };

  const result = editingProject.value
    ? await updateProject(editingProject.value.id, projectData)
    : await createProject(projectData);

  if (result.error) {
    error.value = result.error;
  } else {
    closeModal();
  }

  loading.value = false;
};

const confirmDelete = (project: IProject) => {
  projectToDelete.value = project;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!projectToDelete.value) return;

  loading.value = true;
  const result = await deleteProject(projectToDelete.value.id);

  if (result.error) {
    error.value = result.error;
  } else {
    showDeleteModal.value = false;
    projectToDelete.value = null;
  }

  loading.value = false;
};
</script>
