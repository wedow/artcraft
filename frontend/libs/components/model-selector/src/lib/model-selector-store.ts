import { create } from "zustand";

interface ModelSelectorState {
  selectedModels: { [category: string]: string | undefined };
  setSelectedModel: (category: string, modelLabel: string) => void;
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
