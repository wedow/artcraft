import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  currentTime,
  filmLength,
  scale,
  secondaryScrubber,
} from "~/pages/PageEnigma/signals";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
import { currentPage } from "~/signals";
import { Pages } from "~/pages/PageEnigma/constants/page";

export const useMouseEventsScrubber = () => {
  const [isActive, setIsActive] = useState(false);
  const clientX = useRef(0);

  const [time, setTime] = useState(-1);

  const getDelta = useCallback((event: MouseEvent) => {
    const max = filmLength.value * 60;

    const delta = Math.round(
      (event.clientX - clientX.current) / 4 / scale.value + currentTime.value,
    );
    if (delta < 0) {
      return 0;
    }
    if (delta > max) {
      return max;
    }

    return delta;
  }, []);

  useEffect(() => {
    const onPointerUp = () => {
      if (isActive) {
        currentTime.value = Math.round(time);
        setIsActive(false);
        setTime(-1);
        Queue.publish({
          queueName: QueueNames.TO_ENGINE,
          action: toEngineActions.UPDATE_TIME,
          data: { currentTime: Math.round(time) },
        });
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      if (isActive) {
        event.stopPropagation();
        event.preventDefault();

        const delta = getDelta(event);
        setTime((oldTime) => {
          if (oldTime !== delta) {
            Queue.publish({
              queueName: QueueNames.TO_ENGINE,
              action: toEngineActions.UPDATE_TIME,
              data: {
                currentTime: delta,
              },
            });
          }
          return delta;
        });
        return;
      }
    };

    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onMouseMove);

    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onMouseMove);
    };
  }, [clientX, isActive, time, getDelta]);

  return {
    onPointerDown: useCallback((event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button === 0) {
        clientX.current = event.clientX;
        setIsActive(true);
        setTime(currentTime.value);
      }
    }, []),
    time,
  };
};
