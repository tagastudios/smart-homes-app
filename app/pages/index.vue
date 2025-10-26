<template>
  <UContainer>
    <div class="min-h-screen py-8">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Smart Homes
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Construction Business Expense Tracker
        </p>
      </div>

      <!-- Navigation cards -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto"
      >
        <NuxtLink to="/expenses" class="block">
          <UCard class="hover:shadow-lg transition-shadow cursor-pointer">
            <template #header>
              <h3 class="text-xl font-semibold">Expenses</h3>
            </template>
            <p class="text-gray-600 dark:text-gray-300">
              Track and manage your business expenses
            </p>
          </UCard>
        </NuxtLink>

        <NuxtLink to="/incomes" class="block">
          <UCard class="hover:shadow-lg transition-shadow cursor-pointer">
            <template #header>
              <h3 class="text-xl font-semibold">Income</h3>
            </template>
            <p class="text-gray-600 dark:text-gray-300">
              Record and monitor your income sources
            </p>
          </UCard>
        </NuxtLink>

        <NuxtLink to="/projects" class="block">
          <UCard class="hover:shadow-lg transition-shadow cursor-pointer">
            <template #header>
              <h3 class="text-xl font-semibold">Projects</h3>
            </template>
            <p class="text-gray-600 dark:text-gray-300">
              Manage your construction projects and budgets
            </p>
          </UCard>
        </NuxtLink>

        <NuxtLink to="/receipts" class="block">
          <UCard class="hover:shadow-lg transition-shadow cursor-pointer">
            <template #header>
              <h3 class="text-xl font-semibold">Receipts</h3>
            </template>
            <p class="text-gray-600 dark:text-gray-300">
              Process and organize receipt photos
            </p>
          </UCard>
        </NuxtLink>

        <NuxtLink to="/accounts" class="block">
          <UCard class="hover:shadow-lg transition-shadow cursor-pointer">
            <template #header>
              <h3 class="text-xl font-semibold">Accounts</h3>
            </template>
            <p class="text-gray-600 dark:text-gray-300">
              Manage your financial accounts
            </p>
          </UCard>
        </NuxtLink>

        <NuxtLink to="/reports" class="block">
          <UCard class="hover:shadow-lg transition-shadow cursor-pointer">
            <template #header>
              <h3 class="text-xl font-semibold">Reports</h3>
            </template>
            <p class="text-gray-600 dark:text-gray-300">
              View financial reports and analytics
            </p>
          </UCard>
        </NuxtLink>
      </div>
    </div>
  </UContainer>
</template>

<script setup>
definePageMeta({
  middleware: "auth",
});
</script>
