import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
import { filmLength } from "~/pages/PageEnigma/signals";
import { MediaItem, Clip } from "~/pages/PageEnigma/models";

export function publishClip(
  newClip: Clip,
  dragItem: MediaItem,
  offset: number,
) {
  Queue.publish({
    queueName: QueueNames.TO_ENGINE,
    action: toEngineActions.ADD_CLIP,
    data: newClip,
  });
  if (offset + (dragItem.length ?? 0) > filmLength.value * 1000) {
    newClip.length = filmLength.value * 1000 - offset;
    Queue.publish({
      queueName: QueueNames.TO_ENGINE,
      action: toEngineActions.UPDATE_CLIP,
      data: newClip,
    });
  }
}
