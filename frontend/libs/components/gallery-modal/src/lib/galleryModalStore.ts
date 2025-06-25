import { create } from "zustand";
import { GalleryItem } from "./gallery-modal";

export type GalleryModalMode = "view" | "select";

interface GalleryModalState {
  isOpen: boolean;
  mode: GalleryModalMode;
  /**
   * When set, the gallery will lock the filter to this value.
   * Possible values: "all", "image", "video", "3d", "uploaded"
   */
  forceFilter?: string;
  initialFilter?: string;
  /** internal flag used to temporarily hide modal during drag */
  visibleDuringDrag: boolean;
  /** user preference: whether modal should re-appear after a drag */
  reopenAfterDrag: boolean;
  /** Open the gallery modal. */
  open: (options?: {
    mode?: GalleryModalMode;
    forceFilter?: string;
    initialFilter?: string;
  }) => void;
  /** Close the gallery modal. */
  close: () => void;
  /** Set temporary visibility during drag */
  setVisibleDuringDrag: (visible: boolean) => void;
  /** Toggle reopen preference */
  setReopenAfterDrag: (value: boolean) => void;
  /** Lightbox state */
  lightbox: { isOpen: boolean; item: GalleryItem | null };
  openLightbox: (item: GalleryItem) => void;
  closeLightbox: () => void;
}

export const useGalleryModalStore = create<GalleryModalState>((set) => ({
  isOpen: false,
  mode: "view",
  forceFilter: undefined,
  initialFilter: undefined,
  visibleDuringDrag: true,
  reopenAfterDrag: false,
  lightbox: { isOpen: false, item: null },
  open: (options) => {
    const { mode = "view", forceFilter, initialFilter } = options || {};
    set({
      isOpen: true,
      mode,
      forceFilter,
      initialFilter,
      visibleDuringDrag: true,
    });
  },
  close: () =>
    set({ isOpen: false, visibleDuringDrag: false, initialFilter: undefined }),
  setVisibleDuringDrag: (visible) => set({ visibleDuringDrag: visible }),
  setReopenAfterDrag: (value) => set({ reopenAfterDrag: value }),
  openLightbox: (item) => set({ lightbox: { isOpen: true, item } }),
  closeLightbox: () =>
    set((state) => ({ lightbox: { isOpen: false, item: null } })),
}));
