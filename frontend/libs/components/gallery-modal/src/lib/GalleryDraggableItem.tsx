import React, { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import type { GalleryItem } from "./gallery-modal";
import galleryDnd from "./galleryDnd";
import { Tooltip } from "@storyteller/ui-tooltip";

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
    <Tooltip
      position="bottom"
      delay={200}
      className="-mt-3 bg-black/90"
      content={
        <div className="flex flex-col items-center text-xs whitespace-nowrap">
          {activeTab !== "videos" && (
            <span>
              <span className="font-medium">Drag</span>
              <span className="opacity-60"> to add</span>
            </span>
          )}
          <span>
            <span className="font-medium">Click</span>
            <span className="opacity-60"> to view</span>
          </span>
        </div>
      }
    >
      <button
        type="button"
        onPointerDown={handlePointerDown}
        className={twMerge(
          "w-full group relative overflow-visible rounded-md border-[3px] transition-all focus:outline-none focus:ring-2 focus:ring-primary",
          activeTab === "videos" ? "aspect-video" : "aspect-square",
          mode === "select" && selected
            ? "border-primary"
            : "border-transparent hover:border-primary"
        )}
        aria-pressed={selected}
        tabIndex={0}
        style={{ cursor: "grab" }}
      >
        <div className="relative h-full w-full">
          {/* Media class badge on hover */}
          {item.mediaClass && (
            <div className="pointer-events-none absolute right-1 top-1 z-20 rounded-full bg-black/50 backdrop-blur-lg px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              {item.mediaClass}
            </div>
          )}
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
    </Tooltip>
  );
};
