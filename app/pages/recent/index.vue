<template>
  <ClientOnly>
    <div class="min-h-screen bg-slate-950 mobile-padding-bottom">
      <!-- Gradient Header -->
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
          <div>
            <h1 class="text-2xl font-bold text-white mb-1">
              Recent Transactions
            </h1>
            <p class="text-purple-200 text-sm">All expenses and incomes</p>
          </div>
          <div class="w-10" />
        </div>
      </div>

      <div class="px-6 py-6">
        <!-- Loading state -->
        <div
          v-if="expensesPending || incomesPending"
          class="flex items-center justify-center py-12"
        >
          <div class="text-slate-400">Loading transactions...</div>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="allTransactions.length === 0"
          class="flex flex-col items-center justify-center py-12"
        >
          <UIcon name="i-lucide-file-x" class="w-16 h-16 text-slate-600 mb-4" />
          <p class="text-slate-400 text-lg">No transactions found</p>
          <p class="text-slate-500 text-sm mt-2">
            Add expenses or incomes to see them here
          </p>
        </div>

        <!-- Transactions list -->
        <div v-else class="space-y-3">
          <UCard
            v-for="tx in visibleTransactions"
            :key="tx.id"
            class="bg-slate-900 rounded-2xl p-3 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
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

        <!-- Loading more indicator -->
        <div v-if="isLoadingMore" class="flex items-center justify-center py-6">
          <div class="text-slate-400 text-sm">Loading more...</div>
        </div>

        <!-- Infinite scroll sentinel -->
        <div
          ref="sentinel"
          class="h-1 w-full"
          :class="{ 'opacity-0': !hasMore }"
        />
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useExpenses } from "~/composables/useExpenses";
import { useIncomes } from "~/composables/useIncomes";

definePageMeta({
  middleware: "auth",
  ssr: false,
  layout: "default",
});

const { expenses, pending: expensesPending } = useExpenses();
const { incomes, pending: incomesPending } = useIncomes();

const formatAmount = (amount: number, type: "expense" | "income") =>
  `${type === "expense" ? "-" : "+"}$${(amount || 0).toLocaleString()}`;

const normalizeDate = (d: unknown): Date => {
  const v = d as { toDate?: () => Date } | string | number | Date | undefined;
  const maybeDate =
    v && typeof (v as any)?.toDate === "function" ? (v as any).toDate() : v;
  return new Date((maybeDate as string | number | Date) ?? Date.now());
};

const formatDate = (d: unknown) => normalizeDate(d).toLocaleDateString();

// Combine and sort all transactions
const allTransactions = computed(() => {
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
  return [...ex, ...inc].sort((a, b) => {
    const da = normalizeDate(a.date as unknown);
    const db = normalizeDate(b.date as unknown);
    return db.getTime() - da.getTime();
  });
});

// Infinite scroll state
const itemsToShow = ref(30); // Initial load
const itemsPerPage = 25; // Load 25 more each time
const isLoadingMore = ref(false);

// Visible transactions based on scroll position
const visibleTransactions = computed(() => {
  return allTransactions.value.slice(0, itemsToShow.value);
});

// Check if there are more items to load
const hasMore = computed(() => {
  return itemsToShow.value < allTransactions.value.length;
});

// Infinite scroll sentinel element
const sentinel = ref<HTMLElement | null>(null);

// Load more function
const loadMore = () => {
  if (!hasMore.value || isLoadingMore.value) return;

  isLoadingMore.value = true;
  // Simulate loading delay for better UX
  setTimeout(() => {
    itemsToShow.value = Math.min(
      itemsToShow.value + itemsPerPage,
      allTransactions.value.length
    );
    isLoadingMore.value = false;
  }, 300);
};

// Intersection observer for infinite scroll
useIntersectionObserver(
  sentinel,
  ([{ isIntersecting }]) => {
    if (isIntersecting && hasMore.value && !isLoadingMore.value) {
      loadMore();
    }
  },
  {
    rootMargin: "100px", // Start loading when 100px before reaching bottom
  }
);

const router = useRouter();
const goToTx = (tx: { id: string; type: "expense" | "income" }) => {
  router.push(
    tx.type === "expense" ? `/expenses/${tx.id}` : `/incomes/${tx.id}`
  );
};
</script>
