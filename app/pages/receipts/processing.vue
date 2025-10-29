<template>
  <ClientOnly>
    <div
      class="min-h-screen bg-slate-950 mobile-padding-bottom flex items-center justify-center"
    >
      <div class="container mx-auto px-6 py-8 max-w-md">
        <!-- Main Processing Card -->
        <UCard
          class="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl"
        >
          <div class="p-4">
            <!-- Receipt Image Preview -->
            <div v-if="receiptImageUrl" class="mb-4">
              <div class="relative">
                <img
                  :src="receiptImageUrl"
                  alt="Receipt preview"
                  class="w-full max-h-64 object-contain rounded-xl shadow-lg transform rotate-1"
                />
                <div
                  class="absolute inset-0 bg-linear-to-br from-transparent to-slate-900/20 rounded-xl"
                ></div>
              </div>
            </div>

            <!-- Loading State -->
            <div
              v-if="isProcessing && !error && !isShowingSuccess"
              class="text-center"
            >
              <div class="flex items-center justify-center gap-3 mb-3">
                <UIcon
                  name="i-lucide-loader-2"
                  class="w-8 h-8 text-purple-400 animate-spin"
                />
                <div class="text-left">
                  <h2 class="text-2xl font-bold text-white mb-1">
                    Processing Receipt
                  </h2>
                  <p class="text-slate-400 truncate max-w-[200px]">
                    {{ currentStatusMessage }}
                  </p>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="mb-3">
                <UProgress
                  :model-value="uploadProgress"
                  :max="100"
                  size="lg"
                  color="primary"
                  class="mb-2"
                />
                <p class="text-sm text-slate-400 text-center">
                  {{ Math.round(uploadProgress) }}% complete
                </p>
              </div>
            </div>

            <!-- Success State -->
            <div v-else-if="isShowingSuccess" class="text-center">
              <UIcon
                name="i-lucide-check-circle"
                class="w-12 h-12 text-green-400 mx-auto mb-2"
              />
              <h3 class="text-xl font-bold text-white mb-2">
                Processing Complete
              </h3>
              <p class="text-slate-400">Redirecting to receipt review...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="text-center py-8">
              <UIcon
                name="i-lucide-alert-circle"
                class="w-16 h-16 text-red-400 mx-auto mb-4"
              />
              <h3 class="text-xl font-bold text-white mb-2">
                Processing Failed
              </h3>
              <p class="text-slate-400 mb-6">{{ error }}</p>

              <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <UButton
                  @click="retryUpload"
                  variant="outline"
                  class="flex-1 sm:flex-none"
                  :loading="isProcessing"
                >
                  <UIcon name="i-lucide-refresh-cw" class="w-4 h-4 mr-2" />
                  Retry Receipt
                </UButton>
                <UButton
                  to="/expenses"
                  class="flex-1 sm:flex-none bg-gradient-fab"
                >
                  <UIcon name="i-lucide-edit" class="w-4 h-4 mr-2" />
                  Manual Entry
                </UButton>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Processing Tips -->
        <UCard class="mt-4 bg-slate-900/50 rounded-2xl border border-slate-800">
          <div class="p-3">
            <div class="flex items-start gap-3">
              <UIcon
                name="i-lucide-lightbulb"
                class="w-5 h-5 text-yellow-400 mt-0.5 shrink-0"
              />
              <div>
                <p class="text-sm text-slate-300 font-medium mb-1">
                  Processing Tips
                </p>
                <p class="text-xs text-slate-400">
                  Our AI is analyzing your receipt to extract items, amounts,
                  and merchant information. This usually takes 10-30 seconds.
                </p>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useReceiptUpload } from "~/composables/useReceiptUpload";
import { useReceipts } from "~/composables/useReceipts";

definePageMeta({
  middleware: "auth",
  ssr: false,
});

const router = useRouter();
const { uploadReceiptImage, getReceiptById } = useReceipts();
const {
  uploadingFile,
  uploadProgress,
  uploadError,
  isUploading: isUploadingGlobal,
  setProgress,
  setError,
  setUploading,
  clearFile,
} = useReceiptUpload();

// Local processing state
const isProcessing = ref(false);

// Local state
const receiptImageUrl = ref<string>("");
const simulatedProgress = ref(0);
const minProcessingTime = ref(0);
const processingStartTime = ref(0);
const isProcessingComplete = ref(false);
const currentStatusMessage = ref("Initializing...");
const currentReceiptId = ref<string | null>(null);
const currentReceipt = ref<any>(null);
const statusInterval = ref<NodeJS.Timeout | null>(null);
const isShowingSuccess = ref(false);

