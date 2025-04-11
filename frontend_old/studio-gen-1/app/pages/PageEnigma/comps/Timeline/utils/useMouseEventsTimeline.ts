import React, { useCallback, useEffect, useState } from "react";
import {
  dndTimelineHeight,
  filmLength,
  scale,
  secondaryScrubber,
  timelineHeight,
  timelineScrollX,
} from "~/pages/PageEnigma/signals";
import { currentPage, pageHeight } from "~/signals";
import { Pages } from "~/pages/PageEnigma/constants/page";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";

export const useMouseEventsTimeline = () => {
  const [isActive, setIsActive] = useState(false);
  const [clientY, setClientY] = useState(0);

  useEffect(() => {
    const onPointerUp = (event: PointerEvent) => {
      if (isActive) {
        event.stopPropagation();
        event.preventDefault();
        timelineHeight.value = Math.round(dndTimelineHeight.value);
        setIsActive(false);
        dndTimelineHeight.value = -1;
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      if (isActive) {
        event.stopPropagation();
        event.preventDefault();
        const delta = event.clientY - clientY;
        if (timelineHeight.value - delta < 30) {
          return;
        }
        if (timelineHeight.value - delta > pageHeight.value * 0.5) {
          return;
        }
        dndTimelineHeight.value = timelineHeight.value - delta;
        return;
      }
      if (currentPage.value === Pages.STYLE) {
        let newPosition =
          (event.clientX - 200 + timelineScrollX.value) / 4 / scale.value;
        if (newPosition < 0) {
          newPosition = 0;
        }
        const max = filmLength.value * 60;
        if (newPosition > max) {
          newPosition = max;
        }
        if (newPosition !== secondaryScrubber.value) {
          secondaryScrubber.value = newPosition;
          Queue.publish({
            queueName: QueueNames.TO_TIMELINE,
            action: toEngineActions.UPDATE_TIME,
            data: { currentTime: newPosition },
          });
        }
      }
    };

    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onMouseMove);

    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onMouseMove);
    };
  }, [clientY, isActive]);

  return {
    onPointerDown: useCallback((event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button === 0) {
        event.stopPropagation();
        dndTimelineHeight.value = timelineHeight.value;
        setClientY(event.clientY);
        setIsActive(true);
      }
    }, []),
  };
};
