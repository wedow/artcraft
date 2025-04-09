import React, { useCallback, useEffect, useState } from "react";
import { dndSidePanelWidth, sidePanelWidth } from "~/pages/PageEnigma/signals";

export const useMouseEventsSidePanel = () => {
  const [isActive, setIsActive] = useState(false);
  const [clientX, setClientX] = useState(0);

  useEffect(() => {
    const onPointerUp = () => {
      if (isActive) {
        sidePanelWidth.value = Math.round(dndSidePanelWidth.value);
        setIsActive(false);
        dndSidePanelWidth.value = -1;
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      if (isActive) {
        const delta = event.clientX - clientX;
        event.stopPropagation();
        event.preventDefault();
        if (sidePanelWidth.value - delta < 240) {
          return;
        }
        if (sidePanelWidth.value - delta > 443) {
          return;
        }
        dndSidePanelWidth.value = sidePanelWidth.value - delta;
        return;
      }
    };

    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onMouseMove);

    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onMouseMove);
    };
  }, [clientX, isActive]);

  return {
    onPointerDown: useCallback((event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button === 0) {
        event.stopPropagation();
        setClientX(event.clientX);
        setIsActive(true);
        dndSidePanelWidth.value = sidePanelWidth.value;
      }
    }, []),
  };
};
