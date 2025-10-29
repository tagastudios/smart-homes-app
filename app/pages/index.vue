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

          <!-- Message button with glassmorphism -->
          <UButton
            variant="ghost"
            icon="i-lucide-message-square"
            class="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl hover:bg-white/30 transition-all text-white"
            size="lg"
          />
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-2 gap-4">
          <!-- This Month Card -->
          <UCard class="glass rounded-2xl p-4">
            <p class="text-purple-200 text-sm mb-1">This Month</p>
            <p class="text-2xl font-bold text-white mb-1">
              {{ formatCurrency(thisMonthExpenses) }}
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
          <UCard class="glass rounded-2xl p-4">
            <p class="text-purple-200 text-sm mb-1">Pending</p>
            <p class="text-2xl font-bold text-white mb-1">
              {{ formatCurrency(pendingReceipts.totalAmount) }}
            </p>
            <div class="flex items-center gap-1">
              <p class="text-sm text-purple-200">
                {{ pendingReceipts.count }} items
              </p>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Quick Actions with overlapping effect -->
      <div class="px-6 -mt-6 mb-6">
        <UCard
          class="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl"
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
          <UButton variant="link" class="text-purple-400 text-sm">
            View all
          </UButton>
        </div>

        <div class="space-y-3">
          <UCard
            v-for="transaction in recentTransactions"
            :key="transaction.id"
            class="bg-slate-900 rounded-2xl p-4 border border-slate-800"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  :class="`w-10 h-10 rounded-xl flex items-center justify-center ${transaction.bgColor}`"
                >
                  <UIcon
                    :name="transaction.icon"
                    :class="`w-5 h-5 ${transaction.iconColor}`"
                  />
                </div>
                <div>
                  <p class="text-white font-medium">
                    {{ transaction.description }}
                  </p>
                  <p class="text-slate-400 text-sm">
                    {{ transaction.location }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p :class="`font-semibold ${transaction.amountColor}`">
                  {{ formatAmount(transaction.amount, transaction.type) }}
                </p>
                <p class="text-slate-400 text-sm">{{ transaction.date }}</p>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
// Define page meta following Nuxt best practices
definePageMeta({
  middleware: "auth",
  ssr: false,
  layout: "default",
});

// Use dashboard stats composable
const {
  thisMonthExpenses,
  pendingReceipts,
  expensesPercentageChange,
  recentTransactions,
  formatCurrency,
  formatPercentage,
  formatAmount,
} = useDashboardStats();
</script>
