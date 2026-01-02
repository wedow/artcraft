import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
import { objectGroup } from "~/pages/PageEnigma/signals";
import { ToastTypes } from "~/enums";
import { addToast } from "~/signals";

export function updateObject({
  id,
  offset,
}: {
  id: string;
  offset: number;
}): void {
  const oldObjectGroup = objectGroup.value;
  const obj = oldObjectGroup.objects.find((objectTrack) =>
    objectTrack.keyframes.some((row) => row.keyframe_uuid === id),
  );

  if (!obj) {
    return;
  }

  const existingKeyframe = obj.keyframes.find((row) => {
    return row.offset === offset && row.keyframe_uuid !== id;
  });

  if (existingKeyframe) {
    addToast(
      ToastTypes.WARNING,
      "There can only be one keyframe at this offset.",
    );
    return;
  }

  objectGroup.value = {
    id: oldObjectGroup.id,
    objects: oldObjectGroup.objects.map((object) => ({
      object_uuid: object.object_uuid,
      name: object.name,
      keyframes: object.keyframes.map((keyframe) => {
        if (keyframe.keyframe_uuid !== id) {
          return {
            ...keyframe,
          };
        }

        Queue.publish({
          queueName: QueueNames.TO_ENGINE,
          action: toEngineActions.UPDATE_KEYFRAME,
          data: {
            ...keyframe,
            offset,
          },
        });

        return {
          ...keyframe,
          offset,
        };
      }),
    })),
  };
}
