import { ModelCreator } from "./ModelCreator.js";
import { ModelInfo } from "./ModelInfo.js";

export const IMAGE_MODELS: Record<string, ModelInfo> = {
  flux_pro_1_1_ultra: {
    name: "Flux Pro 1.1 Ultra",
    tauri_id: "flux_pro_11_ultra",
    creator: ModelCreator.BlackForestLabs,
  },
  flux_pro_1_1: {
    name: "Flux Pro 1.1",
    tauri_id: "flux_pro_11",
    creator: ModelCreator.BlackForestLabs,
  },
  flux_1_dev: {
    name: "Flux 1 Dev",
    tauri_id: "flux_1_dev",
    creator: ModelCreator.BlackForestLabs,
  },
  flux_1_schnell: {
    name: "Flux 1 Schnell",
    tauri_id: "flux_1_schnell",
    creator: ModelCreator.BlackForestLabs,
  },
  gpt_image_1: {
    name: "GPT Image 1 (GPT-4o)",
    tauri_id: "gpt_image_1",
    creator: ModelCreator.OpenAi,
  }
}

// This is a hack to get the old model selector code to work since it's keyed off 
// of the human-readable label of the model. Long term, that should be fixed.
export const IMAGE_MODELS_BY_LABEL: Record<string, ModelInfo> = {
  "Flux Pro 1.1 Ultra": IMAGE_MODELS.flux_pro_1_1_ultra,
  "Flux Pro 1.1": IMAGE_MODELS.flux_pro_1_1,
  "Flux 1 Dev": IMAGE_MODELS.flux_1_dev,
  "Flux 1 Schnell": IMAGE_MODELS.flux_1_schnell,
  "GPT Image 1 (GPT-4o)": IMAGE_MODELS.gpt_image_1,
}

