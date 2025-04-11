import { AudioGroup, Clip, MediaItem } from "~/pages/PageEnigma/models";
import { ClipGroup, ClipType } from "~/enums";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
import * as uuid from "uuid";
import { signal } from "@preact/signals-core";
import { ClipUI } from "~/pages/PageEnigma/datastructures/clips/clip_ui";
import { publishClip } from "~/pages/PageEnigma/signals/utils/publishClip";

export const audioGroup = signal<AudioGroup>({
  id: "AG-1",
  clips: [],
  muted: false,
});

export function updateAudio({
  id,
  offset,
  length,
}: {
  id: string;
  length: number;
  offset: number;
}) {
  const oldAudioGroup = audioGroup.value;
  const newClips = [...oldAudioGroup.clips];
  const clipIndex = newClips.findIndex((row) => row.clip_uuid === id);
  if (clipIndex === -1) {
    return { ...oldAudioGroup };
  }
  const clip = newClips[clipIndex];
  clip.offset = offset;
  clip.length = length;

  Queue.publish({
    queueName: QueueNames.TO_ENGINE,
    action: toEngineActions.UPDATE_CLIP,
    data: clip,
  });

  audioGroup.value = {
    ...oldAudioGroup,
    clips: newClips,
  };
}

export function addGlobalAudio({
  dragItem,
  audioId,
  offset,
}: {
  dragItem: MediaItem;
  audioId: string;
  offset: number;
}) {
  if (audioGroup.value.id !== audioId) {
    return;
  }

  const clip_uuid = uuid.v4();
  const newClip = {
    version: 1,
    media_id: dragItem.media_id,
    type: ClipType.AUDIO,
    group: ClipGroup.GLOBAL_AUDIO,
    offset,
    length: dragItem.length,
    name: dragItem.name,
    clip_uuid,
  } as Clip;

  publishClip(newClip, dragItem, offset);

  const oldAudioGroup = audioGroup.value;
  audioGroup.value = {
    ...oldAudioGroup,
    clips: [...oldAudioGroup.clips, newClip],
  };
}

export function toggleAudioMute() {
  const oldAudioGroup = audioGroup.value;
  Queue.publish({
    queueName: QueueNames.TO_ENGINE,
    action: oldAudioGroup?.muted
      ? toEngineActions.UNMUTE
      : toEngineActions.MUTE,
    data: {
      version: 1,
      type: ClipType.AUDIO,
      group: ClipGroup.GLOBAL_AUDIO,
    },
  });

  audioGroup.value = {
    ...oldAudioGroup,
    muted: !oldAudioGroup.muted,
  };
}

export function selectAudioClip(clipId: string) {
  const oldAudioGroup = audioGroup.value;
  audioGroup.value = {
    ...oldAudioGroup,
    clips: [
      ...oldAudioGroup.clips.map((clip) => {
        return {
          ...clip,
          selected: clip.clip_uuid === clipId ? !clip.selected : clip.selected,
        };
      }),
    ],
  };
}

export function deleteAudioClip(clip: Clip) {
  const oldAudioGroup = audioGroup.value;
  audioGroup.value = {
    ...oldAudioGroup,
    clips: [
      ...oldAudioGroup.clips.filter((row) => {
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

export function loadAudioData(item: ClipUI) {
  const existingAudio = audioGroup.value;
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
  existingAudio.clips.push(newItem);
  existingAudio.clips.sort((clipA, clipB) => clipA.offset - clipB.offset);
}
