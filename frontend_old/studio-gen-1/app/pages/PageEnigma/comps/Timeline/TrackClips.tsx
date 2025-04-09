import { TrackClip } from "~/pages/PageEnigma/comps/Timeline/TrackClip";
import { Clip } from "~/pages/PageEnigma/models";
import { PointerEvent } from "react";
import {
  canDrop,
  dragItem,
  filmLength,
  scale,
} from "~/pages/PageEnigma/signals";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/pro-solid-svg-icons";
import DndAsset from "~/pages/PageEnigma/DragAndDrop/DndAsset";
import { ClipGroup, ClipType } from "~/enums";
import { currentPage } from "~/signals";
import { Pages } from "~/pages/PageEnigma/constants/page";
import { getCanDrop } from "~/pages/PageEnigma/comps/Timeline/utils/getCanDrop";

interface Props {
  id: string;
  clips: Clip[];
  group: ClipGroup;
  type?: ClipType;
  updateClip: (options: { id: string; length: number; offset: number }) => void;
}

export const TrackClips = ({ id, clips, updateClip, group, type }: Props) => {
  const trackType = (type ?? group) as ClipType;
  const canDropAsset = getCanDrop({
    dragType: dragItem.value?.type,
    type,
    group,
  });

  function onPointerOver() {
    if (getCanDrop({ dragType: dragItem.value?.type, type, group })) {
      DndAsset.dropId = id;
    }
  }

  function onPointerMove(
    event: PointerEvent<HTMLDivElement | HTMLButtonElement>,
  ) {
    if (!getCanDrop({ dragType: dragItem.value?.type, type, group })) {
      return;
    }

    const element = document.getElementById(`track-${trackType}-${id}`);
    DndAsset.overElement = element!.getBoundingClientRect();

    const track = document.getElementById(`track-${trackType}-${id}`);

    if (!track) {
      canDrop.value = false;
      return;
    }

    // Now check if the clip fits
    const position = track.getBoundingClientRect();
    const clipOffset = Math.round(
      (event.clientX - position.x) / 4 / scale.value,
    );

    if (clipOffset + 30 > filmLength.value * 60) {
      DndAsset.notDropText = "Not enough room to hold item";
      canDrop.value = false;
      return;
    }

    const overlap = clips.some((clip) => {
      if (clipOffset === clip.offset) {
        return true;
      }
      if (clipOffset > clip.offset && clipOffset <= clip.offset + clip.length) {
        return true;
      }
      return (
        clipOffset < clip.offset &&
        clipOffset + (dragItem.value!.length ?? 0) >= clip.offset
      );
    });

    canDrop.value = !overlap;
    if (!overlap) {
      DndAsset.dropOffset = clipOffset;
    }
    if (overlap) {
      DndAsset.notDropText = "Not enough space to drop here";
    }
  }

  return (
    <div
      id={`track-${trackType}-${id}`}
      className={[
        "relative mb-1 block h-[30px] w-full rounded-md",
        `bg-${group}-unselected`,
        clips.length === 0 ? "border border-dashed border-white/30" : "",
      ].join(" ")}
    >
      <div
        className={[
          "absolute inset-0 rounded-md",
          canDropAsset
            ? "animate-pulse bg-white/30 duration-[750ms]"
            : "opacity-0",
        ].join(" ")}
        onPointerOver={onPointerOver}
        onPointerMove={onPointerMove}
      />
      {clips.map((clip, index) => (
        <TrackClip
          key={clip.clip_uuid}
          min={
            index > 0 ? clips[index - 1].offset + clips[index - 1].length : 0
          }
          max={
            index < clips.length - 1
              ? clips[index + 1].offset
              : filmLength.value * 60
          }
          group={group}
          updateClip={updateClip}
          clip={clip}
        />
      ))}
      {clips.length === 0 && currentPage.value === Pages.EDIT && (
        <div className="prevent-select absolute flex h-full items-center gap-2 ps-2 text-xs font-medium text-white">
          <div className="animate-bounce">
            <FontAwesomeIcon icon={faArrowUp} className="text-white/80" />
          </div>
          <div className="text-xs text-white/80">
            {type === ClipType.TRANSFORM
              ? "Drag and Drop TRANSFORM clip here" // This should not show
              : type === ClipType.AUDIO
                ? "Drag and drop character speech or vocal audio clips here"
                : type === ClipType.ANIMATION
                  ? "Drag and drop character animation clips here"
                  : type === ClipType.EXPRESSION
                    ? "Drag and drop facial expression animation clips here"
                    : type === ClipType.FAKE
                      ? "Drag and Drop FAKE clip here" // this should not show.
                      : "Drag and drop uploaded music clips or sound effects from the audio tab here"}
          </div>
        </div>
      )}
    </div>
  );
};
