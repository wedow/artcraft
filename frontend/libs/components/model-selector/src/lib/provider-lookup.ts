import { ModelPage } from "./model-pages";
import { Provider } from "@storyteller/tauri-api";

export type ProvidersByModel = Partial<Record<string, Provider[]>>;

// Centralized lookup: page (product/tab) → modelId → allowed providers
export const PROVIDER_LOOKUP_BY_PAGE: Record<ModelPage, ProvidersByModel> = {
  [ModelPage.TextToImage]: {
    gpt_image_1: [Provider.ArtCraft, Provider.Sora],
  },
  [ModelPage.ImageToVideo]: {},
  [ModelPage.Canvas2D]: {
    gpt_image_1: [Provider.ArtCraft, Provider.Sora],
  },
  [ModelPage.Stage3D]: { gpt_image_1: [Provider.ArtCraft, Provider.Sora] },
  [ModelPage.ImageEditor]: {
    gpt_image_1: [Provider.ArtCraft, Provider.Sora],
  },
};
