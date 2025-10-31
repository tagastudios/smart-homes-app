<template>
  <UModal v-model="isOpen" :ui="{ width: 'w-full sm:max-w-md' }">
    <UCard
      :ui="{
        base: 'h-full flex flex-col',
        rounded: 'rounded-2xl',
        divide: 'divide-y divide-default',
        header: { padding: 'px-6 py-4' },
        body: { padding: 'px-6 py-6' },
        footer: { padding: 'px-6 py-4' },
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Add Expense</h3>
          <UButton
            variant="ghost"
            icon="i-lucide-x"
            @click="$emit('close')"
            class="text-muted hover:text-default"
          />
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-muted">Expense form will be implemented here...</p>
        <div class="bg-accented rounded-xl p-4">
          <p class="text-sm text-muted">
            This is a placeholder for the expense form.
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <UButton variant="ghost" @click="$emit('close')" class="flex-1">
            Cancel
          </UButton>
          <UButton color="primary" class="flex-1" disabled>
            Add Expense
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "close"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});
</script>
