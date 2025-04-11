import {
  cameraGroup,
  cameraMinimized,
  fullWidth,
  minimizeIconPosition,
  updateCamera,
} from "~/pages/PageEnigma/signals";
import { TrackKeyFrames } from "~/pages/PageEnigma/comps/Timeline/TrackKeyFrames";
import { useSignals } from "@preact/signals-react/runtime";
import { ClipGroup } from "~/enums";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown, faAngleUp } from "@fortawesome/pro-solid-svg-icons";

export const Camera = () => {
  useSignals();
  const { keyframes } = cameraGroup.value!;

  if (cameraMinimized.value) {
    return (
      <div
        id="track-camera"
        className="relative flex h-[30px] items-center justify-end rounded-r-lg bg-camera-groupBg pr-4"
        style={{ width: fullWidth.value + 16 }}
      >
        <button
          className="absolute"
          style={{
            left: minimizeIconPosition.value,
          }}
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            cameraMinimized.value = !cameraMinimized.value;
          }}
        >
          <FontAwesomeIcon icon={faAngleDown} />
        </button>
      </div>
    );
  }

  return (
    <div
      id="track-camera"
      className="relative block rounded-r-lg bg-camera-groupBg pb-2 pr-4"
    >
      <div className="flex justify-end">
        <button
          className="absolute"
          style={{
            right: minimizeIconPosition.value,
          }}
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            cameraMinimized.value = !cameraMinimized.value;
          }}
        >
          <FontAwesomeIcon icon={faAngleUp} />
        </button>
      </div>
      <div className="pt-[30px]">
        <TrackKeyFrames
          id={cameraGroup.value.id}
          keyframes={keyframes}
          group={ClipGroup.CAMERA}
          updateKeyframe={updateCamera}
        />
      </div>
    </div>
  );
};
