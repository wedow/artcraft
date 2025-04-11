import { useRef, useEffect } from "react";
import {
  computed,
  signal,
  Signal,
  ReadonlySignal,
} from "@preact/signals-react";

export type LayoutSignalType = {
  windowWidth: Signal<number>;
  windowHeight: Signal<number>;
  isMobile: ReadonlySignal<boolean>;
};
export const useLayoutContext = () => {
  const layoutRef = useRef<LayoutSignalType>({
    windowWidth: signal(window.innerWidth),
    windowHeight: signal(window.innerHeight),
    isMobile: computed(() => {
      const currentWidth: number = layoutRef.current.windowWidth.value;
      const currentHeight: number = layoutRef.current.windowHeight.value;
      return currentWidth <= 768 && currentWidth <= currentHeight;
    }),
  });

  useEffect(() => {
    const handleWindowResize = () => {
      layoutRef.current.windowWidth.value = window.innerWidth;
      layoutRef.current.windowHeight.value = window.innerHeight;
    };
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  });
  return {
    signal: layoutRef.current,
  };
};
