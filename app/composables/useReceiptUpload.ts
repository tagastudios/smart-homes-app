import { ref } from "vue";

// Shared state for receipt upload across components
const uploadingFile = ref<File | null>(null);
const uploadProgress = ref(0);
const uploadError = ref<string | null>(null);
const isUploading = ref(false);

export const useReceiptUpload = () => {
  const setFile = (file: File) => {
    uploadingFile.value = file;
    uploadError.value = null;
    uploadProgress.value = 0;
  };

  const clearFile = () => {
    uploadingFile.value = null;
    uploadError.value = null;
    uploadProgress.value = 0;
    isUploading.value = false;
  };

  const setProgress = (progress: number) => {
    uploadProgress.value = progress >= 100 ? 100 : progress;
  };

  const setError = (error: string) => {
    uploadError.value = error;
    isUploading.value = false;
  };

  const setUploading = (uploading: boolean) => {
    isUploading.value = uploading;
  };

  return {
    uploadingFile,
    uploadProgress,
    uploadError,
    isUploading,
    setFile,
    clearFile,
    setProgress,
    setError,
    setUploading,
  };
};
