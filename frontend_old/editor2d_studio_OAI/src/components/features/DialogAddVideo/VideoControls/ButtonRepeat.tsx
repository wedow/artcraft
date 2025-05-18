import { useCallback, useEffect, useState, useRef } from "react";
import { Signal } from "@preact/signals-react";
import { faRepeat } from "@fortawesome/pro-solid-svg-icons";
import { Button, Tooltip } from "~/components/ui";
import { TrimData } from "../TrimmerPlaybar";

export const ButtonRepeat = ({
  vidEl,
  trimDataSignal,
}: {
  vidEl: HTMLVideoElement | undefined;
  trimDataSignal: Signal<TrimData | undefined>;
}) => {
  const [isRepeatOn, setIsRepeatOn] = useState<boolean>(true);

  const resetVideoToTrimStart = useCallback(
    (vidEl: HTMLVideoElement, trimData: TrimData) => {
      if (
        vidEl.currentTime < trimData.trimStartMs / 1000 ||
        vidEl.currentTime > trimData.trimEndMs / 1000
      ) {
        vidEl.currentTime = (trimData.trimStartMs + 1) / 1000;
      }
    },
    [],
  );
  const handleOnClick = useCallback(() => {
    setIsRepeatOn((curr) => {
      if (!curr && vidEl && trimDataSignal.value) {
        resetVideoToTrimStart(vidEl, trimDataSignal.value);
      }
      return !curr;
    });
  }, []);

  // helper function for listeners need to be defined for reference for removal
  const handleOnTimeupdate = useCallback(() => {
    if (isRepeatOn && trimDataSignal.value && vidEl) {
      resetVideoToTrimStart(vidEl, trimDataSignal.value);
    }
  }, [isRepeatOn, vidEl]);
  // record previous vidEl and its listener incase of re-render
  const prevVidEl = useRef<HTMLVideoElement | undefined>(undefined);
  const prevhandleOnTimeupdate = useRef(handleOnTimeupdate);
  useEffect(() => {
    // if vidEl changed, remove old listender and attach new listenHandler
    if (vidEl && prevVidEl.current !== vidEl) {
      prevVidEl.current?.removeEventListener(
        "timeupdate",
        prevhandleOnTimeupdate.current,
      );
      vidEl.addEventListener("timeupdate", handleOnTimeupdate);
    }
    // remove and reattached listener if the listenHandler has changed
    if (vidEl && handleOnTimeupdate !== prevhandleOnTimeupdate.current) {
      vidEl.removeEventListener("timeupdate", prevhandleOnTimeupdate.current);
      vidEl.addEventListener("timeupdate", handleOnTimeupdate);
    }
    // remove listener on dismount
    return () => {
      vidEl?.removeEventListener("timeupdate", handleOnTimeupdate);
    };
  }, [vidEl, handleOnTimeupdate]);

  return (
    <Tooltip tip={isRepeatOn ? "Turn off repeat" : "Repeat in trim"}>
      <Button
        className="size-8"
        icon={faRepeat}
        variant={isRepeatOn ? "primary" : "secondary"}
        onClick={handleOnClick}
      />
    </Tooltip>
  );
};
