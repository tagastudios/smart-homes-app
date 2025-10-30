<template>
  <ClientOnly>
    <div class="min-h-screen bg-slate-950">
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
          <h1 class="text-2xl font-bold text-white">Expense Details</h1>
          <div class="w-10" />
        </div>
      </div>
      <div class="container mx-auto px-6 py-6">
        <UCard class="bg-slate-900 border-slate-800">
          <div class="space-y-2 text-white">
            <p>
              <span class="text-slate-400">Amount:</span> ${{
                (expense?.amount || 0).toFixed(2)
              }}
            </p>
            <p>
              <span class="text-slate-400">Category:</span>
              {{ expense?.category }}
            </p>
            <p class="flex items-center gap-2">
              <span class="text-slate-400">Project:</span>
              <template v-if="expense?.projectId && projectName">
                <UButton
                  :to="`/projects/${expense?.projectId}/activity`"
                  variant="link"
                  class="text-blue-400 p-0"
                  >{{ projectName }}</UButton
                >
              </template>
              <span v-else>—</span>
            </p>
            <p class="flex items-center gap-2">
              <span class="text-slate-400">Account:</span>
              <template v-if="expense?.accountId && accountName">
                <UButton
                  :to="`/accounts/${expense?.accountId}/activity`"
                  variant="link"
                  class="text-blue-400 p-0"
                  >{{ accountName }}</UButton
                >
              </template>
              <span v-else>—</span>
            </p>
            <p>
              <span class="text-slate-400">Description:</span>
              {{ expense?.description || "—" }}
            </p>
            <p>
              <span class="text-slate-400">Date:</span>
              {{ formatDate(expense?.date) }}
            </p>
            <p v-if="expense?.receiptId">
              <UButton
                :to="`/receipts/${expense?.receiptId}`"
                variant="link"
                class="text-blue-400 p-0"
                >View Receipt</UButton
              >
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
import { useExpenses } from "~/composables/useExpenses";
import { useAccounts } from "~/composables/useAccounts";
import { useProjects } from "~/composables/useProjects";
const { expenses } = useExpenses();
const { accounts } = useAccounts();
const { projects } = useProjects();
const expense = computed(() =>
  (expenses.value || []).find((e) => e.id === route.params.id)
);
const projectName = computed(
  () =>
    projects.value?.find((p) => p.id === expense.value?.projectId)?.name || ""
);
const accountName = computed(
  () =>
    accounts.value?.find((a) => a.id === expense.value?.accountId)?.name || ""
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
