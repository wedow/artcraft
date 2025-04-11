import { Clip, MediaItem, PromptTravelGroup } from "~/pages/PageEnigma/models";
import { ClipGroup, ClipType } from "~/enums";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
import * as uuid from "uuid";
import { signal } from "@preact/signals-core";
import { ClipUI } from "~/pages/PageEnigma/datastructures/clips/clip_ui";
import { publishClip } from "~/pages/PageEnigma/signals/utils/publishClip";

export const promptTravelGroup = signal<PromptTravelGroup>({
  id: "AG-1",
  clips: [],
});

export function updatePromptTravel({
  id,
  offset,
  length,
  name,
}: {
  id: string;
  length: number;
  offset: number;
  name: string;
}) {
  const oldPromptTravelGroup = promptTravelGroup.value;
  const newClips = [...oldPromptTravelGroup.clips];
  const clipIndex = newClips.findIndex((row) => row.clip_uuid === id);
  if (clipIndex === -1) {
    return { ...oldPromptTravelGroup };
  }
  const clip = newClips[clipIndex];
  clip.offset = offset;
  clip.length = length;
  clip.name = name;

  Queue.publish({
    queueName: QueueNames.TO_ENGINE,
    action: toEngineActions.UPDATE_CLIP,
    data: clip,
  });

  promptTravelGroup.value = {
    ...oldPromptTravelGroup,
    clips: newClips,
  };
}

export function addPromptTravel({
  text,
  length,
  offset,
}: {
  text: string;
  length: number;
  offset: number;
}) {
  const clip_uuid = uuid.v4();
  const newClip = {
    version: 1,
    type: ClipType.PROMPT_TRAVEL,
    group: ClipGroup.PROMPT_TRAVEL,
    offset,
    length: length,
    name: text,
    clip_uuid,
  } as Clip;

  Queue.publish({
    queueName: QueueNames.TO_ENGINE,
    action: toEngineActions.ADD_CLIP,
    data: newClip,
  });

  const oldPromptTravelGroup = promptTravelGroup.value;
  promptTravelGroup.value = {
    ...oldPromptTravelGroup,
    clips: [...oldPromptTravelGroup.clips, newClip],
  };
}

export function deletePromptTravelClip(clip: Clip) {
  const oldPromptTravelGroup = promptTravelGroup.value;
  promptTravelGroup.value = {
    ...oldPromptTravelGroup,
    clips: [
      ...oldPromptTravelGroup.clips.filter((row) => {
        if (row.clip_uuid === clip.clip_uuid) {
          Queue.publish({
            queueName: QueueNames.TO_ENGINE,
            action: toEngineActions.DELETE_CLIP,
            data: row,
          });
          return false;
        }
        return true;
      }),
    ],
  };
}

export function loadPromptTravelData(item: ClipUI) {
  const existingPromptTravelId = promptTravelGroup.value;
  const newItem = {
    version: item.version,
    clip_uuid: item.clip_uuid,
    type: item.type,
    group: item.group,
    object_uuid: item.object_uuid,
    media_id: item.media_id,
    name: item.name,
    offset: item.offset,
    length: item.length,
  } as Clip;
  existingPromptTravelId.clips.push(newItem);
  existingPromptTravelId.clips.sort(
    (clipA, clipB) => clipA.offset - clipB.offset,
  );
}
