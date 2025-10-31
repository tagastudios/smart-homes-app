<template>
  <ClientOnly>
    <div class="min-h-screen bg-default text-default mobile-padding-bottom">
      <!-- Gradient Header -->
      <div
        class="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-6 rounded-b-3xl shadow-lg"
      >
        <div>
          <h1 class="text-2xl font-bold text-white mb-1">Projects</h1>
          <p class="text-purple-200 text-sm">
            Manage your construction projects and track budgets
          </p>
        </div>
      </div>

      <div class="container mx-auto px-6 py-6">
        <!-- Loading State -->
        <div v-if="pending" class="text-center py-12">
          <UIcon
            name="i-lucide-loader-2"
            class="animate-spin mx-auto h-12 w-12 text-purple-400 mb-4"
          />
          <p class="text-muted">Loading projects...</p>
        </div>

        <!-- Empty State -->
        <UCard
          v-else-if="projects && projects.length === 0"
          class="bg-elevated border border-default"
        >
          <div class="text-center py-12">
            <UIcon
              name="i-lucide-folder-open"
              class="mx-auto h-16 w-16 text-muted mb-4"
            />
            <h3 class="text-lg font-semibold mb-2">No projects yet</h3>
            <p class="text-muted mb-6">
              Create your first project to start tracking expenses.
            </p>
            <UButton
              @click="openModal()"
              icon="i-lucide-plus"
              class="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            >
              Create Project
            </UButton>
          </div>
        </UCard>

        <!-- Projects List -->
        <div v-else>
          <!-- Add Project Button -->
          <div class="mb-4">
            <UButton
              @click="openModal()"
              icon="i-lucide-plus"
              size="lg"
              block
              class="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 font-semibold py-3"
            >
              New Project
            </UButton>
          </div>

          <div class="space-y-4">
            <UCard
              v-for="project in projects"
              :key="project.id"
              class="bg-elevated border border-default rounded-xl transition-colors hover:border-default/70"
            >
              <div class="p-5 space-y-4">
                <!-- Header -->
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold mb-1">
                      {{ project.name }}
                    </h3>
                    <p
                      v-if="project.description"
                      class="text-sm text-muted mt-1"
                    >
                      {{ project.description }}
                    </p>
                  </div>
                  <UBadge
                    class="shrink-0 ml-4"
                    :style="{
                      backgroundColor: getStatusColor(project.status) + '20',
                      color: getStatusColor(project.status),
                    }"
                  >
                    {{ project.status }}
                  </UBadge>
                </div>

                <!-- Budget Progress -->
                <div>
                  <div class="flex justify-between text-sm mb-2">
                    <span class="text-muted">Budget</span>
                    <span class="font-semibold">
                      ${{ formatCurrency(project.spent) }} / ${{
                        formatCurrency(project.budget)
                      }}
                    </span>
                  </div>
                  <UProgress
                    :model-value="getBudgetPercentage(project)"
                    :max="100"
                    :color="getBudgetColor(project)"
                    size="md"
                    :ui="{
                      indicator:
                        'bg-gradient-to-r from-purple-600 to-blue-600 rounded-full',
                    }"
                  />
                  <div class="flex justify-between text-xs mt-2">
                    <span class="text-muted">
                      {{ getBudgetPercentage(project).toFixed(1) }}% used
                    </span>
                    <span
                      :class="
                        isOverBudget(project) ? 'text-red-400' : 'text-blue-400'
                      "
                    >
                      {{
                        isOverBudget(project)
                          ? "$" +
                            formatCurrency(
                              Math.abs(getAmountLeftToSpend(project))
                            ) +
                            " over"
                          : "$" +
                            formatCurrency(getAmountLeftToSpend(project)) +
                            " left"
                      }}
                    </span>
                  </div>
                </div>

                <!-- Dates -->
                <div
                  class="flex gap-4 text-sm text-muted pt-3 border-t border-default"
                >
                  <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-calendar" class="w-4 h-4" />
                    <span>
                      <span class="font-medium text-muted">Start:</span>
                      {{ formatDate(project.startDate) }}
                    </span>
                  </div>
                  <div v-if="project.endDate" class="flex items-center gap-2">
                    <UIcon name="i-lucide-calendar-days" class="w-4 h-4" />
                    <span>
                      <span class="font-medium text-muted">End:</span>
                      {{ formatDate(project.endDate) }}
                    </span>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-2 pt-3 border-t border-default">
                  <UButton
                    size="sm"
                    variant="ghost"
                    icon="i-lucide-edit"
                    @click="openModal(project)"
                    class="text-muted hover:text-default hover:bg-accented"
                  >
                    Edit
                  </UButton>
                  <UButton
                    size="sm"
                    variant="ghost"
                    icon="i-lucide-trash-2"
                    @click="confirmDelete(project)"
                    class="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    Delete
                  </UButton>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <UModal v-model:open="showModal">
        <template #content>
          <UCard class="bg-elevated border border-default">
            <template #header>
              <h3 class="text-xl font-semibold">
                {{ editingProject ? "Edit Project" : "New Project" }}
              </h3>
            </template>

            <UForm :state="form" @submit="submitForm" class="space-y-4">
              <UFormField
                label="Project Name"
                name="name"
                required
                :ui="{ wrapper: 'w-full' }"
              >
                <UInput
                  v-model="form.name"
                  placeholder="e.g., Downtown Office Building"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Description"
                name="description"
                :ui="{ wrapper: 'w-full' }"
              >
                <UTextarea
                  v-model="form.description"
                  placeholder="Project description..."
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Budget"
                name="budget"
                required
                :ui="{ wrapper: 'w-full' }"
              >
                <UInput
                  v-model.number="form.budget"
                  type="number"
                  step="0.01"
                  min="0"
                  prefix="$"
                  placeholder="0.00"
                  class="w-full"
                />
              </UFormField>

              <div class="grid grid-cols-2 gap-4">
                <UFormField
                  label="Start Date"
                  name="startDate"
                  required
                  :ui="{ wrapper: 'w-full' }"
                >
                  <UInput v-model="form.startDate" type="date" class="w-full" />
                </UFormField>

                <UFormField
                  label="End Date"
                  name="endDate"
                  :ui="{ wrapper: 'w-full' }"
                >
                  <UInput v-model="form.endDate" type="date" class="w-full" />
                </UFormField>
              </div>

              <UFormField
                label="Status"
                name="status"
                required
                :ui="{ wrapper: 'w-full' }"
              >
                <div class="w-full">
                  <UI-TypeSelectMenu
                    v-model="form.status"
                    :options="statusOptions"
                    placeholder="Select status"
                    custom-label="Add Custom Status..."
                    custom-modal-title="Create New Status"
                    :on-create-custom="handleCreateProjectStatus"
                  />
                </div>
              </UFormField>

              <div
                v-if="error"
                class="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3"
              >
                {{ error }}
              </div>
            </UForm>

            <template #footer>
              <div class="flex gap-2 justify-end">
                <UButton
                  color="neutral"
                  variant="ghost"
                  @click="closeModal"
                  class="text-muted hover:text-default"
                >
                  Cancel
                </UButton>
                <UButton
                  @click="submitForm"
                  :loading="loading"
                  class="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                >
                  {{ editingProject ? "Update" : "Create" }}
                </UButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>

      <!-- Delete Confirmation Modal -->
      <UModal v-model:open="showDeleteModal">
        <template #content>
          <UCard class="bg-elevated border border-default">
            <template #header>
              <div class="flex items-center gap-3">
                <UIcon
                  name="i-lucide-alert-triangle"
                  class="w-6 h-6 text-red-400"
                />
                <h3 class="text-xl font-semibold text-red-400">
                  Delete Project
                </h3>
              </div>
            </template>

            <p class="text-muted">
              Are you sure you want to delete the project
              <span class="font-semibold">"{{ projectToDelete?.name }}"</span>?
              This action cannot be undone.
            </p>

            <template #footer>
              <div class="flex gap-2 justify-end">
                <UButton
                  color="neutral"
                  variant="ghost"
                  @click="showDeleteModal = false"
                  class="text-muted hover:text-default"
                >
                  Cancel
                </UButton>
                <UButton
                  color="error"
                  @click="handleDelete"
                  :loading="loading"
                  class="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </UButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { Timestamp } from "firebase/firestore";
