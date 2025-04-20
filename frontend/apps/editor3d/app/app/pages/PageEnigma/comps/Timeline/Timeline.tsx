import { UIEvent, useCallback, useEffect, useRef } from "react";
import { LowerPanel } from "~/pages/PageEnigma/comps/LowerPanel";

import { Camera } from "./Camera";
import { Audio } from "./Audio";
import {
  characterGroup,
  filmLength,
  frameTrackButtonWidthPx,
  ignoreKeyDelete,
  isHotkeyDisabled,
  objectsMinimized,
  scale,
  selectedItem,
  selectedObject,
  sidePanelVisible,
  sidePanelWidth,
  timelineHeight,
  timelineScrollX,
  timelineScrollY,
} from "~/pages/PageEnigma/signals";
import { useSignalEffect, useSignals } from "@preact/signals-react/runtime";
import { TimerGrid } from "~/pages/PageEnigma/comps/TimerGrid/TimerGrid";
import { Scrubber } from "~/pages/PageEnigma/comps/Timeline/Scrubber";
import { Characters } from "~/pages/PageEnigma/comps/Timeline/Characters";
import { ObjectGroups } from "~/pages/PageEnigma/comps/Timeline/ObjectGroups";
import { RowHeaders } from "~/pages/PageEnigma/comps/Timeline/RowHeaders/RowHeaders";
import { currentPage, pageWidth } from "~/signals";
import { Pages } from "~/pages/PageEnigma/constants/page";
import PremiumLockTimeline from "./PremiumLockTimeline";
import { AssetType } from "~/enums";
import { PromptTravel } from "~/pages/PageEnigma/comps/Timeline/PromptTravel";
import { useOnDelete } from "~/pages/PageEnigma/comps/Timeline/utils/useOnDelete";

function scrollItem(itemId: string) {
  const element = document.getElementById(itemId);
  if (!element) {
    return;
  }
  element.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

export const Timeline = () => {
  useSignals();
  const lastSelectedObject = useRef(selectedObject.value);

  if (selectedObject.value !== lastSelectedObject.current) {
    lastSelectedObject.current = selectedObject.value;
    switch (selectedObject.value?.type) {
      case AssetType.CHARACTER:
        if (
          characterGroup.value.characters.some(
            (character) => character.object_uuid === selectedObject.value?.id,
          )
        ) {
          scrollItem(`track-character-${selectedObject.value?.id}`);
          break;
        }
        if (objectsMinimized.value) {
          scrollItem("track-objects");
          break;
        }
        scrollItem(`track-object-${selectedObject.value?.id}`);
        break;
      case AssetType.CAMERA:
        scrollItem("track-camera");
        break;
      case AssetType.OBJECT:
        if (objectsMinimized.value) {
          scrollItem("track-objects");
          break;
        }
        scrollItem(`track-object-${selectedObject.value?.id}`);
        break;
    }
  }

  const onScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    timelineScrollX.value = event.currentTarget.scrollLeft;
    timelineScrollY.value = event.currentTarget.scrollTop;
  }, []);

  useSignalEffect(() => {
    timelineHeight.value = currentPage.value === Pages.EDIT ? 208 : 120;
  });

  const { onDeleteAsk, confirmationModal } = useOnDelete();

  const onDeleteKey = useCallback(
    (event: KeyboardEvent) => {
      if (ignoreKeyDelete.value || isHotkeyDisabled()) {
        return;
      }
      if (
        ["Backspace", "Delete"].indexOf(event.key) > -1 &&
        selectedItem.value !== null
      ) {
        onDeleteAsk(event, selectedItem.value);
      }
    },
    [onDeleteAsk],
  );

  useEffect(() => {
    document.addEventListener("keydown", onDeleteKey);

    return () => {
      document.removeEventListener("keydown", onDeleteKey);
    };
  }, [onDeleteKey]);

  const sidebarAdjustment = sidePanelVisible.value
    ? sidePanelWidth.value + 84
    : 84;

  return (
    <>
      <LowerPanel>
        <div
          style={{
            marginRight:
              currentPage.value === Pages.EDIT ? sidebarAdjustment : 16,
          }}
        >
          <TimerGrid />
          <div className="flex">
            <div
              className="ml-[60px] mt-2 w-[144px] min-w-[144px] overflow-hidden"
              style={{
                height: timelineHeight.value - 36,
              }}
            >
              <RowHeaders />
            </div>
            <div
              className="relative mt-2 overflow-auto"
              onScroll={onScroll}
              style={{
                width: pageWidth.value - 204,
                height: timelineHeight.value - 36,
              }}
            >
              <div className="w-fit">
                {currentPage.value === Pages.EDIT ? (
                  <>
                    <PremiumLockTimeline locked={false} />
                    <Characters />
                    <div className="pb-1 pr-4">
                      <Camera />
                    </div>
                    <div className="pb-1 pr-8">
                      <Audio />
                    </div>
                    <ObjectGroups />
                  </>
                ) : (
                  <>
                    <PremiumLockTimeline locked={false} />
                    <PromptTravel />
                  </>
                )}
              </div>
            </div>
            <Scrubber />
          </div>
        </div>
      </LowerPanel>
      {confirmationModal()}
    </>
  );
};
