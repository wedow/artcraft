import { create } from "zustand";

interface GlobalSearchState {
  searchTerm: string;
}

interface SearcherActions {
  setSearchTerm: (value: string) => void;
}

type GlobalSearchStore = GlobalSearchState & SearcherActions;

const useGlobalSearchStore = create<GlobalSearchStore>(set => ({
  searchTerm: "",
  setSearchTerm: value =>
    set(() => ({
      searchTerm: value,
    })),
}));

export default useGlobalSearchStore;
