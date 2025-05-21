import React, { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import type { GalleryItem } from "./gallery-modal";
import galleryDnd from "./galleryDnd";

type ModalMode = "select" | "view";

interface GalleryDraggableItemProps {
  item: GalleryItem;
  mode: ModalMode;
  activeTab: string;
  selected: boolean;
  onClick: () => void;
  onImageError: () => void;
}

export const GalleryDraggableItem: React.FC<GalleryDraggableItemProps> = ({
  item,
  mode,
  activeTab,
  selected,
  onClick,
  onImageError,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const dragStarted = useRef(false);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    dragStarted.current = false;
    const moveListener = (moveEvent: PointerEvent) => {
      const dx = moveEvent.pageX - event.pageX;
      const dy = moveEvent.pageY - event.pageY;
      if (!dragStarted.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        dragStarted.current = true;
        galleryDnd.onPointerDown(event, item);
        window.removeEventListener("pointermove", moveListener);
      }
    };
    window.addEventListener("pointermove", moveListener);
    const upListener = () => {
      window.removeEventListener("pointermove", moveListener);
      window.removeEventListener("pointerup", upListener);
      if (!dragStarted.current) {
        onClick();
      }
    };
    window.addEventListener("pointerup", upListener);
  };

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      className={twMerge(
        "group relative overflow-hidden rounded-md border-[3px] transition-all focus:outline-none focus:ring-2 focus:ring-primary",
        activeTab === "videos" ? "aspect-video" : "aspect-square",
        mode === "select" && selected
          ? "border-primary"
          : "border-transparent hover:border-white"
      )}
      aria-pressed={selected}
      tabIndex={0}
      style={{ cursor: "grab" }}
    >
      <div className="relative h-full w-full">
        {!item.thumbnail ? (
          <div className="flex h-full w-full items-center justify-center bg-gray-800">
            <span className="text-white/60">Image not available</span>
          </div>
        ) : (
          <img
            ref={imgRef}
            src={item.thumbnail || item.fullImage || ""}
            alt={item.label}
            className={twMerge(
              "h-full w-full bg-black/30",
              activeTab === "videos" ? "object-contain" : "object-cover"
            )}
            onError={onImageError}
            draggable={false}
          />
        )}
        {mode === "select" && selected && (
          <div className="absolute inset-0 bg-white/30" />
        )}
      </div>
      {mode === "select" && selected && (
        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
          <FontAwesomeIcon icon={faCheck} className="text-sm" />
        </div>
      )}
    </button>
  );
};