// Methods
const startUpload = async () => {
  if (!uploadingFile.value) {
    setError("No file selected for upload");
    return;
  }

  try {
    isProcessing.value = true;
    setUploading(true);
    setError(null);
    setProgress(0);
    simulatedProgress.value = 0;
    isProcessingComplete.value = false;

    // Set processing time for animation (but don't enforce it)
    minProcessingTime.value = 10000; // 10 seconds for animation
    processingStartTime.value = Date.now();

    console.log(
      "Starting upload with animation time:",
      minProcessingTime.value,
      "ms"
    );
    console.log("isProcessing set to:", isProcessing.value);
    console.log("uploadProgress:", uploadProgress.value);

    // Create preview URL
    receiptImageUrl.value = URL.createObjectURL(uploadingFile.value);

    // Start animated progress simulation
    startProgressAnimation();

    // Upload with progress tracking
    const result = await uploadReceiptImage(uploadingFile.value, (progress) => {
      // Don't update progress from upload - use our simulated progress instead
      // setProgress(progress);
    });

    if (result.error) {
      setError(result.error);
    } else {
      // Store receipt ID for status watching
      currentReceiptId.value = result.receiptId;
      console.log("Receipt uploaded with ID:", result.receiptId);

      // Start watching for status changes instead of waiting
      startWatchingReceiptStatus();
    }
  } catch (error) {
    console.error("Upload error:", error);
    setError(error instanceof Error ? error.message : "Upload failed");
    isProcessing.value = false;
  } finally {
    setUploading(false);
  }
};

const startProgressAnimation = () => {
  const statusMessages = [
    "Initializing...",
    "Analyzing receipt image...",
    "Detecting text patterns...",
    "Extracting merchant information...",
    "Processing line items...",
    "Calculating totals...",
    "Validating data...",
    "Finalizing results...",
  ];

  const animateProgress = () => {
    const elapsed = Date.now() - processingStartTime.value;
    const progressRatio = Math.min(elapsed / minProcessingTime.value, 1);

    // Update status message based on progress
    const messageIndex = Math.min(
      Math.floor(progressRatio * statusMessages.length),
      statusMessages.length - 1
    );
    currentStatusMessage.value = statusMessages[messageIndex];

    // Simulate realistic progress with some randomness
    const baseProgress = progressRatio * 85; // Go up to 85% during processing
    const randomVariation = Math.sin(elapsed / 1500) * 2; // Moderate oscillation
    simulatedProgress.value = Math.max(
      0,
      Math.min(85, baseProgress + randomVariation)
    );

    // Update the actual progress bar
    setProgress(simulatedProgress.value);

    if (progressRatio < 1) {
      requestAnimationFrame(animateProgress);
    } else {
      // Complete the progress bar smoothly
      completeProgressAnimation();
    }
  };

  requestAnimationFrame(animateProgress);
};

const completeProgressAnimation = () => {
  currentStatusMessage.value = "Processing complete!";

  const animateToComplete = () => {
    if (simulatedProgress.value < 100) {
      simulatedProgress.value += 2;
      setProgress(simulatedProgress.value);
      requestAnimationFrame(animateToComplete);
    } else {
      isProcessingComplete.value = true;
    }
  };

  requestAnimationFrame(animateToComplete);
};

const startWatchingReceiptStatus = async () => {
  if (!currentReceiptId.value) return;

  console.log(
    "Starting to watch receipt status for ID:",
    currentReceiptId.value
  );

  // Poll for status changes every 2 seconds
  statusInterval.value = setInterval(async () => {
    try {
      const receipt = await getReceiptById(currentReceiptId.value!);
      if (receipt) {
        console.log("Receipt status:", receipt.status);
        currentReceipt.value = receipt;

        if (receipt.status === "processed") {
          console.log("Receipt processed successfully, showing success state");
          if (statusInterval.value) {
            clearInterval(statusInterval.value);
            statusInterval.value = null;
          }

          // Show success state for 1 second before redirecting
          isShowingSuccess.value = true;
          setUploading(false);

          setTimeout(async () => {
            await router.push(`/receipts/${currentReceiptId.value}`);
          }, 1000);
        } else if (receipt.status === "error") {
          console.log("Receipt processing failed");
          if (statusInterval.value) {
            clearInterval(statusInterval.value);
            statusInterval.value = null;
          }
          setError(receipt.errorMessage || "Processing failed");
        }
      }
    } catch (error) {
      console.error("Error checking receipt status:", error);
    }
  }, 2000);

  // Clean up interval after 5 minutes to prevent infinite polling
  setTimeout(() => {
    if (statusInterval.value) {
      clearInterval(statusInterval.value);
      statusInterval.value = null;
    }
  }, 300000);
};

const retryUpload = async () => {
  if (uploadingFile.value) {
    await startUpload();
  } else {
    setError("No file available for retry");
  }
};

// Cleanup
onUnmounted(() => {
  if (receiptImageUrl.value) {
    URL.revokeObjectURL(receiptImageUrl.value);
  }
  if (statusInterval.value) {
    clearInterval(statusInterval.value);
    statusInterval.value = null;
  }
});

// Start upload when component mounts
onMounted(() => {
  if (uploadingFile.value) {
    startUpload();
  } else {
    // No file available, redirect back to receipts
    router.push("/receipts");
  }
});
</script>
