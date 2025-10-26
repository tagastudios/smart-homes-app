<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex items-center justify-center z-50"
  >
    <div class="text-center">
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-12 h-12 text-primary-600 animate-spin mb-4 mx-auto"
      />
      <p class="text-lg font-semibold text-gray-900 dark:text-white">
        Smart Homes
      </p>
      <p class="text-sm text-gray-600 dark:text-gray-300 mt-2">Loading...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const show = ref(true);

// Expose method to hide loader
const hide = () => {
  show.value = false;
};

defineExpose({
  hide,
});
</script>
