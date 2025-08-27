import { create } from "zustand";
import { VideoModel } from "@storyteller/model-list";
import { VIDEO_MODELS } from "@storyteller/model-list";

/**
 * TODO: This is temporary. We'll create a new "ModelSelectorState" that is typesafe and isn't just scoped to videos.
 */
interface VideoModelSelectorState {
  selectedModel: VideoModel;
  setSelectedModel: (model: VideoModel) => void;
}

export const useVideoModelSelectorStore = create<VideoModelSelectorState>((set) => ({
  selectedModel: VIDEO_MODELS[0],
  setSelectedModel: (model) =>
    set((state) => ({
      selectedModel: model
    })),
}));
