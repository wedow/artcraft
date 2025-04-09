import { useState } from "react";

export enum AnimationStatus {
  paused,
  animating,
}

export interface AnimationEvents {
  onStart: () => void;
  onRest: () => void;
}

export default function useAnimationStatus() {
  const [status, statusSet] = useState(AnimationStatus.paused);

  return {
    status,
    events: {
      onStart: () => statusSet(AnimationStatus.animating),
      onRest: () => statusSet(AnimationStatus.paused),
    },
  };
}
