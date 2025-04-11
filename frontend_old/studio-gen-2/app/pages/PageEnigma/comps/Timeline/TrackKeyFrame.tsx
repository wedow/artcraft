import { Keyframe } from "~/pages/PageEnigma/models";
import { filmLength, scale, selectedItem } from "~/pages/PageEnigma/signals";
import { useMouseEventsKeyframe } from "~/pages/PageEnigma/comps/Timeline/utils/useMouseEventsKeyframe";
import { useSignals } from "@preact/signals-react/runtime";

interface Props {
  keyframe: Keyframe;
  updateKeyframe: (options: { id: string; offset: number }) => void;
}

export const TrackKeyFrame = ({ keyframe, updateKeyframe }: Props) => {
  useSignals();

  const { onPointerDown, offset } = useMouseEventsKeyframe({
    keyframe,
    max: filmLength.value * 1000,
    min: 0,
    updateKeyframe,
  });

  const displayOffset = offset > -1 ? offset : keyframe.offset;

  const selectedKeyframeId =
    (selectedItem.value as Keyframe | null)?.keyframe_uuid ?? "";

  return (
    <button
      className={[
        "top-[9px] block h-[12px] w-[12px] rotate-45 cursor-ew-resize",
        "absolute",
        keyframe.keyframe_uuid === selectedKeyframeId
          ? "bg-keyframe-selected"
          : "bg-keyframe-unselected",
      ].join(" ")}
      style={{
        left: displayOffset * 4 * scale.value - 5,
      }}
      onPointerDown={(event) => onPointerDown(event, "drag")}
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        selectedItem.value = keyframe;
      }}
    />
  );
};
