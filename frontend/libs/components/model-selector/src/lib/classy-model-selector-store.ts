import { create } from "zustand";
import { ModelPage } from "./model-pages";
import { ImageModel, Model, VideoModel } from "@storyteller/model-list";

interface ClassyModelSelectorState {
  selectedModels: { [page in ModelPage]?: Model };
  setSelectedModel: (page: ModelPage, model: Model) => void;
}

export const useClassyModelSelectorStore = create<ClassyModelSelectorState>((set) => ({
  selectedModels: {},
  setSelectedModel: (page, model) =>
    set((state) => ({
      selectedModels: {
        ...state.selectedModels,
        [page]: model,
      },
    })),
}));

export const getSelectedImageModel = (page: ModelPage) : ImageModel | undefined => {
  const { selectedModels } = useClassyModelSelectorStore();
  const maybeModel = selectedModels[page];
  if (!maybeModel || !(maybeModel instanceof ImageModel)) {
    return undefined;
  }
  return maybeModel;
};

export const getSelectedVideoModel = (page: ModelPage) : VideoModel | undefined => {
  const { selectedModels } = useClassyModelSelectorStore();
  const maybeModel = selectedModels[page];
  if (!maybeModel || !(maybeModel instanceof VideoModel)) {
    return undefined;
  }
  return maybeModel;
};
