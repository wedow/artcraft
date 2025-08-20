import { getModelsByCategory, ModelConfig } from "./Models.js";
import { ALL_MODELS_BY_ID } from "./Models.js";

/**
 * We might not want to always programatically build the list of models, because
 * we likely want to control the order of models in the UI to prioritize 
 * more popular models. We may also want to selectively prune non-useful models.
 */

export const CANVAS_2D_PAGE_MODELS : ModelConfig[] = getModelsByCategory("image");

export const TEXT_TO_IMAGE_PAGE_MODELS : ModelConfig[] = getModelsByCategory("image")
  // Remove inpainting and editing models.
  .filter((m) => m.id !== "flux_pro_inpaint")
  .filter((m) => m.id !== "flux_pro_kontext_max");

export const IMAGE_EDITOR_PAGE_MODELS : ModelConfig[] = [
  // Explicit list for now.
  ALL_MODELS_BY_ID.get("flux_pro_inpaint")!,
  ALL_MODELS_BY_ID.get("flux_pro_kontext_max")!,
];

