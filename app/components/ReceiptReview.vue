<template>
  <div class="space-y-6">
    <!-- Receipt Image -->
    <UCard class="bg-elevated border border-default">
      <div class="relative">
        <img
          :src="receipt.imageUrl"
          alt="Receipt"
          class="w-full max-h-80 object-contain rounded-xl shadow-lg transform rotate-1"
        />
        <div
          class="absolute inset-0 bg-linear-to-br from-transparent to-default/20 rounded-xl"
        ></div>
      </div>
    </UCard>

    <!-- Validation Warning -->

    <UAlert
      v-if="hasValidationWarning"
      color="warning"
      icon="i-lucide-alert-triangle"
      title="Please review carefully"
      description="Detected discrepancies in extracted data. Please verify the totals and details before approving."
      close
      @update:open="dismissWarning"
    />

    <!-- Receipt Details -->
    <UCard class="bg-elevated border border-default">
      <div class="p-4">
        <div class="flex items-center justify-between mb-0">
          <h3 class="text-lg font-bold">Receipt Details</h3>
          <div class="flex items-center gap-2">
            <UButton
              v-if="!isEditingDetails"
              @click="handleEditDetails"
              variant="ghost"
              size="sm"
              icon="i-lucide-edit"
              class="text-muted hover:text-default"
            />
            <UButton
              v-else
              @click="isEditingDetails = false"
              variant="ghost"
              size="sm"
              icon="i-lucide-check"
              class="text-green-400 hover:text-green-300"
            />
            <UButton
              variant="ghost"
              size="sm"
              :icon="
                isCollapsedDetails
                  ? 'i-lucide-chevron-up'
                  : 'i-lucide-chevron-down'
              "
              class="text-muted hover:text-default"
              @click="isCollapsedDetails = !isCollapsedDetails"
            />
          </div>
        </div>

        <!-- View Mode (Read-only) -->
        <div
          v-if="!isCollapsedDetails && !isEditingDetails"
          class="space-y-4 mt-4"
        >
          <div class="flex justify-between items-center">
            <span class="text-muted">Merchant:</span>
            <span class="font-medium">{{
              receiptDetails.merchant || "Not set"
            }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-muted">Date:</span>
            <span class="font-medium">{{
              receiptDetails.date || "Not set"
            }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-muted">Category:</span>
            <span class="font-medium">{{
              receiptDetails.category || "Not set"
            }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-muted">Payment Method:</span>
            <span class="font-medium">{{
              getPaymentMethodName(receiptDetails.paymentMethod) || "Not set"
            }}</span>
          </div>
          <div
            v-if="receiptDetails.projectId"
            class="flex justify-between items-center"
          >
            <span class="text-muted">Project:</span>
            <span class="font-medium">{{
              getProjectName(receiptDetails.projectId)
            }}</span>
          </div>
          <div v-if="receiptDetails.notes" class="flex flex-col gap-1">
            <span class="text-muted">Notes:</span>
            <span class="font-medium">{{ receiptDetails.notes }}</span>
          </div>
        </div>

        <!-- Edit Mode -->
        <div
          v-if="!isCollapsedDetails && isEditingDetails"
          class="space-y-6 mt-4"
        >
          <!-- Merchant -->
          <UFormField label="Merchant">
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-file-text"
                class="w-5 h-5 text-muted shrink-0"
              />
              <UInput
                v-model="receiptDetails.merchant"
                placeholder="Enter merchant name"
                class="flex-1"
              />
            </div>
          </UFormField>

          <!-- Date -->
          <UFormField label="Date">
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-calendar"
                class="w-5 h-5 text-muted shrink-0"
              />
              <UInput
                v-model="receiptDetails.date"
                type="date"
                class="flex-1"
              />
            </div>
          </UFormField>

          <!-- Category -->
          <UFormField label="Category" :ui="{ wrapper: 'w-full' }">
            <div class="flex items-center gap-3 w-full">
              <UIcon name="i-lucide-tag" class="w-5 h-5 text-muted shrink-0" />
              <div class="flex-1">
                <UI-TypeSelectMenu
                  v-model="receiptDetails.category"
                  :options="categoryOptions"
                  placeholder="Select category"
                  custom-label="Add Custom Category..."
                  custom-modal-title="Create New Category"
                  :on-create-custom="handleCreateCategory"
                />
              </div>
            </div>
          </UFormField>

          <!-- Payment Method -->
          <UFormField label="Payment Method" :ui="{ wrapper: 'w-full' }">
            <div class="flex items-center gap-3 w-full">
              <UIcon
                name="i-lucide-credit-card"
                class="w-5 h-5 text-muted shrink-0"
              />
              <div class="flex-1">
                <USelectMenu
                  v-model="receiptDetails.paymentMethod"
                  :items="paymentMethodOptions"
                  placeholder="Select payment method"
                  value-key="value"
                  class="w-full"
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
                  <template #footer>
                    <div class="p-2">
                      <UButton
                        block
                        variant="ghost"
                        icon="i-lucide-plus"
                        @click="goAddAccount"
                        >Add Account...</UButton
                      >
                    </div>
                  </template>
                </USelectMenu>
              </div>
            </div>
          </UFormField>

          <!-- Project (Optional) -->
          <UFormField
            label="Project"
            hint="Optional"
            :ui="{ wrapper: 'w-full', hint: 'text-muted' }"
          >
            <div class="flex items-center gap-3 w-full">
              <UIcon
                name="i-lucide-folder"
                class="w-5 h-5 text-muted shrink-0"
              />
              <div class="flex-1">
                <USelectMenu
                  v-model="receiptDetails.projectId"
                  :items="projectOptions"
                  value-key="value"
                  class="w-full"
                >
                  <template #item="{ item }">
                    <div class="flex items-center gap-2">
                      <UIcon
                        :name="item.icon"
                        class="w-4 h-4"
                        :style="{ color: item.color }"
                      />
                      <span>{{ item.label }}</span>
                    </div>
                  </template>
                  <template #footer>
                    <div class="p-2">
                      <UButton
                        block
                        variant="ghost"
                        icon="i-lucide-plus"
                        @click="goAddProject"
                        >Add Project...</UButton
                      >
                    </div>
                  </template>
                </USelectMenu>
              </div>
            </div>
          </UFormField>

          <!-- Notes (Optional) -->
          <UFormField
            label="Notes"
            hint="Optional"
            :ui="{ hint: 'text-muted' }"
          >
            <div class="flex items-start gap-3">
              <UIcon
                name="i-lucide-file-text"
                class="w-5 h-5 text-muted shrink-0 mt-1"
              />
              <UTextarea
                v-model="receiptDetails.notes"
                placeholder="Add any additional notes"
                rows="2"
                class="flex-1"
              />
            </div>
          </UFormField>
        </div>
      </div>
    </UCard>

    <!-- Line Items -->
    <UCard class="bg-elevated border border-default">
      <div class="p-4">
        <div class="flex items-center justify-between mb-0">
          <h3 class="text-lg font-bold">Line Items ({{ items.length }})</h3>
          <div class="flex items-center gap-2">
            <UButton
              v-if="!isEditingItems"
              @click="handleEditItems"
              variant="ghost"
              size="sm"
              icon="i-lucide-edit"
              class="text-muted hover:text-default"
            />
            <UButton
              v-else
              @click="isEditingItems = false"
              variant="ghost"
              size="sm"
              icon="i-lucide-check"
              class="text-green-400 hover:text-green-300"
            />
            <UButton
              variant="ghost"
              size="sm"
              :icon="
                isCollapsedItems
                  ? 'i-lucide-chevron-up'
                  : 'i-lucide-chevron-down'
              "
              class="text-muted hover:text-default"
              @click="isCollapsedItems = !isCollapsedItems"
            />
          </div>
        </div>

        <!-- Summary View (Read-only) -->
        <div v-if="!isCollapsedItems && !isEditingItems" class="space-y-4 mt-4">
          <div
            v-for="(item, index) in items"
            :key="index"
            class="bg-accented rounded-xl p-5 border border-default transition-colors hover:border-default/70"
          >
            <div class="flex justify-between items-start mb-3">
              <div class="flex-1 pr-4">
                <h4 class="text-base font-semibold mb-2 leading-tight">
                  {{ item.name || "Unnamed Item" }}
                </h4>
              </div>
              <div class="text-right shrink-0">
                <div class="text-lg font-bold">
                  ${{
                    formatCurrency((item.price || 0) * (item.quantity || 1))
                  }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-6 pt-3 border-t border-default">
              <div class="text-sm text-muted">
                <span class="font-medium text-muted">Qty:</span>
                <span class="ml-1 font-medium">{{ item.quantity || 1 }}</span>
              </div>
              <div class="text-sm text-muted">
                <span class="font-medium text-muted">Price:</span>
                <span class="ml-1 font-medium"
                  >${{ formatCurrency(item.price || 0) }}</span
                >
              </div>
              <div v-if="item.category" class="ml-auto">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30"
                >
                  {{ item.category }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Edit View -->
        <div v-if="!isCollapsedItems && isEditingItems" class="space-y-4 mt-4">
          <div
            v-for="(item, index) in items"
            :key="index"
            class="bg-accented rounded-xl p-5 border border-default"
          >
            <div class="space-y-4">
              <!-- Item Name - Full Width -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium">Item Name</span>
                  <UButton
                    size="sm"
                    variant="ghost"
                    color="red"
                    icon="i-lucide-trash-2"
                    @click="removeItem(index)"
                    class="text-muted hover:text-default"
                  />
                </div>
                <UInput
                  v-model="item.name"
                  placeholder="Enter item name"
                  class="w-full"
                />
              </div>

              <!-- Quantity, Price, Category - Horizontal Row -->
              <div class="grid grid-cols-12 gap-4">
                <div class="col-span-3">
                  <UFormField label="Quantity">
                    <UInput
                      v-model.number="item.quantity"
                      type="number"
                      min="1"
                      placeholder="1"
                      class="w-full"
                    />
                  </UFormField>
                </div>
                <div class="col-span-3">
                  <UFormField label="Price">
                    <UInput
                      v-model.number="item.price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      class="w-full"
                    />
                  </UFormField>
                </div>
                <div class="col-span-6">
                  <UFormField label="Category">
                    <UI-TypeSelectMenu
                      v-model="item.category"
                      :options="categoryOptions"
                      placeholder="Select category"
                      custom-label="Add Custom..."
                      custom-modal-title="Create Category"
                      :on-create-custom="handleCreateCategory"
                    />
                  </UFormField>
                </div>
              </div>

              <!-- Total for this item -->
              <div class="flex justify-end pt-2 border-t border-default">
                <div class="text-sm text-muted">
                  <span class="font-medium">Subtotal:</span>
                  <span class="ml-2 text-lg font-bold">
                    ${{
                      formatCurrency((item.price || 0) * (item.quantity || 1))
                    }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Add Item Button -->
        <div v-if="isEditingItems && !isCollapsedItems" class="mt-6">
          <UButton
            @click="addItem"
            variant="outline"
            size="lg"
            class="w-full border border-default text-default hover:bg-accented hover:border-default font-medium"
          >
            <UIcon name="i-lucide-plus" class="mr-2 size-5" />
            Add Item
          </UButton>
        </div>

        <!-- Totals moved to Financial Summary card below -->
      </div>
    </UCard>

    <!-- Financial Summary -->
    <UCard class="bg-elevated border border-default">
      <div class="p-4">
        <div class="flex items-center justify-between mb-0">
          <h3 class="text-lg font-bold">Financial Summary</h3>
          <div class="flex items-center gap-2">
            <UButton
              v-if="!isEditingSummary"
              @click="handleEditSummary"
              variant="ghost"
              size="sm"
              icon="i-lucide-edit"
              class="text-muted hover:text-default"
            />
            <UButton
              v-else
              @click="isEditingSummary = false"
              variant="ghost"
              size="sm"
              icon="i-lucide-check"
              class="text-green-400 hover:text-green-300"
            />
            <UButton
              variant="ghost"
              size="sm"
              :icon="
                isCollapsedSummary
                  ? 'i-lucide-chevron-up'
                  : 'i-lucide-chevron-down'
              "
              class="text-muted hover:text-default"
              @click="isCollapsedSummary = !isCollapsedSummary"
            />
          </div>
        </div>

        <!-- View Mode -->
        <div v-if="!isCollapsedSummary && !isEditingSummary" class="mt-4">
          <div class="flex justify-between items-center mb-2">
            <span class="font-medium">Subtotal:</span>
            <span class="text-lg font-bold"
              >${{ formatCurrency(calculatedSubtotal) }}</span
            >
          </div>
          <div class="flex justify-between items-center mb-2">
            <span class="font-medium">Tax:</span>
            <span class="text-lg font-bold"
              >${{ formatCurrency(receiptDetails.tax || 0) }}</span
            >
          </div>
          <div
            class="flex justify-between items-center pt-2 border-t border-default"
          >
            <span class="font-medium">Total:</span>
            <span class="text-xl font-bold"
              >${{ formatCurrency(receiptDetails.totalAmount || 0) }}</span
            >
          </div>
          <div v-if="hasTotalDiscrepancy" class="text-sm text-orange-400 mt-2">
            ⚠️ Calculated total (${{ formatCurrency(calculatedTotal) }}) doesn't
            match receipt total (${{
              formatCurrency(receiptDetails.totalAmount)
            }})
          </div>
        </div>

        <!-- Edit Mode -->
        <div
          v-if="!isCollapsedSummary && isEditingSummary"
          class="space-y-4 mt-4"
        >
          <UFormField label="Subtotal">
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-calculator"
                class="w-5 h-5 text-muted shrink-0"
              />
              <UInput
                v-model.number="receiptDetails.subtotal"
                type="number"
                min="0"
                step="0.01"
                class="flex-1"
              />
            </div>
          </UFormField>
          <UFormField label="Tax">
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-percent"
                class="w-5 h-5 text-muted shrink-0"
              />
              <UInput
                v-model.number="receiptDetails.tax"
                type="number"
                min="0"
                step="0.01"
                class="flex-1"
              />
            </div>
          </UFormField>
          <UFormField label="Total Amount">
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-receipt"
                class="w-5 h-5 text-muted shrink-0"
              />
              <UInput
                v-model.number="receiptDetails.totalAmount"
                type="number"
                min="0"
                step="0.01"
                class="flex-1"
              />
            </div>
          </UFormField>
        </div>
      </div>
    </UCard>

    <!-- Action Buttons -->
    <div class="flex gap-4 items-center pb-6">
      <UButton
        @click="rejectReceipt"
        size="xl"
        color="error"
        variant="outline"
        class="flex-1 font-semibold py-4 px-6 rounded-lg"
        :ui="{
          base: 'flex items-center justify-center border border-default text-default hover:bg-accented',
        }"
        :loading="isRejecting"
      >
        <UIcon name="i-lucide-x" class="mr-2 size-5" />
        Reject
      </UButton>
      <UButton
        @click="approveReceipt"
        size="xl"
        class="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 font-semibold py-4 px-6 rounded-lg"
        :ui="{ base: 'flex items-center justify-center' }"
        :loading="isApproving"
        :disabled="!canApprove"
      >
        <UIcon name="i-lucide-check" class="mr-2 size-5" />
        Approve
      </UButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useReceipts } from "~/composables/useReceipts";
import { useProjects } from "~/composables/useProjects";
import { useAccounts } from "~/composables/useAccounts";
import { useCategories } from "~/composables/useCategories";
import { useAccountTypes } from "~/composables/useAccountTypes";

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
const { allCategories, createCategory } = useCategories();
const { allAccountTypes } = useAccountTypes();

// Reactive state
const items = ref([]);
const receiptDetails = ref({
  merchant: "",
  date: "",
  subtotal: 0,
  tax: 0,
  totalAmount: 0,
  category: "",
  paymentMethod: "",
  projectId: "",
  notes: "",
});
const isApproving = ref(false);
const isRejecting = ref(false);
const warningDismissed = ref(false);
const isEditingItems = ref(false);
const isEditingSummary = ref(false);
const isEditingDetails = ref(false);
const isCollapsedDetails = ref(false); // Start expanded (false = expanded, true = collapsed)
const isCollapsedSummary = ref(false); // Start expanded
const isCollapsedItems = ref(false); // Start expanded

// Computed
const ocrData = computed(() => {
  return props.receipt?.ocrData;
});

const categoryOptions = computed(() => {
  return allCategories.value.map((cat) => ({
    label: cat.name,
    value: cat.name,
    icon: cat.icon,
    color: cat.color,
  }));
});

const projectOptions = computed(() => {
  return (projects?.value || []).map((project) => ({
    label: project.name,
    value: project.id,
    icon: "i-lucide-folder",
    color: "#8B5CF6",
  }));
});

const paymentMethodOptions = computed(() => {
  return (accounts?.value || []).map((account) => ({
    label: `${account.name} (${account.type})`,
    value: account.id,
    icon: getAccountIcon(account.type),
    color: getAccountColor(account.type),
  }));
});

const getAccountIcon = (type) => {
  if (!type) return "i-lucide-credit-card";
  const accountType = allAccountTypes.value.find(
    (t) => t.name.toLowerCase() === String(type).toLowerCase()
  );
  return accountType ? accountType.icon : "i-lucide-credit-card";
};

const getAccountColor = (type) => {
  if (!type) return "#8B5CF6";
  const accountType = allAccountTypes.value.find(
    (t) => t.name.toLowerCase() === String(type).toLowerCase()
  );
  return accountType ? accountType.color : "#8B5CF6";
};

const handleCreateCategory = async (data) => {
  return await createCategory(data.name, data.color, data.icon);
};

const goAddProject = () => router.push("/projects");
const goAddAccount = () => router.push("/accounts");

const calculatedSubtotal = computed(() => {
  return items.value.reduce((total, item) => {
    return total + (item.price || 0) * (item.quantity || 1);
  }, 0);
});

const calculatedTotal = computed(() => {
  return calculatedSubtotal.value + (receiptDetails.value.tax || 0);
});

const hasTotalDiscrepancy = computed(() => {
  if (!receiptDetails.value.totalAmount || !calculatedTotal.value) return false;
  const discrepancy = Math.abs(
    calculatedTotal.value - receiptDetails.value.totalAmount
  );
  return discrepancy > Math.max(receiptDetails.value.totalAmount * 0.01, 0.5);
});

const hasValidationWarning = computed(() => {
  if (warningDismissed.value) return false;
  return (
    hasTotalDiscrepancy.value ||
    (ocrData.value?.confidence && ocrData.value.confidence < 0.8)
  );
});

const canApprove = computed(() => {
  return (
    items.value.length > 0 &&
    items.value.every((item) => item.name && item.price && item.category) &&
    receiptDetails.value.merchant &&
    receiptDetails.value.totalAmount > 0
  );
});

// Methods
const formatCurrency = (amount) => {
  return (amount || 0).toFixed(2);
};

const addItem = () => {
  items.value.push({
    name: "",
    quantity: 1,
    price: 0,
    category: "",
  });
};

const removeItem = (index) => {
  items.value.splice(index, 1);
};

const getPaymentMethodName = (accountId) => {
  if (!accountId) return "";
  const account = accounts?.value?.find((acc) => acc.id === accountId);
  return account ? `${account.name} (${account.type})` : "";
};

const getProjectName = (projectId) => {
  if (!projectId) return "";
  const project = projects?.value?.find((proj) => proj.id === projectId);
  return project ? project.name : "";
};

const handleEditDetails = () => {
  isCollapsedDetails.value = false; // Expand if collapsed
  isEditingDetails.value = true;
};

const handleEditItems = () => {
  isCollapsedItems.value = false; // Expand if collapsed
  isEditingItems.value = true;
};

const handleEditSummary = () => {
  isCollapsedSummary.value = false; // Expand if collapsed
  isEditingSummary.value = true;
};

const dismissWarning = () => {
  warningDismissed.value = true;
};

const approveReceipt = async () => {
  if (!canApprove.value) return;

  try {
    isApproving.value = true;

    // Update receipt status
    await approveReceiptFn(
      props.receipt.id,
      items.value,
      receiptDetails.value.projectId || "",
      receiptDetails.value.paymentMethod || "",
      {
        date: receiptDetails.value.date,
        merchant: receiptDetails.value.merchant,
        notes: receiptDetails.value.notes,
        totalAmount: receiptDetails.value.totalAmount,
        imageUrl: props.receipt.imageUrl,
        ocrData: ocrData.value,
      }
    );

    // Emit approved event with data
    emit("approved", {
      receiptId: props.receipt.id,
      items: items.value,
      projectId: receiptDetails.value.projectId,
      accountId: receiptDetails.value.paymentMethod,
      receiptDetails: receiptDetails.value,
    });
  } catch (error) {
    console.error("Error approving receipt:", error);
    // Show error toast
    const toast = useToast();
    toast.add({
      title: "Error approving receipt",
      description: error.message,
      color: "error",
      icon: "i-lucide-alert-triangle",
    });
  } finally {
    isApproving.value = false;
  }
};

const rejectReceipt = async () => {
  try {
    isRejecting.value = true;

    // Delete receipt and image
    await rejectReceiptFn(props.receipt.id, props.receipt.imageUrl);

    // Emit rejected event
    emit("rejected", props.receipt.id);
  } catch (error) {
    console.error("Error rejecting receipt:", error);
    // Show error toast
    const toast = useToast();
    toast.add({
      title: "Error rejecting receipt",
      description: error.message,
      color: "error",
      icon: "i-lucide-alert-triangle",
    });
  } finally {
    isRejecting.value = false;
  }
};

// Initialize data from OCR
onMounted(() => {
  if (ocrData.value) {
    // Calculate subtotal from items
    const itemsSubtotal =
      ocrData.value.items?.reduce((sum, item) => {
        return sum + (item.price || 0) * (item.quantity || 1);
      }, 0) || 0;

    // Calculate tax (if total is available, tax = total - subtotal)
    const extractedTotal = ocrData.value.totalAmount || 0;
    const calculatedTax =
      extractedTotal > itemsSubtotal ? extractedTotal - itemsSubtotal : 0;

    // Initialize receipt details from OCR data
    receiptDetails.value = {
      merchant: ocrData.value.merchant || "",
      date: ocrData.value.date
        ? new Date(ocrData.value.date).toISOString().split("T")[0]
        : "",
      subtotal: itemsSubtotal,
      tax: calculatedTax,
      totalAmount: extractedTotal,
      category: ocrData.value.items?.[0]?.category || "",
      paymentMethod: "",
      projectId: "",
      notes: "",
    };

    // Initialize items from OCR data
    if (ocrData.value.items && ocrData.value.items.length > 0) {
      items.value = ocrData.value.items.map((item) => ({
        name: item.name || "",
        quantity: item.quantity || 1,
        price: item.price || 0,
        category: item.category || "",
      }));
    } else {
      // Add one empty item if no items detected
      addItem();
    }
  } else {
    // Add one empty item if no OCR data
    addItem();
  }
});
</script>
