import { effect, signal } from "@preact/signals-react";
// import { models } from "~/data/models";

// // Define the signals for selected models and download states
// export const selectedModel = signal<string | null>(
//   models.length > 0 ? models[0].id : null,
// );
// export const selectedLora = signal<string | null>(null);

// Replace single download tracking with a map to track multiple downloads
export interface DownloadInfo {
  progress: number;
  type: "model" | "lora";
}

// Map of modelId/loraId to download progress
export const downloadingItems = signal<Record<string, DownloadInfo>>({});

// Dispatchers
// const setSelectedModel = (modelId: string | null) => {
//   selectedModel.value = modelId;
// };

// const setSelectedLora = (loraId: string | null) => {
//   selectedLora.value = loraId;
// };

// Start downloading a model or lora
const startDownload = (id: string, type: "model" | "lora") => {
  const newDownloads = { ...downloadingItems.value };
  newDownloads[id] = { progress: 0, type };
  downloadingItems.value = newDownloads;
};

// Update the progress of a downloading item
const updateDownloadProgress = (id: string, progress: number) => {
  if (!downloadingItems.value[id]) return;

  const newDownloads = { ...downloadingItems.value };
  newDownloads[id] = {
    ...newDownloads[id],
    progress: Math.max(0, Math.min(100, Math.round(progress))),
  };
  downloadingItems.value = newDownloads;
};

// Complete or cancel a download
const finishDownload = (id: string) => {
  const newDownloads = { ...downloadingItems.value };
  delete newDownloads[id];
  downloadingItems.value = newDownloads;
};

// Check if an item is currently downloading
const isDownloading = (id: string): boolean => {
  return !!downloadingItems.value[id];
};

// Get the progress of a downloading item
const getDownloadProgress = (id: string): number => {
  return downloadingItems.value[id]?.progress || 0;
};

// Event listeners
// const onSelectedModelChanged = (callback: (modelId: string | null) => void) => {
//   effect(() => {
//     callback(selectedModel.value);
//   });
// };

// const onSelectedLoraChanged = (callback: (loraId: string | null) => void) => {
//   effect(() => {
//     callback(selectedLora.value);
//   });
// };

const onDownloadsChanged = (
  callback: (downloads: Record<string, DownloadInfo>) => void,
) => {
  effect(() => {
    callback(downloadingItems.value);
  });
};

// EXPORTS
export const dispatchers = {
  // setSelectedModel,
  // setSelectedLora,
  startDownload,
  updateDownloadProgress,
  finishDownload,
  isDownloading,
  getDownloadProgress,
};

export const events = {
  // onSelectedModelChanged,
  // onSelectedLoraChanged,
  onDownloadsChanged,
};
