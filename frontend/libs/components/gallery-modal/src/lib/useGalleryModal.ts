import { useCallback } from "react";
import { useGalleryModalStore, GalleryModalMode } from "./galleryModalStore";

export const useGalleryModal = () => {
  const { isOpen, mode, forceFilter, open, close, setVisibleDuringDrag } =
    useGalleryModalStore();

  const openView = useCallback(
    (filter?: string, lock = false) => {
      setVisibleDuringDrag(true);
      if (lock && filter) {
        open({ mode: "view", forceFilter: filter });
      } else if (filter) {
        open({ mode: "view", initialFilter: filter });
      } else {
        open({ mode: "view" });
      }
    },
    [open, setVisibleDuringDrag]
  );

  const openSelect = useCallback(
    (forceFilter?: string) => {
      setVisibleDuringDrag(true);
      open({ mode: "select", forceFilter });
    },
    [open, setVisibleDuringDrag]
  );

  const safeClose = useCallback(() => {
    setVisibleDuringDrag(false);
    close();
  }, [close, setVisibleDuringDrag]);

  return {
    isOpen,
    mode,
    forceFilter,
    open,
    close: safeClose,
    openView,
    openSelect,
  } as const;
};
