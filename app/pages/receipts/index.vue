<template>
  <ClientOnly>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div class="container mx-auto px-4 py-8">
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Receipts
            </h1>
            <UButton to="/" variant="ghost" icon="i-heroicons-arrow-left">
              Back to Home
            </UButton>
          </div>
          <p class="text-gray-600 dark:text-gray-300">
            Process and organize receipt photos
          </p>
        </div>

        <!-- Upload Actions -->
        <UCard class="mb-6">
          <template #header>
            <h2 class="text-xl font-semibold">Capture Receipt</h2>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UButton
              size="lg"
              class="justify-start"
              :loading="isCapturing"
              @click="startCameraCapture"
            >
              <UIcon name="i-heroicons-camera" class="mr-2" />
              Take Photo
            </UButton>
            <UButton
              size="lg"
              variant="outline"
              class="justify-start"
              :loading="isUploading"
              @click="triggerFileUpload"
            >
              <UIcon name="i-heroicons-photo" class="mr-2" />
              Upload Image
            </UButton>
          </div>

          <!-- Hidden file input -->
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileSelect"
          />
        </UCard>

        <!-- Image Preview Modal -->
        <UModal v-model="showPreview" :ui="{ width: 'max-w-2xl' }">
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Review Receipt</h3>
            </template>

            <div class="space-y-4">
              <div class="text-center">
                <img
                  :src="previewImageUrl"
                  alt="Receipt preview"
                  class="max-h-96 mx-auto rounded-lg shadow-lg"
                />
              </div>

              <div class="flex justify-end gap-3">
                <UButton variant="outline" @click="cancelUpload">
                  Cancel
                </UButton>
                <UButton :loading="isUploading" @click="uploadReceipt">
                  Upload Receipt
                </UButton>
              </div>
            </div>
          </UCard>
        </UModal>

        <!-- Camera Modal -->
        <UModal v-model="showCamera" :ui="{ width: 'max-w-4xl' }">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">Camera Capture</h3>
                <UButton
                  variant="ghost"
                  icon="i-heroicons-x-mark"
                  @click="stopCamera"
                />
              </div>
            </template>

            <div class="space-y-4">
              <div class="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref="videoElement"
                  autoplay
                  playsinline
                  class="w-full h-96 object-cover"
                />
                <div
                  v-if="!stream"
                  class="absolute inset-0 flex items-center justify-center"
                >
                  <div
                    class="border-2 border-white border-dashed rounded-lg p-8"
                  >
                    <UIcon
                      name="i-heroicons-camera"
                      class="text-white text-4xl"
                    />
                  </div>
                </div>
              </div>

              <div class="flex justify-center gap-3">
                <UButton variant="outline" @click="stopCamera">
                  Cancel
                </UButton>
                <UButton :loading="isCapturing" @click="capturePhoto">
                  <UIcon name="i-heroicons-camera" class="mr-2" />
                  Capture
                </UButton>
              </div>
            </div>
          </UCard>
        </UModal>

        <!-- Receipts List -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold">Recent Receipts</h2>
              <USelectMenu
                v-model="selectedStatus"
                :options="statusOptions"
                placeholder="Filter by status"
                class="w-48"
              />
            </div>
          </template>

          <div v-if="isLoading" class="text-center py-8">
            <UIcon
              name="i-heroicons-arrow-path"
              class="animate-spin mx-auto h-8 w-8 text-gray-400 mb-4"
            />
            <p class="text-gray-500">Loading receipts...</p>
          </div>

          <div
            v-else-if="filteredReceipts.length === 0"
            class="text-center py-8"
          >
            <UIcon
              name="i-heroicons-document"
              class="mx-auto h-12 w-12 text-gray-400 mb-4"
            />
            <p class="text-gray-500 dark:text-gray-400">No receipts found</p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Start by taking a photo of your receipt
            </p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="receipt in filteredReceipts"
              :key="receipt.id"
              class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div class="flex items-center space-x-4">
                <div
                  class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center"
                >
                  <UIcon
                    name="i-heroicons-document-text"
                    class="text-gray-500 text-xl"
                  />
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    Receipt {{ receipt.id.slice(-8) }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDate(receipt.uploadDate) }}
                  </p>
                </div>
              </div>

              <div class="flex items-center space-x-3">
                <UBadge
                  :color="getStatusColor(receipt.status)"
                  variant="subtle"
                >
                  {{ receipt.status }}
                </UBadge>
                <UButton
                  variant="ghost"
                  size="sm"
                  :to="`/receipts/${receipt.id}`"
                >
                  View
                </UButton>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useReceipts } from "~/composables/useReceipts";

