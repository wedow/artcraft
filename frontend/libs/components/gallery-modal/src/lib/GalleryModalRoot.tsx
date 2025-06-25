import { downloadFileFromUrl } from "@storyteller/api";
import React from "react";
import { GalleryModal } from "./gallery-modal";
import { useGalleryModalStore } from "./galleryModalStore";
import { LightboxModal } from "@storyteller/ui-lightbox-modal";

/**
 * GalleryModalRoot subscribes to the zustand store and renders the GalleryModal
 * component with the current state. Mount this once at a high level (e.g. PageEnigma)
 * so that other components can open/close the gallery via the useGalleryModal hook.
 */
export const GalleryModalRoot: React.FC = () => {
  const { isOpen, mode, forceFilter, close, lightbox, closeLightbox, open } =
    useGalleryModalStore();

  return (
    <>
      <GalleryModal
        mode={mode}
        isOpen={isOpen}
        forceFilter={forceFilter}
        onClose={close}
        onDownloadClicked={downloadFileFromUrl}
      />

      {lightbox.isOpen && lightbox.item && (
        <LightboxModal
          isOpen={true}
          onClose={closeLightbox}
          onCloseGallery={close}
          imageUrl={lightbox.item.fullImage}
          imageAlt={lightbox.item.label}
          title={lightbox.item.label}
          createdAt={lightbox.item.createdAt}
          downloadUrl={lightbox.item.fullImage || undefined}
          mediaId={lightbox.item.id}
          mediaClass={lightbox.item.mediaClass}
          onDownloadClicked={downloadFileFromUrl}
        />
      )}
    </>
  );
};
