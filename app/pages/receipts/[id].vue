<template>
  <ClientOnly>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-4">
              <UButton
                to="/receipts"
                variant="ghost"
                icon="i-heroicons-arrow-left"
              >
                Back to Receipts
              </UButton>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                Receipt Review
              </h1>
            </div>
            <UBadge
              v-if="receipt"
              :color="getStatusColor(receipt.status)"
              variant="solid"
              size="lg"
            >
              {{ receipt.status }}
            </UBadge>
          </div>
          <p class="text-gray-600 dark:text-gray-300">
            Review and approve receipt items for expense creation
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-12">
          <UIcon
            name="i-heroicons-arrow-path"
            class="animate-spin mx-auto h-12 w-12 text-gray-400 mb-4"
          />
          <p class="text-gray-500">Loading receipt...</p>
        </div>

        <!-- Error State -->
        <UCard v-else-if="error" class="mb-6">
          <div class="text-center py-8">
            <UIcon
              name="i-heroicons-exclamation-triangle"
              class="mx-auto h-12 w-12 text-red-400 mb-4"
            />
            <h3
              class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
            >
              Error Loading Receipt
            </h3>
            <p class="text-gray-500 dark:text-gray-400 mb-4">
              {{ error }}
            </p>
            <UButton to="/receipts" variant="outline">
              Back to Receipts
            </UButton>
          </div>
        </UCard>

        <!-- Receipt Content -->
        <div v-else-if="receipt">
          <!-- Processing Status -->
          <UCard v-if="receipt.status === 'processing'" class="mb-6">
            <div class="text-center py-8">
              <UIcon
                name="i-heroicons-arrow-path"
                class="animate-spin mx-auto h-12 w-12 text-blue-400 mb-4"
              />
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
              >
                Processing Receipt
              </h3>
              <p class="text-gray-500 dark:text-gray-400">
                We're analyzing your receipt with AI. This may take a few
                moments...
              </p>
            </div>
          </UCard>

          <!-- Error Status -->
          <UCard v-else-if="receipt.status === 'error'" class="mb-6">
            <div class="text-center py-8">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="mx-auto h-12 w-12 text-red-400 mb-4"
              />
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
              >
                Processing Failed
              </h3>
              <p class="text-gray-500 dark:text-gray-400 mb-4">
                We couldn't process this receipt.
                {{ receipt.errorMessage || "Please try uploading again." }}
              </p>
              <div class="flex justify-center gap-3">
                <UButton to="/receipts" variant="outline">
                  Back to Receipts
                </UButton>
                <UButton color="red" @click="deleteReceipt">
                  Delete Receipt
                </UButton>
              </div>
            </div>
          </UCard>

          <!-- Approved Status -->
          <UCard v-else-if="receipt.status === 'approved'" class="mb-6">
            <div class="text-center py-8">
              <UIcon
                name="i-heroicons-check-circle"
                class="mx-auto h-12 w-12 text-green-400 mb-4"
              />
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
              >
                Receipt Approved
              </h3>
              <p class="text-gray-500 dark:text-gray-400 mb-4">
                This receipt has been processed and expenses have been created.
              </p>
              <div class="flex justify-center gap-3">
                <UButton to="/receipts" variant="outline">
                  Back to Receipts
                </UButton>
                <UButton to="/expenses"> View Expenses </UButton>
              </div>
            </div>
          </UCard>

          <!-- Review Component -->
          <ReceiptReview
            v-else-if="receipt.status === 'processed'"
            :receipt="receipt"
            @approved="handleApproved"
            @rejected="handleRejected"
          />

          <!-- Raw Text Display (for uploaded status) -->
          <UCard v-else-if="receipt.status === 'uploaded'">
            <template #header>
              <h3 class="text-lg font-semibold">Receipt Uploaded</h3>
            </template>
            <div class="text-center py-8">
              <UIcon
                name="i-heroicons-clock"
                class="mx-auto h-12 w-12 text-yellow-400 mb-4"
              />
              <p class="text-gray-500 dark:text-gray-400 mb-4">
                This receipt is waiting to be processed. Processing usually
                takes 1-2 minutes.
              </p>
              <UButton @click="refreshReceipt" variant="outline">
                <UIcon name="i-heroicons-arrow-path" class="mr-2" />
                Refresh Status
              </UButton>
            </div>
          </UCard>

          <!-- Fallback for unknown status -->
          <UCard v-else>
            <template #header>
              <h3 class="text-lg font-semibold">Unknown Receipt Status</h3>
            </template>
            <div class="text-center py-8">
              <UIcon
                name="i-heroicons-question-mark-circle"
                class="mx-auto h-12 w-12 text-gray-400 mb-4"
              />
              <p class="text-gray-500 dark:text-gray-400 mb-4">
                This receipt has an unexpected status: {{ receipt.status }}
              </p>
              <div class="flex justify-center gap-3">
                <UButton @click="refreshReceipt" variant="outline">
                  <UIcon name="i-heroicons-arrow-path" class="mr-2" />
                  Refresh Status
                </UButton>
                <UButton to="/receipts" variant="outline">
                  Back to Receipts
                </UButton>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Fallback for no receipt data -->
        <UCard v-else>
          <template #header>
            <h2 class="text-xl font-semibold">No Receipt Data</h2>
          </template>
          <div class="text-center py-8">
            <UIcon
              name="i-heroicons-document"
              class="mx-auto h-12 w-12 text-gray-400 mb-4"
            />
            <p class="text-gray-500 dark:text-gray-400 mb-4">
              Unable to load receipt data. This might be a temporary issue.
            </p>
            <div class="flex justify-center gap-3">
              <UButton @click="refreshReceipt" variant="outline">
                <UIcon name="i-heroicons-arrow-path" class="mr-2" />
                Try Again
              </UButton>
              <UButton to="/receipts" variant="outline">
                Back to Receipts
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useReceipts } from "~/composables/useReceipts";
import { useExpenses } from "~/composables/useExpenses";
import ReceiptReview from "~/components/ReceiptReview.vue";

