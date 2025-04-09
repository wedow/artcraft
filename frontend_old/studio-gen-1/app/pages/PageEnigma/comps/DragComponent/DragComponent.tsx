import {
  canDrop,
  currPosition,
  dragItem,
  overTimeline,
  scale,
  timelineHeight,
} from "~/pages/PageEnigma/signals";
import { useSignals } from "@preact/signals-react/runtime";
import DndAsset from "~/pages/PageEnigma/DragAndDrop/DndAsset";

export const DragComponent = () => {
  useSignals();
  if (!dragItem.value) {
    return null;
  }
  const { currX, currY } = currPosition.value;

  const thumbnail = dragItem.value.thumbnail
    ? dragItem.value.thumbnail
    : `/resources/images/default-covers/${dragItem.value.imageIndex || 0}.webp`;

  if (overTimeline.value) {
    if (canDrop.value && DndAsset.overElement) {
      return (
        <>
          <div
            id={`ani-dnd-${dragItem.value.media_id}`}
            className={[
              "absolute p-2",
              "rounded-md",
              !canDrop.value
                ? "bg-brand-primary"
                : "border border-dashed border-dnd-canDropBorder bg-dnd-canDrop",
              "block",
            ].join(" ")}
            style={{
              top: DndAsset.overElement.top,
              left: currX + 1,
              zIndex: 10000,
              width: (dragItem.value.length ?? 0) * 4 * scale.value,
              height: 30,
            }}
          />
          <div
            id={`ani-dnd-${dragItem.value.media_id}`}
            className={[
              "absolute p-2",
              "rounded opacity-60",
              "border border-dnd-timeGridBorder bg-dnd-timeGrid",
            ].join(" ")}
            style={{
              bottom: timelineHeight.value - 60,
              left: currX + 1,
              zIndex: 10000,
              width: (dragItem.value.length ?? 0) * 4 * scale.value,
              height: 16,
            }}
          />
        </>
      );
    }
    return (
      <div
        id={`ani-dnd-${dragItem.value.media_id}`}
        className={[
          "absolute p-1",
          "rounded-lg text-xs",
          "bg-dnd-cannotDrop",
          "block text-nowrap",
        ].join(" ")}
        style={{
          top: currY - 16,
          left: currX + 1,
          zIndex: 10000,
        }}
      >
        {DndAsset.notDropText || "Cannot drop here"}
      </div>
    );
  }

  return (
    <div
      className="absolute rounded-lg"
      style={{
        width: 91,
        height: 114,
        top: currY - 57,
        left: currX + 1,
        zIndex: 10000,
      }}
    >
      <img
        {...{
          crossOrigin: "anonymous",
          src: thumbnail,
        }}
        alt={dragItem.value.name}
        className="pointer-events-none select-none rounded-t-lg bg-gradient-to-b from-[#CCCCCC] to-[#A0A0A0]"
      />
      <div className="w-full truncate rounded-b-lg bg-ui-controls px-2 py-1 text-center text-[12px]">
        {dragItem.value.name || dragItem.value.media_id}
      </div>
    </div>
  );
};
