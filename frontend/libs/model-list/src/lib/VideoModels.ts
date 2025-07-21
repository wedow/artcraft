import { ModelCreator } from "./ModelCreator.js";
import { ModelInfo } from "./ModelInfo.js";

export const VIDEO_MODELS: Record<string, ModelInfo> = {
  kling_1_6_pro: {
    name: "Kling 1.6 Pro",
    tauri_id: "kling_1.6_pro",
    creator: ModelCreator.Kling,
  },
  kling_2_1_pro: {
    name: "Kling 2.1 Pro",
    tauri_id: "kling_2.1_pro",
    creator: ModelCreator.Kling,
  },
  kling_2_1_master: {
    name: "Kling 2.1 Master",
    tauri_id: "kling_2.1_master",
    creator: ModelCreator.Kling,
  },
  seedance_1_0_lite: {
    name: "Seedance 1.0 Lite",
    tauri_id: "seedance_1.0_lite",
    creator: ModelCreator.Bytedance,
  },
  veo_2: {
    name: "Google Veo 2",
    tauri_id: "veo_2",
    creator: ModelCreator.Google,
  },
};

// This is a hack to get the old model selector code to work since it's keyed off
// of the human-readable label of the model. Long term, that should be fixed.
export const VIDEO_MODELS_BY_LABEL: Record<string, ModelInfo> = {
  "Kling 1.6 Pro": VIDEO_MODELS.kling_1_6_pro,
  "Kling 2.1 Pro": VIDEO_MODELS.kling_2_1_pro,
  "Kling 2.1 Master": VIDEO_MODELS.kling_2_1_master,
  "Seedance 1.0 Lite": VIDEO_MODELS.seedance_1_0_lite,
  "Google Veo 2": VIDEO_MODELS.veo_2,
};
