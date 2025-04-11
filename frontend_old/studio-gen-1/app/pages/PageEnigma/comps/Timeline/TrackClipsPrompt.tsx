import { TrackClipPrompt } from "~/pages/PageEnigma/comps/Timeline/TrackClipPrompt";
import { Clip } from "~/pages/PageEnigma/models";
import { PointerEvent, useRef, useState } from "react";
import { filmLength, scale } from "~/pages/PageEnigma/signals";
import { ClipGroup } from "~/enums";
import { twMerge } from "tailwind-merge";
import { useSignals } from "@preact/signals-react/runtime";
import { AddEditPrompt } from "~/pages/PageEnigma/comps/Timeline/AddEditPrompt";

interface Props {
  id: string;
  clips: Clip[];
  updateClip: (options: {
    id: string;
    length: number;
    offset: number;
    name: string;
  }) => void;
}

export const TrackClipsPrompt = ({ id, clips, updateClip }: Props) => {
  useSignals();
  const [hover, setHover] = useState(-1);
  const [openPrompt, setOpenPrompt] = useState(false);
  const [hasOverlap, setHasOverlap] = useState(false);
  const clientX = useRef(0);

  function onPointerOver(event: PointerEvent) {
    const max = filmLength.value * 60 * 4 * scale.value;
    if (event.pageX < 320) {
      setHover(320);
    } else {
      setHover(Math.min(event.pageX, max + 80));
      clientX.current = event.pageX - 320;
    }
  }

  function onPointerMove(
    event: PointerEvent<HTMLDivElement | HTMLButtonElement>,
  ) {
    if (hover === -1) {
      return;
    }
    const max = filmLength.value * 60 * 4 * scale.value;
    const offset =
      (event.pageX < 320 ? 0 : Math.min(event.pageX - 320, max + 80)) /
      4 /
      scale.value;
    if (event.pageX < 320) {
      setHover(320);
      clientX.current = 0;
    } else {
      const offset = Math.min(event.pageX, max + 80);
      setHover(offset);
      clientX.current = offset - 320;
    }
    const overlap = clips.some((clip) => {
      if (offset + 60 < clip.offset) {
        return false;
      }
      return clip.offset + clip.length >= offset;
    });
    setHasOverlap(overlap);
  }

  return (
    <div
      id={`track-prompt-travel-${id}`}
      className={twMerge(
        "relative mb-1 block h-[30px] w-full rounded-md",
        `bg-prompt-unselected`,
      )}
    >
      <div
        className={twMerge("absolute inset-0 rounded-md", "opacity-0")}
        onPointerOver={onPointerOver}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHover(-1)}
      />
      {clips.map((clip, index) => (
        <TrackClipPrompt
          key={clip.clip_uuid}
          min={
            index > 0 ? clips[index - 1].offset + clips[index - 1].length : 0
          }
          max={
            index < clips.length - 1
              ? clips[index + 1].offset
              : filmLength.value * 60
          }
          group={ClipGroup.PROMPT_TRAVEL}
          updateClip={updateClip}
          clip={clip}
        />
      ))}
      {hover > -1 && (
        <button
          className={twMerge(
            "text- absolute h-full rounded-md",
            "border border-dashed border-white/60",
            "text-sm text-white/60",
            hasOverlap ? "bg-action" : "bg-prompt-selected/30",
          )}
          style={{ width: 60 * scale.value * 4, left: hover - 320 }}
          onPointerOver={onPointerOver}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHover(-1)}
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            !hasOverlap && setOpenPrompt(true);
          }}
        >
          {hasOverlap ? "Overlap" : "Click to add prompt"}
        </button>
      )}
      {openPrompt && (
        <AddEditPrompt
          setOpenPrompt={setOpenPrompt}
          openPrompt={openPrompt}
          offset={clientX.current / 4 / scale.value}
        />
      )}
    </div>
  );
};