import type { IProject, IProjectForm } from "~/types";

definePageMeta({
  middleware: "auth",
  ssr: false,
  layout: "default",
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

const { allProjectStatuses, createProjectStatus } = useProjectStatuses();

const showModal = ref(false);
const showDeleteModal = ref(false);
const editingProject = ref<IProject | null>(null);
const projectToDelete = ref<IProject | null>(null);
const loading = ref(false);
const error = ref("");

const statusOptions = computed(() => {
  return allProjectStatuses.value.map((status) => ({
    label: status.name,
    value: status.name,
    icon: status.icon,
    color: status.color,
  }));
});

const form = reactive<{
  name: string;
  description: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: string;
}>({
  name: "",
  description: "",
  budget: 0,
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  status: "active" as string,
});

const getStatusColor = (status: string | undefined): string => {
  if (!status) return "#94A3B8";
  const projectStatus = allProjectStatuses.value.find(
    (s) => s.name.toLowerCase() === String(status).toLowerCase()
  );
  return projectStatus ? projectStatus.color : "#94A3B8"; // Default slate color
};

const getBudgetColor = (project: IProject): "error" | "warning" | "primary" => {
  const percentage = getBudgetPercentage(project);
  if (percentage >= 100) return "error";
  if (percentage >= 80) return "warning";
  return "primary";
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date | Timestamp | string | undefined) => {
  if (!date) return "N/A";
  let d: Date;
  if (date instanceof Date) {
    d = date;
  } else if (
    typeof date === "object" &&
    "toDate" in date &&
    typeof (date as Timestamp).toDate === "function"
  ) {
    d = (date as Timestamp).toDate();
  } else if (typeof date === "string") {
    d = new Date(date);
  } else {
    return "N/A";
  }
  return d.toLocaleDateString();
};

const openModal = (project?: IProject) => {
  if (project) {
    editingProject.value = project;
    form.name = project.name;
    form.description = project.description || "";
    form.budget = project.budget;
    form.startDate =
      formatDateForInput(project.startDate) ||
      new Date().toISOString().split("T")[0];
    form.endDate = project.endDate
      ? formatDateForInput(project.endDate) || ""
      : "";
    form.status = project.status;
  } else {
    editingProject.value = null;
    form.name = "";
    form.description = "";
    form.budget = 0;
    form.startDate = new Date().toISOString().split("T")[0];
    form.endDate = "";
    form.status = "active" as string;
  }
  error.value = "";
  showModal.value = true;
};

const formatDateForInput = (
  date: Date | Timestamp | string | undefined
): string => {
  if (!date) return "";
  let d: Date;
  if (date instanceof Date) {
    d = date;
  } else if (
    typeof date === "object" &&
    "toDate" in date &&
    typeof (date as Timestamp).toDate === "function"
  ) {
    d = (date as Timestamp).toDate();
  } else if (typeof date === "string") {
    d = new Date(date);
  } else {
    return "";
  }
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

  const projectData: IProjectForm = {
    name: form.name,
    description: form.description || undefined,
    budget: form.budget,
    startDate: new Date(form.startDate),
    status: form.status as "active" | "completed" | "paused",
  };

  // Only include endDate if it has a value (Firestore doesn't allow undefined)
  if (form.endDate && form.endDate.trim() !== "") {
    projectData.endDate = new Date(form.endDate);
  }

  const result = editingProject.value
    ? await updateProject(editingProject.value.id, projectData)
    : await createProject(projectData);

  if (result.error) {
    error.value = result.error;
  } else {
    const toast = useToast();
    toast.add({
      title: editingProject.value
        ? "Project updated successfully!"
        : "Project created successfully!",
      color: "primary",
      icon: "i-lucide-check-circle",
    });
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
    const toast = useToast();
    toast.add({
      title: "Error deleting project",
      description: result.error,
      color: "error",
      icon: "i-lucide-alert-triangle",
    });
  } else {
    const toast = useToast();
    toast.add({
      title: "Project deleted successfully!",
      color: "primary",
      icon: "i-lucide-check-circle",
    });
    showDeleteModal.value = false;
    projectToDelete.value = null;
  }

  loading.value = false;
};

const handleCreateProjectStatus = async (data: {
  name: string;
  icon: string;
  color: string;
}) => {
  return await createProjectStatus(data.name, data.icon, data.color);
};
</script>
