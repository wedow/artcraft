import { create } from "zustand";
import { STYLE_OPTIONS } from "common/StyleOptions";

const initialStyle = STYLE_OPTIONS[0];

interface StyleStore {
  currentImages: string[];
  selectedStyleValues: string[];
  selectedStyleLabels: string[];
  setCurrentImages: (images: string[]) => void;
  setSelectedStyles: (
    values: string[],
    labels?: string[],
    images?: string[]
  ) => void;
  resetImages: () => void;
}

const useStyleStore = create<StyleStore>(set => ({
  currentImages: [
    initialStyle.image || "/images/placeholders/style_placeholder.png",
  ],
  selectedStyleValues: [initialStyle.value],
  selectedStyleLabels: [initialStyle.label],
  setCurrentImages: (images: string[]) => {
    console.log("Setting current images:", images); // Debugging
    set({ currentImages: images });
  },
  setSelectedStyles: (
    values: string[],
    labels: string[] = [],
    images: string[] = []
  ) => {
    console.log("Setting selected styles:", values, labels, images); // Debugging
    set({
      selectedStyleValues: values,
      selectedStyleLabels: labels.length ? labels : values.map(() => ""),
      currentImages: images.length
        ? images
        : values.map(() => "/images/placeholders/style_placeholder.png"),
    });
  },
  resetImages: () =>
    set({ currentImages: ["/images/placeholders/style_placeholder.png"] }),
}));

export default useStyleStore;
