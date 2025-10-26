<template>
  <div class="min-h-screen bg-red-500 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Smart Homes
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Construction Business Expense Tracker
        </p>

        <!-- Test basic styling first -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 class="text-2xl font-semibold mb-4">Test Card</h2>
          <p class="text-gray-600 dark:text-gray-300">
            This should be styled with Tailwind CSS
          </p>
        </div>

        <!-- Navigation cards -->
        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          <NuxtLink to="/expenses" class="block">
            <div
              class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <h3 class="text-xl font-semibold mb-2">Expenses</h3>
              <p class="text-gray-600 dark:text-gray-300">
                Track and manage your business expenses
              </p>
            </div>
          </NuxtLink>

          <NuxtLink to="/incomes" class="block">
            <div
              class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <h3 class="text-xl font-semibold mb-2">Income</h3>
              <p class="text-gray-600 dark:text-gray-300">
                Record and monitor your income sources
              </p>
            </div>
          </NuxtLink>

          <NuxtLink to="/projects" class="block">
            <div
              class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <h3 class="text-xl font-semibold mb-2">Projects</h3>
              <p class="text-gray-600 dark:text-gray-300">
                Manage your construction projects and budgets
              </p>
            </div>
          </NuxtLink>

          <NuxtLink to="/receipts" class="block">
            <div
              class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <h3 class="text-xl font-semibold mb-2">Receipts</h3>
              <p class="text-gray-600 dark:text-gray-300">
                Process and organize receipt photos
              </p>
            </div>
          </NuxtLink>

          <NuxtLink to="/accounts" class="block">
            <div
              class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <h3 class="text-xl font-semibold mb-2">Accounts</h3>
              <p class="text-gray-600 dark:text-gray-300">
                Manage your financial accounts
              </p>
            </div>
          </NuxtLink>

          <NuxtLink to="/reports" class="block">
            <div
              class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <h3 class="text-xl font-semibold mb-2">Reports</h3>
              <p class="text-gray-600 dark:text-gray-300">
                View financial reports and analytics
              </p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// This page handles the root route "/"
</script>