definePageMeta({
  middleware: "auth",
  ssr: false,
});

const { receipts, isLoading, uploadReceiptImage, getReceiptsByStatus } =
  useReceipts();

// Reactive state
const showPreview = ref(false);
const showCamera = ref(false);
const isCapturing = ref(false);
const isUploading = ref(false);
const previewImageUrl = ref("");
const selectedFile = ref(null);
const selectedStatus = ref("all");

// Camera elements
const videoElement = ref(null);
const fileInput = ref(null);
const stream = ref(null);

// Status options for filtering
const statusOptions = [
  { label: "All", value: "all" },
  { label: "Uploaded", value: "uploaded" },
  { label: "Processing", value: "processing" },
  { label: "Processed", value: "processed" },
  { label: "Error", value: "error" },
];

// Computed
const filteredReceipts = computed(() => {
  if (selectedStatus.value === "all") {
    return receipts.value;
  }
  return receipts.value.filter(
    (receipt) => receipt.status === selectedStatus.value
  );
});

// Methods
const startCameraCapture = async () => {
  try {
    isCapturing.value = true;
    stream.value = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }, // Use back camera on mobile
    });

    showCamera.value = true; // Open modal

    await nextTick(); // Wait for DOM

    if (videoElement.value) {
      videoElement.value.srcObject = stream.value;
      await videoElement.value.play(); // Ensure video plays
    }
  } catch (error) {
    console.error("Error accessing camera:", error);
    // Fallback to file upload
    triggerFileUpload();
  } finally {
    isCapturing.value = false;
  }
};

const stopCamera = () => {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop());
    stream.value = null;
  }
  showCamera.value = false;
};

const capturePhoto = () => {
  if (!videoElement.value) return;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = videoElement.value.videoWidth;
  canvas.height = videoElement.value.videoHeight;

  context.drawImage(videoElement.value, 0, 0);

  canvas.toBlob(
    (blob) => {
      if (blob) {
        const file = new File([blob], "receipt.jpg", { type: "image/jpeg" });
        selectedFile.value = file;
        previewImageUrl.value = URL.createObjectURL(blob);
        showPreview.value = true;
        stopCamera();
      }
    },
    "image/jpeg",
    0.8
  );
};

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file && file.type.startsWith("image/")) {
    selectedFile.value = file;
    previewImageUrl.value = URL.createObjectURL(file);

    // Ensure URL is set before showing modal
    nextTick(() => {
      showPreview.value = true;
    });
  } else {
    console.error("Please select a valid image file");
  }
};

const cancelUpload = () => {
  selectedFile.value = null;
  previewImageUrl.value = "";
  showPreview.value = false;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const uploadReceipt = async () => {
  if (!selectedFile.value) return;

  try {
    isUploading.value = true;
    await uploadReceiptImage(selectedFile.value);

    // Reset state
    cancelUpload();

    // Show success message
    // You can add a toast notification here
  } catch (error) {
    console.error("Error uploading receipt:", error);
    // Show error message
  } finally {
    isUploading.value = false;
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

const getStatusColor = (status) => {
  const colors = {
    uploaded: "blue",
    processing: "yellow",
    processed: "green",
    error: "red",
  };
  return colors[status] || "gray";
};

// Cleanup on unmount
onUnmounted(() => {
  stopCamera();
  if (previewImageUrl.value) {
    URL.revokeObjectURL(previewImageUrl.value);
  }
});
</script>
