import { useEffect, useRef, useState } from "react";
import { Signal } from "@preact/signals-react";
import { twMerge } from "tailwind-merge";

import { Spinner } from "~/components/ui";
import { VIDEO_STATE_STATUSES } from "./enum";
import { TrimData } from "../TrimmerPlaybar";
import { ButtonPlaypause } from "./ButtonPlayPause";
import { ButtonMute } from "./ButtonMute";
import { LabelTimeDuration } from "./LabelTimeDuration";
import { ButtonRepeat } from "./ButtonRepeat";

export type VideoProps = { width: number; height: number };
export const VideoControls = ({
  vidEl,
  videoPropsSignal,
  trimDataSignal,
  className,
}: {
  vidEl: HTMLVideoElement | undefined;
  videoPropsSignal: Signal<VideoProps | undefined>;
  trimDataSignal: Signal<TrimData | undefined>;
  className?: string;
}) => {
  const prevVidEl = useRef<HTMLVideoElement | undefined>(undefined);
  const [status, setStatus] = useState<VIDEO_STATE_STATUSES>(
    VIDEO_STATE_STATUSES.INIT,
  );

  useEffect(() => {
    // helper function for removing listenders
    const handleLoadedmetadata = () => {
      if (vidEl) {
        setStatus(VIDEO_STATE_STATUSES.METADATA_LOADED);
        videoPropsSignal.value = {
          width: vidEl.videoWidth,
          height: vidEl.videoHeight,
        };
        prevVidEl.current = vidEl;
      }
    };

    // DOM node referencs has changed
    setStatus(VIDEO_STATE_STATUSES.INIT);
    // if the node exist, attach the listener and its remover
    vidEl?.addEventListener("loadedmetadata", handleLoadedmetadata);
    return () => {
      vidEl?.removeEventListener("loadedmetadata", handleLoadedmetadata);
    };
  }, [vidEl]);

  useEffect(() => {
    prevVidEl.current = vidEl;
  }, []);

  const wrapperClass = twMerge(
    "flex w-full h-10 justify-center items-center gap-2 pl-2",
    className,
  );

  if (
    status === VIDEO_STATE_STATUSES.METADATA_LOADED &&
    vidEl &&
    prevVidEl.current === vidEl
  ) {
    return (
      <div className={wrapperClass}>
        <ButtonPlaypause vidEl={vidEl} />
        <ButtonRepeat trimDataSignal={trimDataSignal} vidEl={vidEl} />
        <ButtonMute vidEl={vidEl} />
        <LabelTimeDuration vidEl={vidEl} />
      </div>
    );
  }
  return (
    <div className={wrapperClass}>
      <Spinner className="size-5" />
      <span>Loading...</span>
    </div>
  );
};
