import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

import { ButtonTrimDuration } from "./ButtonTrimDuration";
import { TrimmingPlaybarLoading } from "./TrimmerPlaybarLoading";
import { PlayProgressCursor } from "./PlayProgressCursor";
import { TrimAreaScrubber } from "./TrimAreaScrubber";

import { TrimData } from "./utilities";

export const TrimmerPlaybarCore = ({
  vidEl,
  trimData,
  className,
  onTrimChange,
}: {
  vidEl: HTMLVideoElement;
  trimData?: TrimData;
  className?: string;
  onTrimChange: (trimData: TrimData) => void;
}) => {
  const [states, setStates] = useState<{
    durationMs: number | undefined;
    currentTimeMs: number | undefined;
    trimStartMs: number | undefined;
    trimEndMs: number | undefined;
    trimDurationMs: number;
  }>({
    durationMs: undefined,
    currentTimeMs: undefined,
    trimStartMs: undefined,
    trimEndMs: undefined,
    trimDurationMs: 6000,
  });
  const { durationMs, currentTimeMs, trimStartMs, trimEndMs, trimDurationMs } =
    states;

  const handleChangeTrimDuration = (newTrimDurationMs: number) => {
    setStates((curr) => ({ ...curr, trimDurationMs: newTrimDurationMs }));
  };

  const setTrimStartMs = (newTrimMs: number) => {
    setStates((prev) => {
      if (prev.trimEndMs === undefined || prev.durationMs === undefined) {
        if (import.meta.env.DEV) {
          console.warn("Logical Error in Trim Start Setting");
        }
        return prev;
      }
      return {
        ...prev,
        trimStartMs: newTrimMs,
        trimEndMs:
          trimDurationMs >= prev.durationMs
            ? prev.durationMs
            : newTrimMs + trimDurationMs,
      };
    });
  };

  useEffect(() => {
    setStates((prev) => {
      if (prev.trimStartMs === undefined || prev.durationMs === undefined) {
        // video is not ready, no data
        return prev;
      }
      // normal case
      if (prev.trimStartMs + trimDurationMs <= prev.durationMs) {
        return {
          ...prev,
          trimEndMs: prev.trimStartMs + trimDurationMs,
        };
      }
      // not enough duration to fit
      if (trimDurationMs >= prev.durationMs) {
        return {
          ...prev,
          trimStartMs: 0,
          trimEndMs: prev.durationMs,
        };
      }
      // shimmy the area to left
      return {
        ...prev,
        trimStartMs: prev.durationMs - trimDurationMs,
        trimEndMs: prev.durationMs,
      };
    });
  }, [trimDurationMs]);

  useEffect(() => {
    if (trimStartMs !== undefined && trimEndMs !== undefined) {
      onTrimChange({ trimStartMs, trimEndMs });
    }
  }, [trimStartMs, trimEndMs]);

  useEffect(() => {
    const handleLoadedmetadata = () => {
      setStates((prev) => ({
        ...prev,
        durationMs: vidEl.duration * 1000,
        currentTimeMs: vidEl.currentTime * 1000,
        trimStartMs: trimData?.trimStartMs ?? 0,
        trimEndMs: trimData?.trimEndMs
          ? trimData.trimEndMs
          : vidEl.duration * 1000 >= trimDurationMs
            ? trimDurationMs
            : vidEl.duration * 1000,
      }));
    };
    const handleTimeupdate = () => {
      setStates((prev) => ({
        ...prev,
        currentTimeMs: vidEl.currentTime * 1000,
      }));
    };

    // DOM node referencs has changed and exists
    vidEl.addEventListener("loadedmetadata", handleLoadedmetadata);
    vidEl.addEventListener("timeupdate", handleTimeupdate);
    return () => {
      vidEl.removeEventListener("timeupdate", handleTimeupdate);
      vidEl.removeEventListener("loadedmetadata", handleLoadedmetadata);
    };
  }, [vidEl]);

  if (
    durationMs === undefined ||
    currentTimeMs === undefined ||
    trimEndMs === undefined ||
    trimStartMs === undefined
  ) {
    return <TrimmingPlaybarLoading className={className} />;
  }

  return (
    <div className="mx-2 flex grow items-center gap-2">
      <div
        className={twMerge(
          "relative h-10 w-full border-l border-r border-dotted border-l-ui-border border-r-ui-border",
          className,
        )}
      >
        <div className="mt-3 h-4 w-full bg-secondary-300" />
        <PlayProgressCursor
          vidEl={vidEl}
          currentTimePercent={(currentTimeMs / durationMs) * 100}
        />
        <TrimAreaScrubber
          trimStartMs={trimStartMs}
          trimDurationMs={
            durationMs > trimDurationMs ? trimDurationMs : durationMs
          }
          totalDurationMs={durationMs}
          onChange={setTrimStartMs}
        />
      </div>
      <ButtonTrimDuration
        trimDurationMs={trimDurationMs}
        onChange={handleChangeTrimDuration}
      />
    </div>
  );
};
