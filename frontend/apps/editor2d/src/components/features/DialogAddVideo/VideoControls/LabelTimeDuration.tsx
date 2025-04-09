import { useCallback, useEffect, useState } from "react";

export function LabelTimeDuration({ vidEl }: { vidEl: HTMLVideoElement }) {
  const safeGetDuration = useCallback(() => {
    return typeof vidEl.duration === "number" ? vidEl.duration : 0;
  }, [vidEl]);

  const [{ currentTime, duration }, setState] = useState<{
    currentTime: number;
    duration: number;
  }>({ currentTime: 0, duration: safeGetDuration() });

  const setCurrentTime = useCallback((newCurrentTime: number) => {
    setState((curr) => ({ ...curr, currentTime: newCurrentTime }));
  }, []);

  useEffect(() => {
    const handleTimeStamp = () => setCurrentTime(vidEl.currentTime || 0);

    const handleLoadedmetadata = () => {
      setState((curr) => ({
        ...curr,
        duration: safeGetDuration(),
      }));
    };
    vidEl.addEventListener("timeupdate", handleTimeStamp);
    vidEl.addEventListener("loadedmetadata", handleLoadedmetadata);
    return () => {
      vidEl.removeEventListener("loadedmetadata", handleLoadedmetadata);
      vidEl.removeEventListener("timeupdate", handleTimeStamp);
    };
  }, [vidEl]);

  return (
    <div className="flex items-center gap-1">
      <p className="w-8">{`${formatSecondsToHHMMSS(currentTime)}`}</p>
      <span>/</span>
      <p className="w-8">{`${formatSecondsToHHMMSS(duration)}`}</p>
    </div>
  );
}
function formatSecondsToHHMMSS(seconds: number) {
  //example of the ISO String: 1970-01-01T00:01:40.774Z
  const isoString = new Date(Math.round(seconds * 1000)).toISOString();
  if (seconds > 3600) return isoString.substring(11, 19);
  else return isoString.substring(14, 19);
}
