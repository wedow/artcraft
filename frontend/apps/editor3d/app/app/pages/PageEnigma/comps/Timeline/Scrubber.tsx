import {
  currentTime,
  scale,
  timelineHeight,
  timelineScrollX,
  pointerScrubber,
  secondaryScrubber,
  frameTrackButtonWidthPx,
} from "~/pages/PageEnigma/signals";
import { useMouseEventsScrubber } from "~/pages/PageEnigma/comps/Timeline/utils/useMouseEventsScrubber";
import { useSignals } from "@preact/signals-react/runtime";
import { Pages } from "~/pages/PageEnigma/constants/page";
import { useContext, useEffect } from "react";
import { currentPage } from "~/signals";
import { EngineContext } from "~/pages/PageEnigma/contexts/EngineContext";

export const Scrubber = () => {
  useSignals();
  const editorEngine = useContext(EngineContext);
  const { onPointerDown, time } = useMouseEventsScrubber();

  const isPlaying = editorEngine?.timeline?.is_playing ?? false;
  const displayTime = time === -1 ? currentTime.value : time;

  useEffect(() => {
    secondaryScrubber.value = displayTime;
    if (currentPage.value === Pages.STYLE && isPlaying) {
      return;
    }
    pointerScrubber.value = displayTime;
  }, [displayTime, isPlaying]);

  const scrollX = timelineScrollX.value;

  return (
    <>
      {pointerScrubber.value * 4 * scale.value - scrollX + frameTrackButtonWidthPx >= 0 && (
        <div
          className="absolute z-[20] flex cursor-ew-resize flex-col items-center"
          style={{
            top: 8,
            left: pointerScrubber.value * 4 * scale.value + 199 - scrollX + frameTrackButtonWidthPx,
          }}
          onPointerDown={onPointerDown}
        >
          <div>
            <svg
              width="14"
              height="21"
              viewBox="0 0 14 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 19.5858L1.58578 14.1715C1.21071 13.7965 0.999999 13.2878 0.999999 12.7573L1 2C1 1.44772 1.44771 1 2 1L12 1C12.5523 1 13 1.44772 13 2L13 12.7573C13 13.2878 12.7893 13.7965 12.4142 14.1715L7 19.5858Z"
                fill="white"
                stroke="white"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div
            className="block bg-white"
            style={{
              width: 2,
              marginTop: -5,
              height: timelineHeight.value - 36,
            }}
          />
        </div>
      )}
      {secondaryScrubber.value * 4 * scale.value - scrollX >= 0 &&
        currentPage.value === Pages.STYLE && (
          <div
            className="absolute z-[20] flex cursor-ew-resize flex-col items-center"
            style={{
              top: 28,
              left: secondaryScrubber.value * 4 * scale.value + 204 - scrollX,
            }}
            onPointerDown={onPointerDown}
          >
            <div
              className="block bg-white/80"
              style={{
                width: 1,
                marginTop: -5,
                height: timelineHeight.value - 36,
              }}
            />
          </div>
        )}
    </>
  );
};
