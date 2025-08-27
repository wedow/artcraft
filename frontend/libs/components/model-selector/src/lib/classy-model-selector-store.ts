import { create } from "zustand";
import { ModelPage } from "./model-pages";
import { Model } from "@storyteller/model-list";

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
