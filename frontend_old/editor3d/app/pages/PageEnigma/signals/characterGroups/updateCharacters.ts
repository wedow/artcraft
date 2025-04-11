import { ClipType } from "~/enums";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
import { characterGroup } from "~/pages/PageEnigma/signals";

export function updateCharacters({
  type,
  id,
  offset,
  length,
}: {
  type: ClipType;
  id: string;
  length?: number;
  offset: number;
}) {
  const oldCharacterGroup = characterGroup.value;
  if (type === ClipType.ANIMATION) {
    characterGroup.value = {
      ...oldCharacterGroup,
      characters: oldCharacterGroup.characters.map((character) => {
        const newAnimationClips = [...character.animationClips];
        const clipIndex = newAnimationClips.findIndex(
          (row) => row.clip_uuid === id,
        );
        if (clipIndex === -1) {
          return { ...character };
        }
        const clip = newAnimationClips[clipIndex];
        clip.offset = offset;
        clip.length = length!;

        Queue.publish({
          queueName: QueueNames.TO_ENGINE,
          action: toEngineActions.UPDATE_CLIP,
          data: clip,
        });

        return {
          ...character,
          animationClips: newAnimationClips,
        };
      }),
    };
  }

  if (type === ClipType.EXPRESSION) {
    characterGroup.value = {
      ...oldCharacterGroup,
      characters: oldCharacterGroup.characters.map((character) => {
        const newExpressionClips = [...character.expressionClips];
        const clipIndex = newExpressionClips.findIndex(
          (row) => row.clip_uuid === id,
        );
        if (clipIndex === -1) {
          return { ...character };
        }
        const clip = newExpressionClips[clipIndex];
        clip.offset = offset;
        clip.length = length!;

        Queue.publish({
          queueName: QueueNames.TO_ENGINE,
          action: toEngineActions.UPDATE_CLIP,
          data: clip,
        });

        return {
          ...character,
          expressionClips: newExpressionClips,
        };
      }),
    };
  }

  if (type === ClipType.TRANSFORM) {
    characterGroup.value = {
      ...oldCharacterGroup,
      characters: oldCharacterGroup.characters.map((character) => {
        const newPositionKeyframes = [...character.positionKeyframes];
        const keyframeIndex = newPositionKeyframes.findIndex(
          (row) => row.keyframe_uuid === id,
        );
        if (keyframeIndex === -1) {
          return { ...character };
        }
        const keyframe = newPositionKeyframes[keyframeIndex];
        keyframe.offset = offset;

        Queue.publish({
          queueName: QueueNames.TO_ENGINE,
          action: toEngineActions.UPDATE_KEYFRAME,
          data: keyframe,
        });

        return {
          ...character,
          positionKeyframes: newPositionKeyframes,
        };
      }),
    };
  }
  if (type === ClipType.AUDIO) {
    characterGroup.value = {
      ...oldCharacterGroup,
      characters: oldCharacterGroup.characters.map((character) => {
        const newLipSyncClips = [...character.lipSyncClips];
        const clipIndex = newLipSyncClips.findIndex(
          (row) => row.clip_uuid === id,
        );
        if (clipIndex === -1) {
          return { ...character };
        }
        const clip = newLipSyncClips[clipIndex];
        clip.offset = offset;
        clip.length = length!;

        Queue.publish({
          queueName: QueueNames.TO_ENGINE,
          action: toEngineActions.UPDATE_CLIP,
          data: clip,
        });

        return {
          ...character,
          lipSyncClips: newLipSyncClips,
        };
      }),
    };
  }
}
