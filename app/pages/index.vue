<template>
  <ClientOnly>
    <div class="w-full bg-slate-950">
      <!-- Header with gradient background -->
      <div class="bg-gradient-purple-blue p-6 pt-12 rounded-b-3xl">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h1 class="text-2xl font-bold text-white mb-1">Welcome back!</h1>
            <p class="text-purple-200">Track your expenses</p>
          </div>

          <div class="flex items-center gap-2">
            <!-- Settings/Avatar button -->
            <UButton
              to="/settings"
              variant="ghost"
              icon="i-lucide-user-circle"
              class="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl hover:bg-white/30 transition-all text-white flex items-center justify-center"
              size="lg"
            />
            <!-- Message button with glassmorphism -->
            <UButton
              to="/chat"
              variant="ghost"
              icon="i-lucide-message-square"
              class="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl hover:bg-white/30 transition-all text-white flex items-center justify-center"
              size="lg"
            />
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Recent Expenses Card -->
          <UCard class="glass rounded-2xl p-3">
            <p class="text-purple-200 text-sm mb-1">
              {{ thisMonthExpenses > 0 ? "This Month" : recentExpenses.period }}
            </p>
            <p
              v-if="expensesPending"
              class="text-2xl font-bold text-white mb-1"
            >
              ...
            </p>
            <p v-else class="text-2xl font-bold text-white mb-1">
              {{
                formatCurrency(
                  thisMonthExpenses > 0
                    ? thisMonthExpenses
                    : recentExpenses.total
                )
              }}
            </p>
            <div class="flex items-center gap-1">
              <UIcon
                name="i-lucide-trending-up"
                class="w-4 h-4 text-green-400"
              />
              <p class="text-sm text-green-400">
                {{ formatPercentage(expensesPercentageChange) }}
              </p>
            </div>
          </UCard>

          <!-- Pending Card -->
          <UCard class="glass rounded-2xl p-3">
            <p class="text-purple-200 text-sm mb-1">Pending</p>
            <p class="text-2xl font-bold text-white mb-1">
              {{ formatCurrency(pendingStats.totalAmount) }}
            </p>
            <div class="flex items-center gap-1">
              <p class="text-sm text-purple-200">
                {{ pendingStats.count }}
                {{ pendingStats.count === 1 ? "item" : "items" }}
              </p>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Quick Actions with overlapping effect -->
      <div class="px-6 -mt-4 mb-6">
        <UCard
          class="bg-slate-900 rounded-2xl p-3 border border-slate-800 shadow-xl"
        >
          <p class="text-slate-400 text-sm mb-3">Quick Actions</p>
          <div class="grid grid-cols-3 gap-3">
            <UButton
              to="/reports"
              variant="ghost"
              class="flex flex-col items-center gap-2 p-3 bg-slate-800 rounded-xl hover:bg-slate-750 transition-all touch-target"
            >
              <UIcon
                name="i-lucide-chart-column"
                class="w-6 h-6 text-purple-400"
              />
              <span class="text-xs text-slate-300">Reports</span>
            </UButton>

            <UButton
              to="/projects"
              variant="ghost"
              class="flex flex-col items-center gap-2 p-3 bg-slate-800 rounded-xl hover:bg-slate-750 transition-all touch-target"
            >
              <UIcon
                name="i-lucide-folder-open"
                class="w-6 h-6 text-blue-400"
              />
              <span class="text-xs text-slate-300">Projects</span>
            </UButton>

            <UButton
              to="/accounts"
              variant="ghost"
              class="flex flex-col items-center gap-2 p-3 bg-slate-800 rounded-xl hover:bg-slate-750 transition-all touch-target"
            >
              <UIcon
                name="i-lucide-credit-card"
                class="w-6 h-6 text-green-400"
              />
              <span class="text-xs text-slate-300">Accounts</span>
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- Recent Transactions -->
      <div class="px-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-white">Recent</h2>
          <UButton to="/recent" variant="link" class="text-purple-400 text-sm">
            View all
          </UButton>
        </div>

        <div class="space-y-3">
          <UCard
            v-for="tx in recentRealTransactions"
            :key="tx.id"
            class="bg-slate-900 rounded-2xl p-3 border border-slate-800 cursor-pointer"
            @click="goToTx(tx)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800"
                >
                  <UIcon
                    :name="
                      tx.type === 'expense'
                        ? 'i-lucide-trending-down'
                        : 'i-lucide-trending-up'
                    "
                    class="w-5 h-5"
                    :class="
                      tx.type === 'expense' ? 'text-red-400' : 'text-green-400'
                    "
                  />
                </div>
                <div>
                  <p class="text-white font-medium">{{ tx.description }}</p>
                  <p class="text-slate-400 text-sm">
                    {{ formatDate(tx.date) }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p
                  :class="
                    tx.type === 'expense'
                      ? 'text-red-400 font-semibold'
                      : 'text-green-400 font-semibold'
                  "
                >
                  {{ formatAmount(tx.amount, tx.type) }}
                </p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Pending Receipts -->
        <div v-if="pendingList.length > 0" class="mt-8">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-white">Pending Receipts</h2>
          </div>
          <div class="space-y-3">
            <UCard
              v-for="r in pendingList"
              :key="r.id"
              class="bg-slate-900 rounded-2xl p-3 border border-slate-800 cursor-pointer"
              @click="goReceipt(r.id)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center"
                  >
                    <UIcon
                      name="i-lucide-receipt-text"
                      class="w-5 h-5 text-blue-400"
                    />
                  </div>
                  <div>
                    <p class="text-white font-medium">
                      Receipt #{{ r.receiptNumber || r.id.slice(-6) }}
                    </p>
                    <p class="text-slate-400 text-sm">
                      {{ formatDate(r.uploadDate) }}
                    </p>
                  </div>
                </div>
                <UBadge class="bg-amber-500/15 text-amber-400">Pending</UBadge>
              </div>
            </UCard>
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { watch } from "vue";
import { useExpenses } from "~/composables/useExpenses";
import { useIncomes } from "~/composables/useIncomes";
import { useReceipts } from "~/composables/useReceipts";
// Define page meta following Nuxt best practices
definePageMeta({
  middleware: "auth",
  ssr: false,
  layout: "default",
});

const { expenses, pending: expensesPending } = useExpenses();
const { incomes, pending: incomesPending } = useIncomes();
const { receipts } = useReceipts();

const formatCurrency = (amount: number) => `$${(amount || 0).toLocaleString()}`;
const formatAmount = (amount: number, type: "expense" | "income") =>
  `${type === "expense" ? "-" : "+"}$${(amount || 0).toLocaleString()}`;
const normalizeDate = (d: unknown): Date => {
  const v = d as { toDate?: () => Date } | string | number | Date | undefined;
  const maybeDate =
    v && typeof (v as any)?.toDate === "function" ? (v as any).toDate() : v;
  return new Date((maybeDate as string | number | Date) ?? Date.now());
};
const formatDate = (d: unknown) => normalizeDate(d).toLocaleDateString();
const formatPercentage = (v: number) => `+${v}%`;

// Calculate total expenses (fallback when no recent data)
const totalExpenses = computed(() => {
  if (!expenses.value || expenses.value.length === 0) {
    return 0;
  }
  try {
    return expenses.value.reduce((s, e) => {
      const amount = Number(e?.amount || 0);
      return s + (isNaN(amount) ? 0 : amount);
    }, 0);
  } catch (error) {
    console.error("Error calculating totalExpenses:", error);
    return 0;
  }
});

// Calculate expenses for the last 30 days (more useful than just current month)
const recentExpenses = computed(() => {
  if (!expenses.value || expenses.value.length === 0) {
    return { total: totalExpenses.value, period: "All Time" };
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  try {
    const filtered = expenses.value.filter((e) => {
      if (!e || !e.date) return false;
      try {
        const d = normalizeDate(e.date);
        if (isNaN(d.getTime())) return false;
        return d >= thirtyDaysAgo && d <= now;
      } catch {
        return false;
      }
    });

    const total = filtered.reduce((s, e) => {
      const amount = Number(e?.amount || 0);
      return s + (isNaN(amount) ? 0 : amount);
    }, 0);

    // If no recent expenses, show all-time total
    if (filtered.length === 0) {
      return {
        total: totalExpenses.value,
        period: "All Time",
        count: expenses.value.length,
      };
    }

    return {
      total,
      period: "Last 30 Days",
      count: filtered.length,
    };
  } catch (error) {
    console.error("Error calculating recentExpenses:", error);
    return { total: totalExpenses.value, period: "All Time" };
  }
});

// Also calculate this month specifically
const thisMonthExpenses = computed(() => {
  if (!expenses.value || expenses.value.length === 0) {
    return 0;
  }

  const now = new Date();
  const m = now.getMonth();
  const y = now.getFullYear();

  try {
    const filtered = expenses.value.filter((e) => {
      if (!e || !e.date) return false;
      try {
        const d = normalizeDate(e.date);
        if (isNaN(d.getTime())) return false;
        return d.getMonth() === m && d.getFullYear() === y;
      } catch {
        return false;
      }
    });

    return filtered.reduce((s, e) => {
      const amount = Number(e?.amount || 0);
      return s + (isNaN(amount) ? 0 : amount);
    }, 0);
  } catch (error) {
    console.error("Error calculating thisMonthExpenses:", error);
    return 0;
  }
});

const expensesPercentageChange = computed(() => 0);

const recentRealTransactions = computed(() => {
  const ex = (expenses.value || []).map((e) => ({
    id: e.id,
    type: "expense" as const,
    amount: e.amount,
    description: e.description || e.category,
    date: e.date,
  }));
  const inc = (incomes.value || []).map((i) => ({
    id: i.id,
    type: "income" as const,
    amount: i.amount,
    description: i.description || "Income",
    date: i.date,
  }));
  return [...ex, ...inc]
    .sort((a, b) => {
      const da = normalizeDate(a.date as unknown);
      const db = normalizeDate(b.date as unknown);
      return db.getTime() - da.getTime();
    })
    .slice(0, 10);
});

const pendingList = computed(() =>
  (receipts.value || []).filter(
    (r) => r.status === "uploaded" || r.status === "processing"
  )
);
const pendingStats = computed(() => {
  const totalAmount = pendingList.value.reduce((sum, r) => {
    // Try to get amount from ocrData.totalAmount or approvedItems
    if (r.ocrData?.totalAmount) {
      return sum + (Number(r.ocrData.totalAmount) || 0);
    }
    if (r.approvedItems && Array.isArray(r.approvedItems)) {
      const itemsTotal = r.approvedItems.reduce(
        (itemSum: number, item: any) =>
          itemSum + Number(item.price || 0) * Number(item.quantity || 1),
        0
      );
      return sum + itemsTotal;
    }
    return sum;
  }, 0);
  return {
    count: pendingList.value.length,
    totalAmount,
  };
});

const router = useRouter();
const goToTx = (tx: { id: string; type: "expense" | "income" }) => {
  router.push(
    tx.type === "expense" ? `/expenses/${tx.id}` : `/incomes/${tx.id}`
  );
};
const goReceipt = (id: string) => router.push(`/receipts/${id}`);
</script>
