import {
  CameraGroup,
  Keyframe,
  QueueKeyframe,
} from "~/pages/PageEnigma/models";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
import * as uuid from "uuid";
import { signal } from "@preact/signals-core";
import { ClipUI } from "~/pages/PageEnigma/datastructures/clips/clip_ui";
import { ToastTypes } from "~/enums";
import { addToast } from "~/signals";

export const cameraGroup = signal<CameraGroup>({ id: "CG1", keyframes: [] });

export function updateCamera({ id, offset }: { id: string; offset: number }) {
  const oldCameraGroup = cameraGroup.value;

  const existingKeyframe = oldCameraGroup.keyframes.find((row) => {
    return row.offset === offset && row.keyframe_uuid !== id;
  });

  if (existingKeyframe) {
    addToast(
      ToastTypes.WARNING,
      "There can only be one keyframe at this offset.",
    );
    return;
  }

  const newKeyframes = [...oldCameraGroup.keyframes];
  const keyframe = newKeyframes.find((row) => row.keyframe_uuid === id);
  if (!keyframe) {
    return;
  }
  keyframe.offset = offset;

  Queue.publish({
    queueName: QueueNames.TO_ENGINE,
    action: toEngineActions.UPDATE_KEYFRAME,
    data: keyframe,
  });

  cameraGroup.value = {
    ...oldCameraGroup,
    keyframes: newKeyframes,
  };
}

export function addCameraKeyframe(keyframe: QueueKeyframe, offset: number) {
  const oldCameraGroup = cameraGroup.value;

  const newKeyframe = {
    version: keyframe.version,
    keyframe_uuid: uuid.v4(),
    group: keyframe.group,
    object_uuid: keyframe.object_uuid,
    offset,
    position: keyframe.position,
    rotation: keyframe.rotation,
    scale: keyframe.scale,
    selected: false,
  } as Keyframe;

  const existingKeyframe = oldCameraGroup.keyframes.find(
    (row) => row.offset === offset,
  );
  if (existingKeyframe) {
    addToast(
      ToastTypes.WARNING,
      "There can only be one keyframe at this offset.",
    );
    newKeyframe.keyframe_uuid = existingKeyframe.keyframe_uuid;
  }

  cameraGroup.value = {
    ...oldCameraGroup,
    keyframes: [
      ...oldCameraGroup.keyframes.filter(
        (keyframe) =>
          keyframe.keyframe_uuid !== existingKeyframe?.keyframe_uuid,
      ),
      newKeyframe,
    ].sort((keyFrameA, keyframeB) => keyFrameA.offset - keyframeB.offset),
  };

  Queue.publish({
    queueName: QueueNames.TO_ENGINE,
    action: existingKeyframe
      ? toEngineActions.UPDATE_KEYFRAME
      : toEngineActions.ADD_KEYFRAME,
    data: newKeyframe,
  });
}

export function selectCameraKeyframe(keyframeId: string) {
  const oldCameraGroup = cameraGroup.value;
  cameraGroup.value = {
    ...oldCameraGroup,
    keyframes: [
      ...oldCameraGroup.keyframes.map((keyframe) => {
        return {
          ...keyframe,
          selected:
            keyframe.keyframe_uuid === keyframeId
              ? !keyframe.selected
              : keyframe.selected,
        };
      }),
    ],
  };
}

export function deleteCameraKeyframe(deleteKeyframe: Keyframe) {
  const oldCameraGroup = cameraGroup.value;
  cameraGroup.value = {
    ...oldCameraGroup,
    keyframes: [
      ...oldCameraGroup.keyframes.filter((keyframe) => {
        if (keyframe.keyframe_uuid === deleteKeyframe.keyframe_uuid) {
          Queue.publish({
            queueName: QueueNames.TO_ENGINE,
            action: toEngineActions.DELETE_KEYFRAME,
            data: keyframe,
          });
          return false;
        }
        return true;
      }),
    ],
  };
}

export function loadCameraData(item: ClipUI) {
  const existingCamera = cameraGroup.value;
  const newKeyframe = {
    version: item.version,
    keyframe_uuid: item.clip_uuid,
    group: item.group,
    object_uuid: item.object_uuid,
    offset: item.keyframe_offset,
  } as Keyframe;
  existingCamera.keyframes.push(newKeyframe);
  existingCamera.keyframes.sort(
    (keyframeA, keyframeB) => keyframeA.offset - keyframeB.offset,
  );
}