definePageMeta({
  middleware: "auth",
  ssr: false,
});

const route = useRoute();
const router = useRouter();
const {
  getReceiptById,
  deleteReceipt: deleteReceiptFn,
  listStorageFiles,
  findCorrectImageUrl,
} = useReceipts();
const { createExpense } = useExpenses();

// Reactive state
const receipt = ref(null);
const isLoading = ref(true);
const error = ref("");

// Methods
const loadReceipt = async () => {
  try {
    isLoading.value = true;
    error.value = "";

    const receiptId = route.params.id;
    if (!receiptId || typeof receiptId !== "string") {
      throw new Error("Invalid receipt ID");
    }

    const receiptData = await getReceiptById(receiptId);
    console.log("Loaded receipt data:", receiptData);
    if (!receiptData) {
      throw new Error("Receipt not found");
    }

    receipt.value = receiptData;

    // List storage files to debug
    if (receiptData.userId) {
      await listStorageFiles(receiptData.userId);

      // Try to find the correct image URL
      const correctImageUrl = await findCorrectImageUrl(
        receiptData.id,
        receiptData.userId,
        receiptData.imageUrl
      );

      if (correctImageUrl !== receiptData.imageUrl) {
        console.log(
          "Updating receipt with correct image URL:",
          correctImageUrl
        );
        receipt.value.imageUrl = correctImageUrl;
      }
    }
  } catch (err) {
    console.error("Error loading receipt:", err);
    error.value = err instanceof Error ? err.message : "Failed to load receipt";
  } finally {
    isLoading.value = false;
  }
};

const refreshReceipt = () => {
  loadReceipt();
};

const deleteReceipt = async () => {
  if (!receipt.value) return;

  try {
    const result = await deleteReceiptFn(
      receipt.value.id,
      receipt.value.imageUrl
    );
    if (result.error) {
      throw new Error(result.error);
    }

    router.push("/receipts");
  } catch (err) {
    console.error("Error deleting receipt:", err);
    // Show error toast
  }
};

const handleApproved = async (data) => {
  try {
    // Create expense records for each item
    const expensePromises = data.items.map((item) =>
      createExpense({
        amount: item.price * item.quantity,
        category: item.category,
        projectId: data.projectId,
        accountId: data.accountId,
        description: `${item.quantity}x ${item.name}`,
        date: new Date(),
        receiptId: data.receiptId,
        isManualEntry: false,
      })
    );

    await Promise.all(expensePromises);

    // Show success message
    // You can add a toast notification here

    // Navigate back to receipts
    router.push("/receipts");
  } catch (err) {
    console.error("Error creating expenses:", err);
    // Show error toast
  }
};

const handleRejected = (receiptId) => {
  // Navigate back to receipts
  router.push("/receipts");
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

// Load receipt on mount
onMounted(() => {
  loadReceipt();
});

// Watch for route changes
watch(
  () => route.params.id,
  () => {
    loadReceipt();
  }
);
</script>
