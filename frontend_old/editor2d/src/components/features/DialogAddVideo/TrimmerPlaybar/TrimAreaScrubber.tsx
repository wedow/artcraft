import { useCallback, useEffect, useState, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { faGripDots } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { formatSecondsToHHMMSSCS, ONE_MIN } from "./utilities";
import { Tooltip } from "~/components/ui";

export const TrimAreaScrubber = ({
  className,
  onChange,
  trimStartMs,
  trimDurationMs,
  totalDurationMs,
}: {
  className?: string;
  onChange: (newPosMs: number) => void;
  trimStartMs: number;
  trimDurationMs: number;
  totalDurationMs: number;
}) => {
  const trimPosPercent = (trimStartMs / totalDurationMs) * 100;

  const [state, setState] = useState<{
    isScrubbing: boolean;
    scrubPosPercent: number;
  }>({
    isScrubbing: false,
    scrubPosPercent: trimPosPercent,
  });
  const { isScrubbing, scrubPosPercent } = state;
  const containerRef = useRef<HTMLElement | null>(null);
  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const mountCallback = useCallback((node: HTMLDivElement) => {
    if (node) {
      scrubberRef.current = node;
      containerRef.current = node.parentElement;
    }
  }, []);
  const scrubPosPercentRef = useRef(scrubPosPercent);

  const handleScrubbing = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();

      if (containerRef.current === null || scrubberRef.current === null) {
        return;
      }

      const calcPosition = makeTrimPositionCalculator({
        parentEl: containerRef.current,
        mouseOffset:
          e.clientX -
          scrubberRef.current.offsetLeft -
          containerRef.current.offsetLeft,
        trimDurationMs: trimDurationMs,
        totalDurationMs: totalDurationMs,
      });

      setState({
        isScrubbing: true,
        scrubPosPercent: calcPosition(e),
      });

      const handleMouseMove = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setState({
          isScrubbing: true,
          scrubPosPercent: calcPosition(e),
        });
      };
      const handleMouseUp = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setState((prev) => {
          scrubPosPercentRef.current = prev.scrubPosPercent;
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
    [trimDurationMs, totalDurationMs],
  );

  useEffect(() => {
    if (!isScrubbing) {
      const newTrimMs = (scrubPosPercentRef.current / 100) * totalDurationMs;
      onChange(newTrimMs);
    }
  }, [isScrubbing]);

  // this determines if trimmer is its taking value
  //from parent's control or user's mouse movement
  const positionPercent = isScrubbing ? scrubPosPercent : trimPosPercent;
  const leftOffset = `${positionPercent}%`;
  // the rest are values that dervied from that position
  const trimStartTime = formatSecondsToHHMMSSCS(
    (positionPercent / 100) * totalDurationMs,
  );
  const displayedTrimStartTime =
    totalDurationMs >= ONE_MIN * 60
      ? trimStartTime.substring(3, 8)
      : totalDurationMs >= ONE_MIN
        ? trimStartTime.substring(0, 5)
        : trimStartTime.substring(3, 8);
  const tip = `Trim ${Math.round(trimDurationMs / 1000)}s from ${displayedTrimStartTime}`;

  return (
    <Tooltip tip={tip} forceShow={isScrubbing}>
      <div
        ref={mountCallback}
        className={twMerge(
          "absolute top-0 -translate-y-1",
          "z-10 h-9 w-4 items-center justify-center",
          "rounded-b-md border-x-2 border-b-2 border-white shadow-md",
          isScrubbing ? "cursor-grabbing" : "cursor-grab",
          className,
        )}
        onMouseDown={handleScrubbing}
        style={{
          width: `${(trimDurationMs / totalDurationMs) * 100}%`,
          left: leftOffset,
        }}
      >
        <FontAwesomeIcon
          icon={faGripDots}
          className="w-full -translate-x-[2px] -translate-y-2 rounded-t-md border-x-2 border-white bg-white"
        />
      </div>
    </Tooltip>
  );
};

function makeTrimPositionCalculator({
  parentEl,
  mouseOffset,
  trimDurationMs,
  totalDurationMs,
}: {
  parentEl: HTMLElement;
  mouseOffset: number;
  trimDurationMs: number;
  totalDurationMs: number;
}) {
  const parentWidth = parentEl.getBoundingClientRect().width;
  const maxMs =
    totalDurationMs - trimDurationMs > 0 ? totalDurationMs - trimDurationMs : 0;
  const maxPercent = Math.floor((maxMs / totalDurationMs) * 10000) / 100;

  return (currE: MouseEvent | React.MouseEvent<HTMLDivElement>) => {
    const result =
      ((currE.clientX - mouseOffset - parentEl.offsetLeft) / parentWidth) * 100;

    if (result < 0) {
      return 0;
    }
    if (result > maxPercent) {
      return maxPercent;
    }
    return result;
  };
}
