import { useCallback, useEffect, useState, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  buttonStyles,
  verticalPositionStyles,
  formatSecondsToHHMMSSCS,
} from "./utilities";
import { Tooltip } from "~/components/ui";

export const TrimScrubber = ({
  icon,
  className,
  onChange,
  trimPosMs,
  maxTrimPosMs,
  minTrimPosMs,
  totalDurationMs,
}: {
  icon: IconDefinition;
  className?: string;
  onChange: (newPosMs: number) => void;
  trimPosMs: number;
  totalDurationMs: number;
  maxTrimPosMs: number;
  minTrimPosMs: number;
}) => {
  const trimPosPercent = (trimPosMs / totalDurationMs) * 100;

  const [state, setState] = useState<{
    isScrubbing: boolean;
    scrubbingPosition: number;
  }>({
    isScrubbing: false,
    scrubbingPosition: trimPosPercent,
  });
  const { isScrubbing, scrubbingPosition } = state;
  const containerRef = useRef<HTMLElement | null>(null);
  const mountCallback = useCallback((node: HTMLDivElement) => {
    if (node) {
      containerRef.current = node.parentElement;
    }
  }, []);
  const scrubbingPositionRef = useRef(scrubbingPosition);
  const onChangeCallback = useCallback(onChange, [onChange]);

  const handleScrubbing = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();

      if (containerRef.current === null) {
        return;
      }
      const calcPosition = makeTrimPositionCalculator(containerRef.current, {
        minMs: minTrimPosMs,
        maxMs: maxTrimPosMs,
        totalDurationMs: totalDurationMs,
      });

      setState({
        isScrubbing: true,
        scrubbingPosition: calcPosition(e),
      });

      const handleMouseMove = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setState({
          isScrubbing: true,
          scrubbingPosition: calcPosition(e),
        });
      };
      const handleMouseUp = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setState((prev) => {
          scrubbingPositionRef.current = prev.scrubbingPosition;
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
    [minTrimPosMs, maxTrimPosMs, totalDurationMs],
  );

  useEffect(() => {
    if (!isScrubbing) {
      const newTrimMs = (scrubbingPositionRef.current / 100) * totalDurationMs;
      onChangeCallback(newTrimMs);
    }
  }, [isScrubbing]);

  const leftOffset = isScrubbing
    ? `${scrubbingPosition}%`
    : `${trimPosPercent}%`;
  const trimmerTime = isScrubbing
    ? `${formatSecondsToHHMMSSCS(((scrubbingPosition / 100) * totalDurationMs) / 1000)}`
    : `${formatSecondsToHHMMSSCS(((trimPosPercent / 100) * totalDurationMs) / 1000)}`;

  return (
    <Tooltip tip={trimmerTime} forceShow={isScrubbing}>
      <div
        ref={mountCallback}
        className={twMerge(
          verticalPositionStyles,
          buttonStyles,
          "flex h-10 w-4 items-center justify-center shadow-md",
          isScrubbing && "cursor-grabbing",
          className,
        )}
        onMouseDown={handleScrubbing}
        style={{
          left: leftOffset,
        }}
      >
        <FontAwesomeIcon icon={icon} />
      </div>
    </Tooltip>
  );
};

function makeTrimPositionCalculator(
  parentEl: HTMLElement,
  {
    minMs,
    maxMs,
    totalDurationMs,
  }: {
    minMs: number;
    maxMs: number;
    totalDurationMs: number;
  },
) {
  const parentWidth = parentEl.getBoundingClientRect().width;
  const minPercent = Math.ceil((minMs / totalDurationMs) * 10000) / 100;
  const maxPercent = Math.floor((maxMs / totalDurationMs) * 10000) / 100;

  return (currE: MouseEvent | React.MouseEvent<HTMLDivElement>) => {
    const result = ((currE.clientX - parentEl.offsetLeft) / parentWidth) * 100;
    // console.log(
    //   `(${currE.clientX} - ${parentEl.offsetLeft}) / ${parentWidth} * 100`,
    // );
    // console.log(`${result} - ${minPercent}:${maxPercent}`);
    if (result < minPercent) {
      return minPercent;
    }
    if (result > maxPercent) {
      return maxPercent;
    }
    return result;
  };
}
