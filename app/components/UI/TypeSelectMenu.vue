<template>
  <div :class="ui.wrapper">
    <USelectMenu
      v-model="selectedValue"
      :items="allOptions"
      :placeholder="placeholder"
      value-key="value"
      @update:model-value="handleUpdate"
      class="w-full"
      :ui="{
        base: `${ui.base} w-full`,
        trigger: ui.trigger,
        item: ui.option,
      }"
    >
      <template #item="{ item }">
        <div class="flex items-center gap-2">
          <UIcon
            v-if="item.icon"
            :name="item.icon"
            class="w-4 h-4 shrink-0"
            :style="{ color: item.color }"
          />
          <span>{{ item.label }}</span>
        </div>
      </template>
      <template #content-bottom>
        <div v-if="allowCustom" class="border-t border-default p-2">
          <UButton
            variant="ghost"
            size="sm"
            icon="i-lucide-plus"
            :class="ui.createButton"
            @click.stop="handleCreateCustom"
            block
          >
            {{ customLabel }}
          </UButton>
        </div>
      </template>
      <template #empty>
        <div class="p-4 text-center text-muted text-sm">
          No options available
        </div>
      </template>
    </USelectMenu>
  </div>

  <!-- Custom Creation Modal -->
  <UModal v-model:open="showCreateModal" :ui="modalUi">
    <template #content>
      <div class="p-6 bg-elevated text-default">
        <h3 class="text-lg font-semibold mb-4">{{ customModalTitle }}</h3>
        <div class="space-y-4">
          <UFormField label="Name" :ui="{ wrapper: 'w-full' }">
            <div class="w-full">
              <UInput
                v-model="customName"
                placeholder="Enter name"
                :ui="{
                  base: ui.inputBase + ' w-full',
                }"
              />
            </div>
          </UFormField>

          <!-- Icon selection removed - using default i-lucide-star for all custom types -->

          <UFormField label="Color" :ui="{ wrapper: 'w-full' }">
            <div class="flex items-start gap-3 w-full">
              <button
                type="button"
                class="w-16 h-16 rounded-lg border-2 border-default shrink-0 cursor-pointer hover:border-primary transition-colors"
                :style="{ backgroundColor: customColor }"
                @click="colorInputRef?.click()"
              />
              <input
                ref="colorInputRef"
                v-model="customColor"
                type="color"
                class="hidden"
              />
              <div class="flex-1 flex items-center">
                <span class="text-sm text-muted">{{ customColor }}</span>
              </div>
            </div>
          </UFormField>
        </div>

        <div class="flex gap-3 mt-6">
          <UButton
            variant="ghost"
            color="gray"
            @click="showCreateModal = false"
            class="flex-1"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            @click="handleConfirmCreate"
            :loading="isCreating"
            :disabled="!customName"
            class="flex-1"
          >
            Create
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useToast } from "#imports";

interface Option {
  label: string;
  value: string;
  icon?: string;
  color?: string;
  action?: string;
}

interface Props {
  modelValue: string | undefined;
  options: Option[]; // Keep prop name as options for backward compatibility
  placeholder?: string;
  allowCustom?: boolean;
  customLabel?: string;
  customModalTitle?: string;
  onCreateCustom?: (data: {
    name: string;
    icon: string;
    color: string;
  }) => Promise<{ id: string | null; error: string | null }>;
  ui?: {
    base?: string;
    trigger?: string;
    option?: string;
    inputBase?: string;
    createButton?: string;
    wrapper?: string;
  };
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "Select...",
  allowCustom: true,
  customLabel: "Add Custom...",
  customModalTitle: "Create New Item",
  ui: () => ({
    base: "bg-accented border border-default text-default focus:ring-primary",
    trigger: "text-default",
    option: "hover:bg-accented/80",
    inputBase:
      "bg-accented border border-default placeholder:text-muted focus:ring-primary",
    createButton: "text-primary hover:text-primary-600 w-full",
    wrapper: "w-full",
  }),
});

const emit = defineEmits<{
  "update:modelValue": [value: string | undefined];
  "create-custom": [data: { name: string; icon: string; color: string }];
}>();

const toast = useToast();
const selectedValue = computed<string>({
  get: () => props.modelValue ?? "",
  set: (value) => emit("update:modelValue", value || undefined),
});

const showCreateModal = ref(false);
const customName = ref("");
const customIcon = ref("i-lucide-star");
const customColor = ref("#8B5CF6");
const isCreating = ref(false);
const colorInputRef = ref<HTMLInputElement | null>(null);

const allOptions = computed(() => {
  const opts = [...props.options];

  // Don't add custom option to the list - we handle it in empty state
  return opts;
});

const handleUpdate = (value: string) => {
  // Don't emit if user clicked create custom button
  if (value === "__create_custom__") {
    handleCreateCustom();
    return;
  }
  emit("update:modelValue", value || undefined);
};

const handleCreateCustom = () => {
  showCreateModal.value = true;
};

const handleConfirmCreate = async () => {
  if (!customName.value) return;

  isCreating.value = true;

  try {
    const result = await props.onCreateCustom?.({
      name: customName.value,
      icon: customIcon.value,
      color: customColor.value,
    });

    if (result?.error) {
      toast.add({
        title: "Error",
        description: result.error,
        color: "error",
        icon: "i-lucide-alert-triangle",
      });
    } else {
      toast.add({
        title: "Success",
        description: `${customName.value} created successfully`,
        color: "success",
        icon: "i-lucide-check-circle",
      });

      // Select the newly created item
      emit("update:modelValue", customName.value);

      // Close modal and reset
      showCreateModal.value = false;
      customName.value = "";
      customIcon.value = "i-lucide-star";
      customColor.value = "#8B5CF6";
    }
  } catch (error) {
    toast.add({
      title: "Error",
      description: error instanceof Error ? error.message : "An error occurred",
      color: "error",
      icon: "i-lucide-alert-triangle",
    });
  } finally {
    isCreating.value = false;
  }
};

const modalUi = {
  wrapper: "z-50",
  overlay: { base: "bg-black/40 backdrop-blur-sm" },
  container: { padding: "p-0" },
  content: { base: "bg-elevated" },
};
</script>
