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
  },
  flux_pro_kontext_max: {
    name: "Flux Pro Kontext Max",
    tauri_id: "flux_pro_kontext_max",
    creator: ModelCreator.BlackForestLabs,
  },
};
