import { create } from "zustand";
import { ModelPage } from "./model-pages";

interface ModelSelectorState {
  selectedModels: { [page in ModelPage]?: string };
  setSelectedModel: (page: ModelPage, modelLabel: string) => void;
}

export const useModelSelectorStore = create<ModelSelectorState>((set) => ({
  selectedModels: {},
  setSelectedModel: (page, modelLabel) =>
    set((state) => ({
      selectedModels: {
        ...state.selectedModels,
        [page]: modelLabel,
      },
    })),
}));
