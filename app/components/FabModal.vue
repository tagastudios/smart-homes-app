<template>
  <UModal
    v-model:open="isOpen"
    :ui="{
      overlay:
        'fixed top-0 left-0 right-0 bottom-24 bg-black/40 backdrop-blur-xs',
      content:
        'fixed top-auto -bottom-8 left-1/2 -translate-x-1/2 w-full bg-transparent shadow-none ring-0',
    }"
  >
    <template #content>
      <div class="p-4">
        <!-- Hidden file input for camera/gallery -->
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          capture="environment"
          class="hidden"
          @change="handleFileSelect"
        />

        <div class="space-y-3">
          <!-- Scan Receipt -->
          <UButton
            variant="ghost"
            class="w-full flex items-center justify-start gap-3 p-3 bg-accented rounded-xl hover:bg-accented/80 transition-all"
            @click="handleAction('scan-receipt')"
          >
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/20"
            >
              <UIcon name="i-lucide-camera" class="w-5 h-5 text-purple-400" />
            </div>
            <div class="flex-1 text-left">
              <p class="font-medium">Scan Receipt</p>
              <p class="text-muted text-xs">
                Capture and process receipt automatically
              </p>
            </div>
            <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-muted" />
          </UButton>

          <!-- Add Expense -->
          <UButton
            variant="ghost"
            class="w-full flex items-center justify-start gap-3 p-3 bg-accented rounded-xl hover:bg-accented/80 transition-all"
            @click="handleAction('add-expense')"
          >
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center bg-red-500/20"
            >
              <UIcon name="i-lucide-minus" class="w-5 h-5 text-red-400" />
            </div>
            <div class="flex-1 text-left">
              <p class="font-medium">Add Expense</p>
              <p class="text-muted text-xs">Record a new business expense</p>
            </div>
            <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-muted" />
          </UButton>

          <!-- Add Income -->
          <UButton
            variant="ghost"
            class="w-full flex items-center justify-start gap-3 p-3 bg-accented rounded-xl hover:bg-accented/80 transition-all"
            @click="handleAction('add-income')"
          >
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/20"
            >
              <UIcon
                name="i-lucide-trending-up"
                class="w-5 h-5 text-green-400"
              />
            </div>
            <div class="flex-1 text-left">
              <p class="font-medium">Add Income</p>
              <p class="text-muted text-xs">Record a new income source</p>
            </div>
            <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-muted" />
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useReceiptUpload } from "~/composables/useReceiptUpload";

interface Props {
  open: boolean;
}

const props = defineProps<Props>();

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "close"): void;
  (e: "action", action: string): void;
}

const emit = defineEmits<Emits>();
const router = useRouter();
const { setFile } = useReceiptUpload();

// File input ref
const fileInput = ref<HTMLInputElement | null>(null);

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit("update:open", value),
});

const handleAction = (action: string) => {
  if (action === "scan-receipt") {
    // Trigger file input for camera/gallery
    fileInput.value?.click();
  } else {
    // Handle other actions normally
    emit("action", action);
    emit("close");
  }
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file && file.type.startsWith("image/")) {
    // Store file in shared state
    setFile(file);

    // Navigate to processing page
    router.push("/receipts/processing");

    // Close modal
    emit("close");
  } else {
    console.error("Please select a valid image file");
  }
};
</script>
