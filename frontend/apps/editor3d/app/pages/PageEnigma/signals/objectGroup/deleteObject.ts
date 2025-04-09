import { MediaItem } from "~/pages/PageEnigma/models";
import { objectGroup } from "~/pages/PageEnigma/signals";

export function deleteObject(item: MediaItem) {
  objectGroup.value = {
    ...objectGroup.value,
    objects: objectGroup.value.objects.filter(
      (obj) => obj.object_uuid !== item.object_uuid,
    ),
  };
}
