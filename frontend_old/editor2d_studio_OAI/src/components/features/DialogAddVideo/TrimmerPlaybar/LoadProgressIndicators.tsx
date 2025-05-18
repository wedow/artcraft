import { useCallback, useEffect, useRef, useState } from "react";
export const LoadProgressIndicators = ({
  vidEl,
}: {
  vidEl: HTMLVideoElement;
}) => {
  const [ranges, setRanges] = useState<
    { startPercent: number; endPercent: number }[]
  >([]);
  const containerRef = useRef<HTMLElement | null>(null);
  const mountCallback = useCallback((node: HTMLDivElement) => {
    if (node) {
      containerRef.current = node.parentElement;
    }
  }, []);

  useEffect(() => {
    const handleProgressLoaded = () => {
      const { buffered, duration } = vidEl;
      console.log(buffered);
      let newRanges: { startPercent: number; endPercent: number }[] = [];

      for (let i = 0; i < buffered.length; i++) {
        newRanges[i] = {
          startPercent: (buffered.start(i) / duration) * 100,
          endPercent: (buffered.end(i) / duration) * 100,
        };
      }
      setRanges(newRanges);
    };

    vidEl.addEventListener("timeupdate progress", handleProgressLoaded);
    return () => {
      vidEl.removeEventListener("timeupdate progress", handleProgressLoaded);
    };
  }, [vidEl]);

  return (
    <div className="absolute left-0 top-0 h-full w-full">
      <div
        ref={mountCallback}
        className="relative mt-3 h-4 w-full bg-secondary-300"
      >
        {ranges.map((timeRange, idx) => {
          return (
            <div
              key={idx}
              className="absolute h-4 bg-primary-300"
              style={{
                left: `${timeRange.startPercent}%`,
                width: `${timeRange.endPercent - timeRange.startPercent}%`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
