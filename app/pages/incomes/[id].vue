<template>
  <ClientOnly>
    <div class="min-h-screen bg-default text-default mobile-padding-bottom">
      <div
        class="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-6 rounded-b-3xl shadow-lg"
      >
        <div class="flex items-center justify-between">
          <UButton
            to="/"
            variant="ghost"
            class="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl px-3 py-2 text-white"
            icon="i-lucide-arrow-left"
          />
          <h1 class="text-2xl font-bold text-white">Income Details</h1>
          <div class="w-10" />
        </div>
      </div>
      <div class="container mx-auto px-6 py-6">
        <UCard class="bg-elevated border border-default">
          <div class="space-y-2">
            <p>
              <span class="text-muted">Amount:</span> ${{
                (income?.amount || 0).toFixed(2)
              }}
            </p>
            <p class="flex items-center gap-2">
              <span class="text-muted">Project:</span>
              <template v-if="income?.projectId && projectName">
                <UButton
                  :to="`/projects/${income?.projectId}/activity`"
                  variant="link"
                  class="text-blue-400 p-0"
                  >{{ projectName }}</UButton
                >
              </template>
              <span v-else>—</span>
            </p>
            <p class="flex items-center gap-2">
              <span class="text-muted">Account:</span>
              <template v-if="income?.accountId && accountName">
                <UButton
                  :to="`/accounts/${income?.accountId}/activity`"
                  variant="link"
                  class="text-blue-400 p-0"
                  >{{ accountName }}</UButton
                >
              </template>
              <span v-else>—</span>
            </p>
            <p>
              <span class="text-muted">Description:</span>
              {{ income?.description || "—" }}
            </p>
            <p>
              <span class="text-muted">Date:</span>
              {{ formatDate(income?.date) }}
            </p>
          </div>
        </UCard>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
definePageMeta({ middleware: "auth", ssr: false });
const route = useRoute();
import { useIncomes } from "~/composables/useIncomes";
import { useAccounts } from "~/composables/useAccounts";
import { useProjects } from "~/composables/useProjects";
const { incomes } = useIncomes();
const { accounts } = useAccounts();
const { projects } = useProjects();
const income = computed(() =>
  (incomes.value || []).find((i) => i.id === route.params.id)
);
const projectName = computed(
  () =>
    projects.value?.find((p) => p.id === income.value?.projectId)?.name || ""
);
const accountName = computed(
  () =>
    accounts.value?.find((a) => a.id === income.value?.accountId)?.name || ""
);
const formatDate = (d) => {
  const date =
    d && typeof d.toDate === "function"
      ? d.toDate()
      : d
      ? new Date(d)
      : new Date();
  return date.toLocaleDateString();
};
</script>
