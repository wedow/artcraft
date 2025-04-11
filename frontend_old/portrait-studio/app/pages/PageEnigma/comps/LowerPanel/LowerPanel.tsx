import React from "react";
import { useMouseEventsTimeline } from "~/pages/PageEnigma/comps/Timeline/utils/useMouseEventsTimeline";
import {
  dndTimelineHeight,
  stylizeSidePanelVisible,
  stylizeSidePanelWidth,
  timelineHeight,
} from "~/pages/PageEnigma/signals";
import useTimelineClick from "~/pages/PageEnigma/comps/Timeline/utils/useTimelineClick";
import { Pages } from "~/pages/PageEnigma/constants/page";
import { currentPage } from "~/signals";

interface LowerPanelPropsI {
  children: React.ReactNode;
}

export const LowerPanel = ({ children }: LowerPanelPropsI) => {
  const { onPointerDown } = useMouseEventsTimeline();

  const displayHeight =
    dndTimelineHeight.value > -1
      ? dndTimelineHeight.value
      : timelineHeight.value;

  const onTimelineClick = useTimelineClick(Pages.EDIT);

  const stylizeSidebarAdjustment = stylizeSidePanelVisible.value
    ? stylizeSidePanelWidth.value
    : 0;

  return (
    <>
      {currentPage.value === Pages.EDIT && (
        <div
          className="absolute z-10 h-1 w-full cursor-ns-resize bg-ui-panel-border"
          style={{
            bottom: displayHeight,
            right: stylizeSidebarAdjustment,
            paddingRight: stylizeSidebarAdjustment,
          }}
          onPointerDown={onPointerDown}
        />
      )}
      <div
        className="absolute bottom-0 w-screen bg-ui-panel"
        style={{
          height: displayHeight,
          paddingRight: stylizeSidebarAdjustment,
        }}
        onClick={onTimelineClick}
      >
        {children}
      </div>
    </>
  );
};
