import { create } from "zustand";
import { Weight } from "@storyteller/components/src/api/weights/GetWeight";

interface TtsStoreState {
  selectedVoice: Weight | undefined;
  setSelectedVoice: (voice: Weight | undefined) => void;
  text: string;
  setText: (text: string) => void;
}

const useTtsStore = create<TtsStoreState>(set => ({
  selectedVoice: undefined,
  setSelectedVoice: voice => set({ selectedVoice: voice }),
  text: "",
  setText: text => set({ text }),
}));

export default useTtsStore;
