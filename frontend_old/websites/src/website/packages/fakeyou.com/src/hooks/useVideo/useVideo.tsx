import { useRef } from "react";

interface Props {
  onEnded?: any;
  videoRef?: React.RefObject<HTMLVideoElement>;
}

export default function useVideo({ onEnded, videoRef }: Props) {
  const internalRef = useRef<HTMLVideoElement>(null);
  const ref = videoRef || internalRef;
  const playCtrl = (toDo = (b: any) => {}) => {
    if (ref.current) {
      let isPlaying = !!(
        ref.current.currentTime > 0 &&
        !ref.current.paused &&
        !ref.current.ended &&
        ref.current.readyState > 2
      );
      if (!isPlaying) {
        toDo(false);
        ref.current.play();
      } else {
        toDo(true);
        ref.current.pause();
      }
    }
  };

  return [{ playCtrl }, { onEnded, ref }];
}
