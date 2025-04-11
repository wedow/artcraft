import { create } from "zustand";

interface SearcherState {
  searchTerm: { [searcherKey: string]: string };
}

interface SearcherActions {
  setSearchTerm: (searcherKey: string, value: string) => void;
}

type SearcherStore = SearcherState & SearcherActions;

const useSearcherStore = create<SearcherStore>(set => ({
  searchTerm: {},
  setSearchTerm: (searcherKey, value) =>
    set((state: SearcherState) => ({
      searchTerm: { ...state.searchTerm, [searcherKey]: value },
    })),
}));

export default useSearcherStore;
