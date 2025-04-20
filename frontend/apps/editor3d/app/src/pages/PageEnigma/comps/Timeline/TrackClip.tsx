import { useState } from "react";
import { ClipGroup } from "~/enums";
import DndAsset from "~/pages/PageEnigma/DragAndDrop/DndAsset";
import { Clip } from "~/pages/PageEnigma/models";
import {
  canDrop,
  dragHandleWidth,
  dragItem,
  frameTrackButtonWidthPx,
  scale,
  selectedItem,
  unitPx,
} from "~/pages/PageEnigma/signals";
import { useMouseEventsClip } from "./utils/useMouseEventsClip";

interface Props {
  min: number;
  max: number;
  group: ClipGroup;
  clip: Clip;
  updateClip: (options: { id: string; offset: number; length: number }) => void;
}

export const TrackClip = ({ clip, min, max, group, updateClip }: Props) => {
  const [state, setState] = useState({
    length: clip.length,
    offset: clip.offset,
  });
  const { onPointerDown } = useMouseEventsClip(
    clip,
    max,
    min,
    updateClip,
    setState,
  );

  const selectedClipId = (selectedItem.value as Clip | null)?.clip_uuid ?? "";

  const { length, offset } = state;

  const classes = [
    "absolute",
    clip.clip_uuid === selectedClipId
      ? `bg-${group}-selected border-white focus-visible:outline-0`
      : `bg-${group}-clip`,
  ];

  return (
    <>
      { /* Left drag handle button */}
      <button
        className={[
          ...classes,
          "rounded-l-md border border-transparent",
          "block h-full cursor-ew-resize",
          clip.clip_uuid === selectedClipId
            ? "border border-b-2 border-l-2 border-r-0 border-t-2"
            : "",
        ].join(" ")}
        style={{
          width: dragHandleWidth,
          left: offset * unitPx * scale.value + frameTrackButtonWidthPx,
        }}
        onPointerDown={(event) => onPointerDown(event, "left")}
        onPointerMove={() => {
          if (dragItem.value) {
            canDrop.value = false;
            DndAsset.notDropText = "Cannot drop onto another clip";
          }
        }}
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          selectedItem.value = clip;
        }}
      >
        <div className="flex h-full items-center justify-start">
          <div className="ml-1.5 block h-[10px] w-[2px] bg-white opacity-60" />
        </div>
      </button>

      { /* Label/Move button */}
      <button
        className={[
          ...classes,
          "block h-full",
          clip.clip_uuid === selectedClipId
            ? "border border-b-2 border-l-0 border-r-0 border-t-2"
            : "",
        ].join(" ")}
        style={{
          width: length * unitPx * scale.value - 2 * dragHandleWidth,
          left: offset * unitPx * scale.value + dragHandleWidth + frameTrackButtonWidthPx,
          cursor: "move",
        }}
        onPointerDown={(event) => onPointerDown(event, "drag")}
        onPointerMove={() => {
          if (dragItem.value) {
            canDrop.value = false;
            DndAsset.notDropText = "Cannot drop onto another clip";
          }
        }}
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          selectedItem.value = clip;
        }}
      >
        <div
          className="ml-2  w-full overflow-hidden text-ellipsis whitespace-nowrap text-left text-xs text-white"
          style={{ width: length * 4 * scale.value - 46 }}
        >
          {clip.name}
        </div>
      </button>

      { /* Right drag handle button */}
      <button
        className={[
          ...classes,
          "rounded-r-md border border-transparent",
          "block h-full cursor-ew-resize",
          clip.clip_uuid === selectedClipId
            ? "border border-b-2 border-l-0 border-r-2 border-t-2"
            : "",
        ].join(" ")}
        style={{
          width: dragHandleWidth,
          left: offset * unitPx * scale.value + length * unitPx * scale.value - dragHandleWidth + frameTrackButtonWidthPx,
        }}
        onPointerDown={(event) => onPointerDown(event, "right")}
        onPointerMove={() => {
          if (dragItem.value) {
            canDrop.value = false;
            DndAsset.notDropText = "Cannot drop onto another clip";
          }
        }}
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          selectedItem.value = clip;
        }}
      >
        <div className="flex h-full items-center justify-end">
          <div className="mr-1.5 block h-[10px] w-[2px] bg-white opacity-60" />
        </div>
      </button>
    </>
  );
};
