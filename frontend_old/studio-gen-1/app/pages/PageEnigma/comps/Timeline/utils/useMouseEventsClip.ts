import React, { Dispatch, useCallback, useEffect, useRef } from "react";
import { Clip } from "~/pages/PageEnigma/models";
import { canDrop, scale } from "~/pages/PageEnigma/signals";
import { useSignals } from "@preact/signals-react/runtime";

export const useMouseEventsClip = (
  clip: Clip,
  max: number,
  min: number,
  updateClip: (args: { id: string; offset: number; length: number }) => void,
  setState: Dispatch<{ length: number; offset: number }>,
) => {
  useSignals();
  const currLength = useRef(clip.length);
  const currOffset = useRef(clip.offset);
  const initLength = useRef(clip.length);
  const initOffset = useRef(clip.offset);
  const isActive = useRef("");
  const clientX = useRef(0);

  const onPointerUp = useCallback(
    (event: PointerEvent) => {
      if (isActive.current) {
        event.stopPropagation();
        event.preventDefault();
        updateClip({
          id: clip.clip_uuid,
          offset: Math.round(currOffset.current),
          length: Math.round(currLength.current),
        });
        isActive.current = "";
        canDrop.value = false;
      }
    },
    [updateClip, clip.clip_uuid],
  );

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      if (isActive.current) {
        event.stopPropagation();
        event.preventDefault();
      }
      const delta = (event.clientX - clientX.current) / 4 / scale.value;
      const deltaOffset = delta + initOffset.current;
      if (isActive.current === "drag") {
        if (deltaOffset < min) {
          currOffset.current = min;
        } else if (deltaOffset + currLength.current > max) {
          currOffset.current = max - currLength.current;
        } else {
          currOffset.current = deltaOffset;
        }
      }
      if (isActive.current === "left") {
        if (
          initLength.current - delta < 90 / 4 / scale.value ||
          deltaOffset < min
        ) {
          return;
        }
        currOffset.current = deltaOffset;
        currLength.current = initLength.current - delta;
      }
      if (isActive.current === "right") {
        if (
          initLength.current + delta < 90 / 4 / scale.value ||
          currOffset.current + initLength.current + delta > max
        ) {
          return;
        }
        currLength.current = initLength.current + delta;
      }
      setState({ length: currLength.current, offset: currOffset.current });
    },
    [max, min, setState],
  );

  useEffect(() => {
    currLength.current = clip.length;
    currOffset.current = clip.offset;
    initLength.current = clip.length;
    initOffset.current = clip.offset;
  }, [clip.length, clip.offset]);

  useEffect(() => {
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onMouseMove);

    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onMouseMove);
    };
  }, [onPointerUp, onMouseMove]);

  return {
    onPointerDown: (
      event: React.PointerEvent<HTMLButtonElement>,
      type: string,
    ) => {
      if (event.button === 0) {
        event.stopPropagation();
        event.preventDefault();
        clientX.current = event.clientX;
        isActive.current = type;
      }
    },
  };
};
