<template>
  <ClientOnly>
    <div class="min-h-screen bg-slate-950 mobile-padding-bottom">
      <!-- Gradient Header -->
      <div
        class="bg-gradient-to-r from-purple-700 to-blue-700 px-6 py-6 rounded-b-3xl shadow-lg"
      >
        <div class="flex items-center justify-between">
          <UButton
            to="/receipts"
            variant="ghost"
            icon="i-lucide-arrow-left"
            iconClass="size-7 text-white stroke-[3]"
            class="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl px-3 py-3 shadow-md border border-white/30 text-white"
          />
          <h1 class="text-2xl font-bold text-white">Review Receipt</h1>
          <div class="w-10"></div>
          <!-- Spacer for centering -->
        </div>
      </div>

      <div class="container mx-auto px-6 py-6">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-12">
          <UIcon
            name="i-lucide-loader-2"
            class="animate-spin mx-auto h-12 w-12 text-purple-400 mb-4"
          />
          <p class="text-slate-400">Loading receipt...</p>
        </div>

        <!-- Error State -->
        <UCard v-else-if="error" class="mb-6 bg-slate-900 border-slate-800">
          <div class="text-center py-8">
            <UIcon
              name="i-lucide-alert-triangle"
              class="mx-auto h-12 w-12 text-red-400 mb-4"
            />
            <h3 class="text-lg font-semibold text-white mb-2">
              Error Loading Receipt
            </h3>
            <p class="text-slate-400 mb-4">
              {{ error }}
            </p>
            <UButton
              to="/receipts"
              variant="outline"
              class="border-slate-600 text-slate-300"
            >
              Back to Receipts
            </UButton>
          </div>
        </UCard>

        <!-- Receipt Content -->
        <div v-else-if="receipt">
          <!-- Processing Status -->
          <UCard
            v-if="receipt.status === 'processing'"
            class="mb-6 bg-slate-900 border-slate-800"
          >
            <div class="text-center py-8">
              <UIcon
                name="i-lucide-loader-2"
                class="animate-spin mx-auto h-12 w-12 text-purple-400 mb-4"
              />
              <h3 class="text-lg font-semibold text-white mb-2">
                Processing Receipt
              </h3>
              <p class="text-slate-400">
                We're analyzing your receipt with AI. This may take a few
                moments...
              </p>
            </div>
          </UCard>

          <!-- Error Status -->
          <UCard
            v-else-if="receipt.status === 'error'"
            class="mb-6 bg-slate-900 border-slate-800"
          >
            <div class="text-center py-8">
              <UIcon
                name="i-lucide-alert-triangle"
                class="mx-auto h-12 w-12 text-red-400 mb-4"
              />
              <h3 class="text-lg font-semibold text-white mb-2">
                Processing Failed
              </h3>
              <p class="text-slate-400 mb-4">
                We couldn't process this receipt.
                {{ receipt.errorMessage || "Please try uploading again." }}
              </p>
              <div class="flex justify-center gap-3">
                <UButton
                  to="/receipts"
                  variant="outline"
                  class="border-slate-600 text-slate-300"
                >
                  Back to Receipts
                </UButton>
                <UButton color="red" @click="deleteReceipt">
                  Delete Receipt
                </UButton>
              </div>
            </div>
          </UCard>

          <!-- Approved Status -->
          <UCard
            v-else-if="receipt.status === 'approved'"
            class="mb-6 bg-slate-900 border-slate-800"
          >
            <div class="text-center py-8">
              <UIcon
                name="i-lucide-check-circle"
                class="mx-auto h-12 w-12 text-green-400 mb-4"
              />
              <h3 class="text-lg font-semibold text-white mb-2">
                Receipt Approved
              </h3>
              <p class="text-slate-400 mb-4">
                This receipt has been processed and expenses have been created.
              </p>
              <div class="flex justify-center gap-3">
                <UButton
                  to="/receipts"
                  variant="outline"
                  class="border-slate-600 text-slate-300"
                >
                  Back to Receipts
                </UButton>
                <UButton
                  to="/expenses"
                  class="bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  View Expenses
                </UButton>
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
          <UCard
            v-else-if="receipt.status === 'uploaded'"
            class="bg-slate-900 border-slate-800"
          >
            <template #header>
              <h3 class="text-lg font-semibold text-white">Receipt Uploaded</h3>
            </template>
            <div class="text-center py-8">
              <UIcon
                name="i-lucide-clock"
                class="mx-auto h-12 w-12 text-yellow-400 mb-4"
              />
              <p class="text-slate-400 mb-4">
                This receipt is waiting to be processed. Processing usually
                takes 1-2 minutes.
              </p>
              <UButton
                @click="refreshReceipt"
                variant="outline"
                class="border-slate-600 text-slate-300"
              >
                <UIcon name="i-lucide-refresh-cw" class="mr-2" />
                Refresh Status
              </UButton>
            </div>
          </UCard>

          <!-- Fallback for unknown status -->
          <UCard v-else class="bg-slate-900 border-slate-800">
            <template #header>
              <h3 class="text-lg font-semibold text-white">
                Unknown Receipt Status
              </h3>
            </template>
            <div class="text-center py-8">
              <UIcon
                name="i-lucide-help-circle"
                class="mx-auto h-12 w-12 text-slate-400 mb-4"
              />
              <p class="text-slate-400 mb-4">
                This receipt has an unexpected status: {{ receipt.status }}
              </p>
              <div class="flex justify-center gap-3">
                <UButton
                  @click="refreshReceipt"
                  variant="outline"
                  class="border-slate-600 text-slate-300"
                >
                  <UIcon name="i-lucide-refresh-cw" class="mr-2" />
                  Refresh Status
                </UButton>
                <UButton
                  to="/receipts"
                  variant="outline"
                  class="border-slate-600 text-slate-300"
                >
                  Back to Receipts
                </UButton>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Fallback for no receipt data -->
        <UCard v-else class="bg-slate-900 border-slate-800">
          <template #header>
            <h2 class="text-xl font-semibold text-white">No Receipt Data</h2>
          </template>
          <div class="text-center py-8">
            <UIcon
              name="i-lucide-file-text"
              class="mx-auto h-12 w-12 text-slate-400 mb-4"
            />
            <p class="text-slate-400 mb-4">
              Unable to load receipt data. This might be a temporary issue.
            </p>
            <div class="flex justify-center gap-3">
              <UButton
                @click="refreshReceipt"
                variant="outline"
                class="border-slate-600 text-slate-300"
              >
                <UIcon name="i-lucide-refresh-cw" class="mr-2" />
                Try Again
              </UButton>
              <UButton
                to="/receipts"
                variant="outline"
                class="border-slate-600 text-slate-300"
              >
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

    // Show success toast
    const toast = useToast();
    toast.add({
      title: "Receipt added successfully!",
      color: "success",
      icon: "i-lucide-check-circle",
    });

    // Navigate to dashboard
    router.push("/");
  } catch (err) {
    console.error("Error creating expenses:", err);
    // Show error toast
    const toast = useToast();
    toast.add({
      title: "Error creating expenses",
      description: err.message,
      color: "error",
      icon: "i-lucide-alert-triangle",
    });
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
