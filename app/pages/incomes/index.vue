<template>
  <ClientOnly>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div class="container mx-auto px-4 py-8">
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Income
            </h1>
            <UButton to="/" variant="ghost" icon="i-heroicons-arrow-left">
              Back to Home
            </UButton>
          </div>
          <p class="text-gray-600 dark:text-gray-300">
            Record and monitor your income sources
          </p>
        </div>

        <UCard class="mb-6">
          <template #header>
            <h2 class="text-xl font-semibold">Quick Actions</h2>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <UButton size="lg" class="justify-start">
              <UIcon name="i-heroicons-plus" class="mr-2" />
              Add Income
            </UButton>
            <UButton size="lg" variant="outline" class="justify-start">
              <UIcon name="i-heroicons-banknotes" class="mr-2" />
              Record Payment
            </UButton>
            <UButton size="lg" variant="outline" class="justify-start">
              <UIcon name="i-heroicons-chart-bar" class="mr-2" />
              View Reports
            </UButton>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">Recent Income</h2>
          </template>
          <div class="text-center py-8">
            <UIcon
              name="i-heroicons-currency-dollar"
              class="mx-auto h-12 w-12 text-gray-400 mb-4"
            />
            <p class="text-gray-500 dark:text-gray-400">
              No income recorded yet
            </p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Start by adding your first income entry
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
// Income page - placeholder for now
</script>
