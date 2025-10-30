<template>
  <ClientOnly>
    <div class="min-h-screen bg-slate-950 mobile-padding-bottom">
      <!-- Gradient Header -->
      <div
        class="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-6 rounded-b-3xl shadow-lg"
      >
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-white mb-1">Add Income</h1>
            <p class="text-purple-200 text-sm">Record a new income entry</p>
          </div>
          <UButton
            to="/"
            variant="ghost"
            class="text-white/90"
            icon="i-lucide-arrow-left"
          >
            Back
          </UButton>
        </div>
      </div>

      <div class="container mx-auto px-6 py-6">
        <UCard class="bg-slate-900 border-slate-800">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-white">Income Details</h2>
            </div>
          </template>

          <div class="space-y-5">
            <!-- Amount -->
            <UFormField
              label="Amount"
              :ui="{ label: 'text-white mb-2', wrapper: 'w-full' }"
            >
              <div class="w-full">
                <UInput
                  v-model.number="form.amount"
                  type="number"
                  placeholder="0.00"
                  inputmode="decimal"
                  class="w-full"
                  :ui="{ base: 'w-full' }"
                />
              </div>
            </UFormField>

            <!-- Account (optional) -->
            <UFormField
              label="Account (optional)"
              :ui="{ label: 'text-white mb-2', wrapper: 'w-full' }"
            >
              <USelectMenu
                v-model="form.accountId"
                :items="accountOptions"
                value-key="value"
                class="w-full"
              >
                <template #item="{ item }">
                  <div class="flex items-center gap-2">
                    <UIcon
                      :name="item.icon"
                      class="w-4 h-4"
                      :style="{ color: item.color }"
                    />
                    <span>{{ item.label }}</span>
                  </div>
                </template>
                <template #footer>
                  <div class="p-2">
                    <UButton
                      block
                      variant="ghost"
                      icon="i-lucide-plus"
                      @click="goAddAccount"
                      >Add Account...</UButton
                    >
                  </div>
                </template>
              </USelectMenu>
            </UFormField>

            <!-- Project (optional) -->
            <UFormField
              label="Project (optional)"
              :ui="{ label: 'text-white mb-2', wrapper: 'w-full' }"
            >
              <USelectMenu
                v-model="form.projectId"
                :items="projectOptions"
                value-key="value"
                class="w-full"
              >
                <template #item="{ item }">
                  <div class="flex items-center gap-2">
                    <UIcon :name="item.icon" class="w-4 h-4" :style="{ color: item.color }" />
                    <span>{{ item.label }}</span>
                  </div>
                </template>
                <template #footer>
                  <div class="p-2">
                    <UButton block variant="ghost" icon="i-lucide-plus" @click="goAddProject">Add Project...</UButton>
                  </div>
                </template>
              </USelectMenu>
            </UFormField>

            <!-- Description -->
            <UFormField
              label="Description"
              :ui="{ label: 'text-white mb-2', wrapper: 'w-full' }"
            >
              <UTextarea
                v-model="form.description"
                placeholder="Describe this income"
                class="w-full"
              />
            </UFormField>

            <!-- Date -->
            <UFormField
              label="Date"
              :ui="{ label: 'text-white mb-2', wrapper: 'w-full' }"
            >
              <UInput v-model="form.dateStr" type="date" class="w-full" />
            </UFormField>
          </div>

          <template #footer>
            <div class="flex gap-3">
              <UButton variant="ghost" class="flex-1" @click="goHome"
                >Cancel</UButton
              >
              <UButton
                :disabled="!isValid || submitting"
                :loading="submitting"
                class="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                @click="submit"
              >
                Add Income
              </UButton>
            </div>
          </template>
        </UCard>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
definePageMeta({ middleware: "auth", ssr: false });

import { useIncomes } from "~/composables/useIncomes";
import { useProjects } from "~/composables/useProjects";
import { useAccounts } from "~/composables/useAccounts";
import { useAccountTypes } from "~/composables/useAccountTypes";

const router = useRouter();
const toast = useToast();

const { createIncome } = useIncomes();
const { projects, createProject } = useProjects();
const { accounts } = useAccounts();
const { allAccountTypes } = useAccountTypes();

const form = reactive({
  amount: 0,
  accountId: undefined,
  projectId: undefined,
  description: "",
  dateStr: new Date().toISOString().slice(0, 10),
});

const submitting = ref(false);

const projectOptions = computed(() =>
  (projects?.value || []).map((p) => ({
    label: p.name,
    value: p.id,
    icon: "i-lucide-folder",
    color: "#8B5CF6",
  }))
);

const accountOptions = computed(() =>
  (accounts?.value || []).map((a) => {
    const type = allAccountTypes.value.find(
      (t) => t.name.toLowerCase() === String(a.type).toLowerCase()
    );
    return {
      label: `${a.name} (${a.type})`,
      value: a.id,
      icon: type?.icon || "i-lucide-credit-card",
      color: type?.color || "#8B5CF6",
    };
  })
);

const isValid = computed(() => {
  return !!form.amount && !!form.dateStr;
});

const handleCreateProject = async () => {
  router.push("/projects");
};

const goAddProject = () => router.push("/projects");

const submit = async () => {
  if (!isValid.value || submitting.value) return;
  submitting.value = true;
  try {
    const payload = {
      amount: Number(form.amount),
      projectId: form.projectId || undefined,
      accountId: form.accountId || undefined,
      description: form.description || "",
      date: new Date(form.dateStr),
    };
    const { error } = await createIncome(payload);
    if (error) throw new Error(error);
    toast.add({
      title: "Income added",
      description: "Your income entry was saved successfully.",
    });
    router.push("/");
  } catch (e) {
    toast.add({
      title: "Failed to add income",
      description: String(e),
      color: "red",
    });
  } finally {
    submitting.value = false;
  }
};

const goHome = () => router.push("/");
const goAddAccount = () => router.push("/accounts");
</script>
