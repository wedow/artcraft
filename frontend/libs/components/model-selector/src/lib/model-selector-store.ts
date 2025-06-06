import { create } from "zustand";
import { ModelCategory } from "./model-categories";

interface ModelSelectorState {
  selectedModels: { [category in ModelCategory]?: string };
  setSelectedModel: (category: ModelCategory, modelLabel: string) => void;
}

export const useModelSelectorStore = create<ModelSelectorState>((set) => ({
  selectedModels: {},
  setSelectedModel: (category, modelLabel) =>
    set((state) => ({
      selectedModels: {
        ...state.selectedModels,
        [category]: modelLabel,
      },
    })),
}));
