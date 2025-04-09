import { dispatchers } from "~/signals/uiEvents/modelSelection";
import { models, loras, ModelData, LoraData } from "~/data/models";

//THIS IS A VERY DUMMY DOWNLOAD IMPLEMENTATION AND SHOULD BE REPLACED WITH A REAL ONE FROM THE BACKEND OR SOMETHING BECAUSE IM NOT SURE - BFlat

// // Interface for download progress events from Tauri backend
// interface DownloadProgressEvent {
//   id: string;
//   progress: number;
//   type: "model" | "lora";
// }

// // Interface for download completion events from Tauri backend
// interface DownloadCompleteEvent {
//   id: string;
//   type: "model" | "lora";
//   success: boolean;
//   error?: string;
// }

// Initialize listeners for download events (dummy implementation)
export const initializeDownloadListeners = async () => {
  console.log("Download listeners initialized (dummy implementation)");
  // No actual listeners in the dummy implementation
  return Promise.resolve();
};

// Start downloading a model or lora (dummy implementation)
export const downloadModel = async (id: string, type: "model" | "lora") => {
  try {
    // Start tracking the download in our state
    dispatchers.startDownload(id, type);

    // Simulate download progress
    simulateDownloadProgress(id, type);

    return true;
  } catch (error) {
    console.error(`Failed to start download for ${type} ${id}:`, error);
    dispatchers.finishDownload(id);
    return false;
  }
};

// Simulate download progress
const simulateDownloadProgress = (id: string, type: "model" | "lora") => {
  let progress = 0;

  // Create an interval to update progress
  const interval = setInterval(() => {
    progress += 5;

    // Update progress in state
    dispatchers.updateDownloadProgress(id, progress);

    // When download completes
    if (progress >= 100) {
      clearInterval(interval);

      // Finish the download
      setTimeout(() => {
        dispatchers.finishDownload(id);

        // Update the local data to mark the model/lora as downloaded
        updateDownloadedState(id, type, true);

        console.log(`Download completed for ${type} ${id}`);
      }, 500);
    }
  }, 200); // Update every 200ms
};

// Update the downloaded state in our local data
const updateDownloadedState = (
  id: string,
  type: "model" | "lora",
  isDownloaded: boolean,
) => {
  if (type === "model") {
    // Find and update the model
    const modelIndex = models.findIndex((model) => model.id === id);
    if (modelIndex >= 0) {
      const updatedModel: ModelData = {
        ...models[modelIndex],
        isDownloaded,
      };

      // Update the models array
      models[modelIndex] = updatedModel;
    }
  } else {
    // Find and update the lora
    const loraIndex = loras.findIndex((lora) => lora.id === id);
    if (loraIndex >= 0) {
      const updatedLora: LoraData = {
        ...loras[loraIndex],
        isDownloaded,
      };

      // Update the loras array
      loras[loraIndex] = updatedLora;
    }
  }
};

// Get all available models (dummy implementation)
export const fetchAvailableModels = async (): Promise<ModelData[]> => {
  // Just return the models from the data file
  return Promise.resolve([...models]);
};

// Get all available loras (dummy implementation)
export const fetchAvailableLoras = async (): Promise<LoraData[]> => {
  // Just return the loras from the data file
  return Promise.resolve([...loras]);
};
