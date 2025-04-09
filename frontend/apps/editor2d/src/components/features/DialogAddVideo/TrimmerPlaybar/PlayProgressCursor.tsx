import { useCallback, useState, useRef } from "react";
import { twMerge } from "tailwind-merge";

import { buttonStyles, verticalPositionStyles } from "./utilities";

export const PlayProgressCursor = ({
  currentTimePercent,
  vidEl,
}: {
  currentTimePercent: number;
  vidEl: HTMLVideoElement;
}) => {
  const [state, setState] = useState<{
    isScrubbing: boolean;
    scrubbingPosition: number;
  }>({
    isScrubbing: false,
    scrubbingPosition: 0,
  });

  const { isScrubbing, scrubbingPosition } = state;
  const containerRef = useRef<HTMLElement | null>(null);
  const mountCallback = useCallback((node: HTMLDivElement) => {
    if (node) {
      containerRef.current = node.parentElement;
    }
  }, []);

  const handleScrubbingCurrentTime = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();
      if (containerRef.current === null) {
        console.log("NULL");
        return;
      }
      const wasPlaying = !vidEl.paused;
      if (wasPlaying) {
        vidEl.pause();
      }

      const containerEl = containerRef.current;
      setState({
        isScrubbing: true,
        scrubbingPosition: calcPosition(e, containerEl),
      });

      const handleMouseMove = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const newPosition = calcPosition(e, containerEl);
        vidEl.currentTime = (newPosition / 100) * vidEl.duration;
        setState({
          isScrubbing: true,
          scrubbingPosition: newPosition,
        });
      };
      const handleMouseUp = () => {
        setState((prev) => {
          if (wasPlaying) {
            vidEl.play();
          }
          return {
            ...prev,
            isScrubbing: false,
          };
        });

        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [vidEl],
  );

  return (
    <>
      <div
        // play progress bar
        className="absolute left-0 top-0 mt-3 h-4 bg-primary-500"
        style={{
          width: isScrubbing
            ? `${scrubbingPosition}%`
            : `${currentTimePercent}%`,
        }}
      />
      <div
        ref={mountCallback}
        // current time scrubber
        className={twMerge(
          verticalPositionStyles,
          buttonStyles,
          "z-20 size-5 -translate-x-1/2 rounded-full",
          isScrubbing && "cursor-grabbing",
        )}
        onMouseDown={handleScrubbingCurrentTime}
        style={{
          left: isScrubbing
            ? `${scrubbingPosition}%`
            : `${currentTimePercent}%`,
        }}
      />
    </>
  );
};

const calcPosition = (
  e: MouseEvent | React.MouseEvent<HTMLDivElement>,
  parentEl: HTMLElement,
) => {
  const parentWidth = parentEl.getBoundingClientRect().width;
  const result = ((e.clientX - parentEl.offsetLeft) / parentWidth) * 100;
  if (result < 0) {
    return 0;
  }
  if (result > 100) {
    return 100;
  }
  return result;
};
