import { ClipUI } from "~/pages/PageEnigma/clips/clip_ui";
import { Keyframe, ObjectTrack } from "~/pages/PageEnigma/models";
import { objectGroup } from "~/pages/PageEnigma/signals";

function getAddObject(item: ClipUI) {
  const existingObject = objectGroup.value.objects.find(
    (obj) => obj.object_uuid === item.object_uuid,
  );

  if (existingObject) {
    return existingObject;
  }

  const newObject = {
    object_uuid: item.object_uuid,
    name: item.object_name,
    keyframes: [] as Keyframe[],
  } as ObjectTrack;

  objectGroup.value = {
    id: "OB1",
    objects: [
      ...objectGroup.value.objects.filter(
        (obj) => obj.object_uuid !== item.object_uuid,
      ),
      newObject,
    ].sort((objA, objB) => (objA.object_uuid < objB.object_uuid ? -1 : 1)),
  };

  return objectGroup.value.objects.find(
    (obj) => obj.object_uuid === item.object_uuid,
  ) as ObjectTrack;
}

export function loadObjectData(item: ClipUI) {
  const existingObject = getAddObject(item);
  const newKeyframe = {
    version: item.version,
    keyframe_uuid: item.clip_uuid,
    group: item.group,
    object_uuid: item.object_uuid,
    offset: item.keyframe_offset,
  } as Keyframe;
  existingObject.keyframes.push(newKeyframe);
  existingObject.keyframes.sort(
    (keyframeA, keyframeB) => keyframeA.offset - keyframeB.offset,
  );
}
