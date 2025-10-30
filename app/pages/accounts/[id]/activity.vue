<template>
  <ClientOnly>
    <div class="min-h-screen bg-slate-950">
      <div
        class="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-6 rounded-b-3xl shadow-lg"
      >
        <div class="flex items-center justify-between">
          <UButton
            to="/accounts"
            variant="ghost"
            class="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl px-3 py-2 text-white"
            icon="i-lucide-arrow-left"
          />
          <h1 class="text-2xl font-bold text-white">
            {{ accountName || "Account" }} Activity
          </h1>
          <div class="w-10" />
        </div>
      </div>

      <div class="container mx-auto px-6 py-6 space-y-6">
        <UCard class="bg-slate-900 border-slate-800">
          <template #header>
            <h3 class="text-white font-semibold">Expenses</h3>
          </template>
          <div v-if="accExpenses.length === 0" class="text-slate-400">
            No expenses yet.
          </div>
          <div v-else class="space-y-3">
            <UCard
              v-for="e in accExpenses"
              :key="e.id"
              class="bg-slate-800/60 border-slate-700 cursor-pointer"
              @click="goExpense(e.id)"
            >
              <div class="flex justify-between text-white">
                <span>{{ e.description || e.category }}</span>
                <span class="text-red-400"
                  >- ${{ (e.amount || 0).toFixed(2) }}</span
                >
              </div>
            </UCard>
          </div>
        </UCard>

        <UCard class="bg-slate-900 border-slate-800">
          <template #header>
            <h3 class="text-white font-semibold">Incomes</h3>
          </template>
          <div v-if="accIncomes.length === 0" class="text-slate-400">
            No income yet.
          </div>
          <div v-else class="space-y-3">
            <UCard
              v-for="i in accIncomes"
              :key="i.id"
              class="bg-slate-800/60 border-slate-700 cursor-pointer"
              @click="goIncome(i.id)"
            >
              <div class="flex justify-between text-white">
                <span>{{ i.description || "Income" }}</span>
                <span class="text-green-400"
                  >+ ${{ (i.amount || 0).toFixed(2) }}</span
                >
              </div>
            </UCard>
          </div>
        </UCard>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
definePageMeta({ middleware: "auth", ssr: false });
const route = useRoute();
import { useAccounts } from "~/composables/useAccounts";
import { useExpenses } from "~/composables/useExpenses";
import { useIncomes } from "~/composables/useIncomes";
const { accounts } = useAccounts();
const { expenses } = useExpenses();
const { incomes } = useIncomes();
const accountId = computed(() => String(route.params.id));
const accountName = computed(
  () => accounts.value?.find((a) => a.id === accountId.value)?.name || ""
);
const accExpenses = computed(() =>
  (expenses.value || []).filter((e) => e.accountId === accountId.value)
);
const accIncomes = computed(() =>
  (incomes.value || []).filter((i) => i.accountId === accountId.value)
);
const router = useRouter();
const goExpense = (id) => router.push(`/expenses/${id}`);
const goIncome = (id) => router.push(`/incomes/${id}`);
</script>
