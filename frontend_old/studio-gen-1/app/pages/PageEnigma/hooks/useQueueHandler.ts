import { fromEngineActions } from "~/pages/PageEnigma/Queue/fromEngineActions";
import { useSignals } from "@preact/signals-react/runtime";
import { useCallback, useEffect } from "react";
import {
  addNewCharacter,
  addObjectToTimeline,
  clearExistingData,
  currentTime,
  deleteObjectOrCharacter,
  loadAudioData,
  loadCameraData,
  loadCharacterData,
  loadObjectData,
  selectedObject,
  addKeyframe,
  selectedItem,
  generateProgress,
} from "~/pages/PageEnigma/signals";
import Queue, { QueueSubscribeType } from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";

import { ToastDataType } from "~/components";

import {
  MediaItem,
  QueueKeyframe,
  UpdateTime,
} from "~/pages/PageEnigma/models";
import { CameraAspectRatio } from "~/pages/PageEnigma/enums";
import { addToast } from "~/signals";
import { ToastTypes, ClipGroup } from "~/enums";
import { toTimelineActions } from "~/pages/PageEnigma/Queue/toTimelineActions";
import { ClipUI } from "~/pages/PageEnigma/datastructures/clips/clip_ui";
import { cameraAspectRatio } from "../signals/engine";
import { loadPromptTravelData } from "~/pages/PageEnigma/signals/promptTravelGroup";

const LOADING_FUNCTIONS: Record<ClipGroup, (item: ClipUI) => void> = {
  [ClipGroup.CHARACTER]: loadCharacterData,
  [ClipGroup.OBJECT]: loadObjectData,
  [ClipGroup.CAMERA]: loadCameraData,
  [ClipGroup.GLOBAL_AUDIO]: loadAudioData,
  [ClipGroup.PROMPT_TRAVEL]: loadPromptTravelData,
};

export function useQueueHandler() {
  useSignals();

  const handleFromEngineActions = useCallback(
    ({ action, data }: QueueSubscribeType) => {
      //console.log("FROM ENGINE", action, data);
      switch (action) {
        case fromEngineActions.ADD_OBJECT: {
          // this could be an object or character
          addObjectToTimeline(data as MediaItem);
          break;
        }
        case fromEngineActions.DELETE_OBJECT:
          // this could be an object or character
          deleteObjectOrCharacter(data as MediaItem);
          break;
        case fromEngineActions.DESELECT_OBJECT:
          selectedObject.value = null;
          break;
        case fromEngineActions.RESET_TIMELINE:
          clearExistingData();
          break;
        case fromEngineActions.SELECT_OBJECT:
          selectedObject.value = {
            type: (data as MediaItem).type,
            id: (data as MediaItem).object_uuid ?? "",
          };
          // Deselect clip item when scene item is selected
          selectedItem.value = null;
          break;
        case fromEngineActions.UPDATE_CHARACTER_ID:
          addNewCharacter(data as MediaItem);
          break;
        case fromEngineActions.UPDATE_TIME:
          currentTime.value = (data as UpdateTime).currentTime;
          break;
        case fromEngineActions.UPDATE_TIME_LINE:
          clearExistingData();
          (data as ClipUI[]).forEach((item) => {
            LOADING_FUNCTIONS[item.group](item);
          });
          break;
        case fromEngineActions.POP_A_TOAST: {
          const message = (data as ToastDataType).message;
          addToast(ToastTypes.ERROR, message);
          break;
        }
        case fromEngineActions.CAMERA_ASPECT_RATIO_CHANGED: {
          cameraAspectRatio.value = data as CameraAspectRatio;
          break;
        }
        default:
          throw new Error(`Unknown action ${action}`);
      }
    },
    [],
  );

  const handleToTimelineActions = useCallback(
    ({ action, data }: QueueSubscribeType) => {
      //console.log("TO TIMELINE", action, data);
      switch (action) {
        case toTimelineActions.ADD_KEYFRAME:
          addKeyframe(data as QueueKeyframe, currentTime.value);
          break;
        case toTimelineActions.GENERATE_PROGRESS:
          generateProgress.value = (
            data as { currentTime: number }
          ).currentTime;
          break;
        default:
          throw new Error(`Unknown action ${action}`);
      }
    },
    [],
  );

  useEffect(() => {
    Queue.subscribe(QueueNames.FROM_ENGINE, "useQ", handleFromEngineActions);
    Queue.subscribe(QueueNames.TO_TIMELINE, "useQ", handleToTimelineActions);
  }, [handleFromEngineActions, handleToTimelineActions]);
}
