import { useMouseEventsClip } from "./utils/useMouseEventsClip";
import { useState } from "react";
import {
  canDrop,
  dragItem,
  scale,
  selectedItem,
} from "~/pages/PageEnigma/signals";
import { ClipGroup } from "~/enums";
import { Clip } from "~/pages/PageEnigma/models";
import DndAsset from "~/pages/PageEnigma/DragAndDrop/DndAsset";
import { faPencil, faTrashCan } from "@fortawesome/pro-solid-svg-icons";
import { useOnDelete } from "~/pages/PageEnigma/comps/Timeline/utils/useOnDelete";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AddEditPrompt } from "~/pages/PageEnigma/comps/Timeline/AddEditPrompt";

interface Props {
  min: number;
  max: number;
  group: ClipGroup;
  clip: Clip;
  updateClip: (options: {
    id: string;
    offset: number;
    length: number;
    name: string;
  }) => void;
}

export const TrackClipPrompt = ({
  clip,
  min,
  max,
  group,
  updateClip,
}: Props) => {
  const [state, setState] = useState({
    length: clip.length,
    offset: clip.offset,
  });
  const [hover, setHover] = useState<boolean>(false);
  const [openPrompt, setOpenPrompt] = useState(false);
  const { onPointerDown } = useMouseEventsClip(
    clip,
    max,
    min,
    (options) => updateClip({ ...options, name: clip.name }),
    setState,
  );

  const { confirmationModal, onDeleteAsk } = useOnDelete();

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
      <button
        className={[
          ...classes,
          "z-40 w-[15px] rounded-l-md border border-transparent",
          "block h-full cursor-ew-resize",
          clip.clip_uuid === selectedClipId
            ? "border border-b-2 border-l-2 border-r-0 border-t-2"
            : "",
        ].join(" ")}
        style={{
          left: offset * 4 * scale.value,
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
      <button
        className={[
          ...classes,
          "z-50 block h-full",
          clip.clip_uuid === selectedClipId
            ? "border border-b-2 border-l-0 border-r-0 border-t-2"
            : "",
        ].join(" ")}
        style={{
          width: length * 4 * scale.value - 30,
          left: offset * 4 * scale.value + 15,
          cursor: "move",
        }}
        onPointerOver={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
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
        <div className="flex items-center">
          <div
            className="ml-2 w-full truncate text-left text-xs text-white"
            style={{ width: length * 4 * scale.value - 46 }}
          >
            {clip.name}
          </div>
          {hover && (
            <>
              <div
                className="cursor-pointer"
                onClick={(event) => onDeleteAsk(event, clip)}
              >
                <FontAwesomeIcon
                  icon={faTrashCan}
                  className="text-sm text-white/80 hover:text-white"
                />
              </div>
              <div
                className="cursor-pointer"
                onClick={() => setOpenPrompt(true)}
              >
                <FontAwesomeIcon
                  icon={faPencil}
                  className="me-1 ms-2 text-sm text-white/80 hover:text-white"
                />
              </div>
            </>
          )}
        </div>
      </button>
      <button
        className={[
          ...classes,
          "z-50 w-[15px] rounded-r-md border border-transparent",
          "block h-full cursor-ew-resize",
          clip.clip_uuid === selectedClipId
            ? "border border-b-2 border-l-0 border-r-2 border-t-2"
            : "",
        ].join(" ")}
        style={{
          left: offset * 4 * scale.value + length * 4 * scale.value - 15,
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
      {confirmationModal()}
      <AddEditPrompt
        clip={clip}
        setOpenPrompt={setOpenPrompt}
        openPrompt={openPrompt}
        offset={offset}
      />
    </>
  );
};
