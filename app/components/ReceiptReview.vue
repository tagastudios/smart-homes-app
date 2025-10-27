<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Receipt Image -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Receipt Image
      </h3>
      <div class="relative">
        <img
          :src="receipt.imageUrl"
          alt="Receipt"
          class="w-full h-auto rounded-lg shadow-lg border"
        />
        <div class="absolute top-2 right-2">
          <UBadge :color="getStatusColor(receipt.status)" variant="solid">
            {{ receipt.status }}
          </UBadge>
        </div>
      </div>
    </div>

    <!-- OCR Results -->
    <div class="space-y-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Extracted Information
      </h3>

      <!-- Receipt Details -->
      <UCard>
        <template #header>
          <h4 class="font-medium">Receipt Details</h4>
        </template>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Merchant:</span>
            <span class="font-medium">{{
              ocrData?.merchant || "Unknown"
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Date:</span>
            <span class="font-medium">{{ ocrData?.date || "Unknown" }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Total:</span>
            <span class="font-medium text-lg"
              >${{ formatCurrency(ocrData?.totalAmount || 0) }}</span
            >
          </div>
          <div v-if="ocrData?.creditCardLastFour" class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Card:</span>
            <span class="font-medium"
              >****{{ ocrData.creditCardLastFour }}</span
            >
          </div>
        </div>
      </UCard>

      <!-- Items List -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h4 class="font-medium">Items</h4>
            <UButton size="sm" variant="outline" @click="addItem">
              <UIcon name="i-heroicons-plus" class="mr-1" />
              Add Item
            </UButton>
          </div>
        </template>

        <div class="space-y-3">
          <div
            v-for="(item, index) in items"
            :key="index"
            class="grid grid-cols-12 gap-2 items-center"
          >
            <div class="col-span-4">
              <UInput v-model="item.name" placeholder="Item name" size="sm" />
            </div>
            <div class="col-span-2">
              <UInput
                v-model.number="item.quantity"
                type="number"
                placeholder="Qty"
                size="sm"
              />
            </div>
            <div class="col-span-2">
              <UInput
                v-model.number="item.price"
                type="number"
                step="0.01"
                placeholder="Price"
                size="sm"
              />
            </div>
            <div class="col-span-3">
              <USelectMenu
                v-model="item.category"
                :options="categoryOptions"
                placeholder="Category"
                size="sm"
              />
            </div>
            <div class="col-span-1">
              <UButton
                size="sm"
                variant="ghost"
                color="red"
                icon="i-heroicons-trash"
                @click="removeItem(index)"
              />
            </div>
          </div>
        </div>

        <!-- Total Calculation -->
        <div class="mt-4 pt-4 border-t">
          <div class="flex justify-between items-center">
            <span class="font-medium">Calculated Total:</span>
            <span class="text-lg font-bold"
              >${{ formatCurrency(calculatedTotal) }}</span
            >
          </div>
          <div
            v-if="
              ocrData?.totalAmount &&
              Math.abs(calculatedTotal - ocrData.totalAmount) > 0.01
            "
            class="text-sm text-orange-600 dark:text-orange-400 mt-1"
          >
            ⚠️ Total doesn't match receipt total (${{
              formatCurrency(ocrData.totalAmount)
            }})
          </div>
        </div>
      </UCard>

      <!-- Project and Account Selection -->
      <UCard>
        <template #header>
          <h4 class="font-medium">Assignment</h4>
        </template>
        <div class="space-y-4">
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Project
            </label>
            <USelectMenu
              v-model="selectedProject"
              :options="projectOptions"
              placeholder="Select project"
            />
          </div>
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Payment Account
            </label>
            <USelectMenu
              v-model="selectedAccount"
              :options="accountOptions"
              placeholder="Select account"
            />
          </div>
        </div>
      </UCard>

      <!-- Action Buttons -->
      <div class="flex gap-3">
        <UButton
          color="red"
          variant="outline"
          :loading="isRejecting"
          @click="rejectReceipt"
        >
          <UIcon name="i-heroicons-x-mark" class="mr-2" />
          Reject & Delete
        </UButton>
        <UButton
          color="green"
          :loading="isApproving"
          :disabled="!canApprove"
          @click="approveReceipt"
        >
          <UIcon name="i-heroicons-check" class="mr-2" />
          Approve & Create Expenses
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useReceipts } from "~/composables/useReceipts";
import { useProjects } from "~/composables/useProjects";
import { useAccounts } from "~/composables/useAccounts";
import { useCategories } from "~/composables/useCategories";
import { DEFAULT_CATEGORIES } from "~/types";

