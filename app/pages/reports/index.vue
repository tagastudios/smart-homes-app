<template>
  <ClientOnly>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div class="container mx-auto px-4 py-8">
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Reports
            </h1>
            <UButton to="/" variant="ghost" icon="i-heroicons-arrow-left">
              Back to Home
            </UButton>
          </div>
          <p class="text-gray-600 dark:text-gray-300">
            View financial reports and analytics
          </p>
        </div>

        <UCard class="mb-6">
          <template #header>
            <h2 class="text-xl font-semibold">Report Types</h2>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <UButton size="lg" class="justify-start">
              <UIcon name="i-heroicons-chart-bar" class="mr-2" />
              Income vs Expenses
            </UButton>
            <UButton size="lg" variant="outline" class="justify-start">
              <UIcon name="i-heroicons-chart-pie" class="mr-2" />
              Category Breakdown
            </UButton>
            <UButton size="lg" variant="outline" class="justify-start">
              <UIcon name="i-heroicons-calendar" class="mr-2" />
              Time Period Reports
            </UButton>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">Available Reports</h2>
          </template>
          <div class="text-center py-8">
            <UIcon
              name="i-heroicons-chart-bar-square"
              class="mx-auto h-12 w-12 text-gray-400 mb-4"
            />
            <p class="text-gray-500 dark:text-gray-400">
              No data available for reports
            </p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Add some expenses and income to generate reports
            </p>
          </div>
        </UCard>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
definePageMeta({
  middleware: "auth",
  ssr: false,
});
// Reports page - placeholder for now
</script>
