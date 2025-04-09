import React, { useCallback } from "react";
import {
  currentTime,
  filmLength,
  frameTrackButtonWidthPx,
  scale,
  selectedItem,
  stylizeScrollX,
  timelineScrollX,
} from "~/pages/PageEnigma/signals";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
import { Pages } from "~/pages/PageEnigma/constants/page";

export default function useTimelineClick(page: Pages) {
  return useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const scrollX =
      page === Pages.EDIT ? timelineScrollX.value : stylizeScrollX.value;
    const newTime = Math.round(
      (event.clientX + scrollX - 204 - frameTrackButtonWidthPx) / 4 / scale.value,
    );
    if (newTime < 0) {
      return;
    }
    const max = filmLength.value * 1000;
    if (newTime > max) {
      return;
    }
    selectedItem.value = null;
    currentTime.value = newTime;
    Queue.publish({
      queueName: QueueNames.TO_ENGINE,
      action: toEngineActions.UPDATE_TIME,
      data: { currentTime: newTime },
    });
  }, [page]);
}