const props = defineProps({
  receipt: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["approved", "rejected"]);

// Composables
const { approveReceipt: approveReceiptFn, rejectReceipt: rejectReceiptFn } =
  useReceipts();
const { projects } = useProjects();
const { accounts } = useAccounts();
const { categories } = useCategories();

// Reactive state
const items = ref([]);
const selectedProject = ref("");
const selectedAccount = ref("");
const isApproving = ref(false);
const isRejecting = ref(false);

// Computed
const ocrData = computed(() => {
  return props.receipt?.ocrData;
});

const categoryOptions = computed(() => {
  const allCategories = [...DEFAULT_CATEGORIES, ...(categories?.value || [])];
  return allCategories.map((cat) => ({
    label: cat.name,
    value: cat.name,
  }));
});

const projectOptions = computed(() => {
  return (projects?.value || []).map((project) => ({
    label: project.name,
    value: project.id,
  }));
});

const accountOptions = computed(() => {
  return (accounts?.value || []).map((account) => ({
    label: `${account.name} (${account.type})`,
    value: account.id,
  }));
});

const calculatedTotal = computed(() => {
  return items.value.reduce((total, item) => {
    return total + item.quantity * item.price;
  }, 0);
});

const canApprove = computed(() => {
  return (
    items.value.length > 0 &&
    items.value.every((item) => item.name && item.category && item.price > 0) &&
    selectedProject.value &&
    selectedAccount.value
  );
});

// Methods
const initializeItems = () => {
  if (ocrData.value?.items && ocrData.value.items.length > 0) {
    items.value = ocrData.value.items.map((item) => ({
      name: item.name || "",
      quantity: item.quantity || 1,
      price: item.price || 0,
      category: item.category || "Other",
    }));
  } else {
    // If no OCR items, create one empty item
    items.value = [
      {
        name: "",
        quantity: 1,
        price: 0,
        category: "Other",
      },
    ];
  }
};

const addItem = () => {
  items.value.push({
    name: "",
    quantity: 1,
    price: 0,
    category: "Other",
  });
};

const removeItem = (index) => {
  if (items.value.length > 1) {
    items.value.splice(index, 1);
  }
};

const formatCurrency = (amount) => {
  return Number(amount).toFixed(2);
};

const getStatusColor = (status) => {
  const colors = {
    uploaded: "blue",
    processing: "yellow",
    processed: "green",
    error: "red",
    approved: "green",
  };
  return colors[status] || "gray";
};

const approveReceipt = async () => {
  if (!canApprove.value) return;

  try {
    isApproving.value = true;

    const result = await approveReceiptFn(
      props.receipt.id,
      items.value,
      selectedProject.value,
      selectedAccount.value
    );

    if (result.error) {
      throw new Error(result.error);
    }

    emit("approved", {
      receiptId: props.receipt.id,
      items: items.value,
      projectId: selectedProject.value,
      accountId: selectedAccount.value,
    });
  } catch (error) {
    console.error("Error approving receipt:", error);
    // Show error toast
  } finally {
    isApproving.value = false;
  }
};

const rejectReceipt = async () => {
  try {
    isRejecting.value = true;

    const result = await rejectReceiptFn(
      props.receipt.id,
      props.receipt.imageUrl
    );

    if (result.error) {
      throw new Error(result.error);
    }

    emit("rejected", props.receipt.id);
  } catch (error) {
    console.error("Error rejecting receipt:", error);
    // Show error toast
  } finally {
    isRejecting.value = false;
  }
};

// Initialize items when component mounts or OCR data changes
watch(() => props.receipt.ocrData, initializeItems, { immediate: true });

onMounted(() => {
  initializeItems();
});
</script>
