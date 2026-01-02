import { QueueKeyframe, Keyframe, MediaItem } from "~/pages/PageEnigma/models";
import {
  addCameraKeyframe,
  addCharacterKeyframe,
  addObjectKeyframe,
  audioGroup,
  cameraGroup,
  characterGroup,
  deleteCameraKeyframe,
  deleteCharacter,
  deleteCharacterKeyframe,
  deleteObjectKeyframe,
  objectGroup,
} from "~/pages/PageEnigma/signals";
import { ClipGroup } from "~/enums";
import { deleteObject } from "~/pages/PageEnigma/signals/objectGroup/deleteObject";

const ADD_KEYFRAME: Record<
  ClipGroup,
  (keyframe: QueueKeyframe, offset: number) => void
> = {
  [ClipGroup.CAMERA]: addCameraKeyframe,
  [ClipGroup.CHARACTER]: addCharacterKeyframe,
  [ClipGroup.OBJECT]: addObjectKeyframe,
  [ClipGroup.GLOBAL_AUDIO]: () => {},
  [ClipGroup.PROMPT_TRAVEL]: () => {},
};

const DELETE_KEYFRAME: Record<ClipGroup, (keyframe: Keyframe) => void> = {
  [ClipGroup.CAMERA]: deleteCameraKeyframe,
  [ClipGroup.CHARACTER]: deleteCharacterKeyframe,
  [ClipGroup.OBJECT]: deleteObjectKeyframe,
  [ClipGroup.GLOBAL_AUDIO]: () => {},
  [ClipGroup.PROMPT_TRAVEL]: () => {},
};

export function addKeyframe(keyframe: QueueKeyframe, offset: number) {
  ADD_KEYFRAME[keyframe.group](keyframe, offset);
}

export function deleteKeyframe(keyframe: Keyframe) {
  DELETE_KEYFRAME[keyframe.group](keyframe);
}

export function clearExistingData() {
  characterGroup.value = {
    id: "ChG1",
    characters: [],
  };
  cameraGroup.value = {
    id: "CG1",
    keyframes: [],
  };
  audioGroup.value = {
    id: "AG-1",
    clips: [],
    muted: false,
  };
  objectGroup.value = {
    id: "OG1",
    objects: [],
  };
}

export function deleteObjectOrCharacter(item: MediaItem) {
  deleteCharacter(item);
  deleteObject(item);
}
