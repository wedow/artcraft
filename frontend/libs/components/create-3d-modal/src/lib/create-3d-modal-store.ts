import { create } from 'zustand';

interface CompletedModel {
  mediaToken: string;
}

interface Create3dModalState {
  isOpen: boolean;
  completedModels: CompletedModel[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  addCompletedModel: (model: CompletedModel) => void;
  getAndClearCompletedModels: () => CompletedModel[];
}

export const useCreate3dModalStore = create<Create3dModalState>((set, get) => ({
  isOpen: false,
  completedModels: [],
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  addCompletedModel: (model) => set((state) => ({
    completedModels: [...state.completedModels, model]
  })),
  getAndClearCompletedModels: () => {
    const models = get().completedModels;
    set({ completedModels: [] });
    return models;
  }
}));
