import { Clip, Keyframe, MediaItem } from "~/pages/PageEnigma/models";
import { characterGroup } from "~/pages/PageEnigma/signals";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";

export function deleteCharacter(item: MediaItem) {
  characterGroup.value = {
    ...characterGroup.value,
    characters: characterGroup.value.characters.filter(
      (character) => character.object_uuid !== item.object_uuid,
    ),
  };
}

export function deleteCharacterClip(clip: Clip) {
  const oldCharacterGroup = characterGroup.value;
  characterGroup.value = {
    ...oldCharacterGroup,
    characters: oldCharacterGroup.characters.map((character) => ({
      ...character,
      animationClips: character.animationClips.filter((row) => {
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
      lipSyncClips: character.lipSyncClips.filter((row) => {
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
      expressionClips: character.expressionClips.filter((row) => {
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
    })),
  };
}

export function deleteCharacterKeyframe(keyframe: Keyframe) {
  const oldCharacterGroup = characterGroup.value;
  characterGroup.value = {
    ...oldCharacterGroup,
    characters: oldCharacterGroup.characters.map((character) => ({
      ...character,
      positionKeyframes: character.positionKeyframes.filter((row) => {
        if (row.keyframe_uuid === keyframe.keyframe_uuid) {
          Queue.publish({
            queueName: QueueNames.TO_ENGINE,
            action: toEngineActions.DELETE_KEYFRAME,
            data: row,
          });
          return false;
        }
        return true;
      }),
    })),
  };
}
