import {
  CharacterGroup,
  Clip,
  Keyframe,
  MediaItem,
  QueueKeyframe,
} from "~/pages/PageEnigma/models";
import { signal } from "@preact/signals-core";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
import * as uuid from "uuid";
import { ToastTypes, ClipGroup, ClipType } from "~/enums";
import { addToast } from "~/signals";
// import { filmLength } from "~/pages/PageEnigma/signals";
import { publishClip } from "~/pages/PageEnigma/signals/utils/publishClip";

export const characterGroup = signal<CharacterGroup>({
  id: "CG1",
  characters: [],
});

export function addCharacterAnimation({
  dragItem,
  characterId,
  offset,
}: {
  dragItem: MediaItem;
  characterId: string;
  offset: number;
}) {
  const clip_uuid = uuid.v4();
  const newClip = {
    version: 1,
    media_id: dragItem.media_id,
    group: ClipGroup.CHARACTER,
    type: ClipType.ANIMATION,
    offset,
    length: dragItem.length,
    clip_uuid,
    name: dragItem.name,
    object_uuid: characterId,
  } as Clip;

  const oldCharacterGroup = characterGroup.value;
  characterGroup.value = {
    ...oldCharacterGroup,
    characters: oldCharacterGroup.characters.map((character) => {
      if (character.object_uuid !== characterId) {
        return { ...character };
      }

      publishClip(newClip, dragItem, offset);

      return {
        ...character,
        animationClips: [...character.animationClips, newClip].sort(
          (clipA, clipB) => clipA.offset - clipB.offset,
        ),
      };
    }),
  };
}

export function addCharacterExpression({
  dragItem,
  characterId,
  offset,
}: {
  dragItem: MediaItem;
  characterId: string;
  offset: number;
}) {
  const clip_uuid = uuid.v4();
  const newClip = {
    version: 1,
    media_id: dragItem.media_id,
    group: ClipGroup.CHARACTER,
    type: ClipType.EXPRESSION,
    offset,
    length: dragItem.length,
    clip_uuid,
    name: dragItem.name,
    object_uuid: characterId,
  } as Clip;

  const oldCharacterGroup = characterGroup.value;
  characterGroup.value = {
    ...oldCharacterGroup,
    characters: oldCharacterGroup.characters.map((character) => {
      if (character.object_uuid !== characterId) {
        return { ...character };
      }

      publishClip(newClip, dragItem, offset);

      return {
        ...character,
        expressionClips: [...character.expressionClips, newClip].sort(
          (clipA, clipB) => clipA.offset - clipB.offset,
        ),
      };
    }),
  };
}

export function addCharacterAudio({
  dragItem,
  characterId,
  offset,
}: {
  dragItem: MediaItem;
  characterId: string;
  offset: number;
}) {
  const clip_uuid = uuid.v4();
  const newClip = {
    version: 1,
    media_id: dragItem.media_id,
    group: ClipGroup.CHARACTER,
    type: ClipType.AUDIO,
    offset,
    length: dragItem.length ?? 60,
    clip_uuid,
    object_uuid: characterId,
    name: dragItem.name,
  } as Clip;

  const oldCharacterGroup = characterGroup.value;
  characterGroup.value = {
    ...oldCharacterGroup,
    characters: oldCharacterGroup.characters.map((character) => {
      if (character.object_uuid !== characterId) {
        return { ...character };
      }

      publishClip(newClip, dragItem, offset);

      return {
        ...character,
        lipSyncClips: [...character.lipSyncClips, newClip].sort(
          (clipA, clipB) => clipA.offset - clipB.offset,
        ),
      };
    }),
  };
}

export function addCharacterKeyframe(keyframe: QueueKeyframe, offset: number) {
  const oldCharacterGroup = characterGroup.value;

  if (
    oldCharacterGroup.characters.some((characterTrack) => {
      if (characterTrack.object_uuid !== keyframe.object_uuid) {
        return;
      }
      return characterTrack.positionKeyframes.some(
        (row) => row.offset === offset,
      );
    })
  ) {
    addToast(
      ToastTypes.WARNING,
      "There can only be one keyframe at this offset.",
    );
    return;
  }

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

  characterGroup.value = {
    ...oldCharacterGroup,
    characters: oldCharacterGroup.characters.map((character) => {
      if (character.object_uuid !== keyframe.object_uuid) {
        return { ...character };
      }

      Queue.publish({
        queueName: QueueNames.TO_ENGINE,
        action: toEngineActions.ADD_KEYFRAME,
        data: newKeyframe,
      });

      return {
        ...character,
        positionKeyframes: [...character.positionKeyframes, newKeyframe].sort(
          (clipA, clipB) => clipA.offset - clipB.offset,
        ),
      };
    }),
  };
}

export function toggleLipSyncMute(characterId: string) {
  const oldCharacterGroup = characterGroup.value;
  characterGroup.value = {
    ...oldCharacterGroup,
    characters: oldCharacterGroup.characters.map((character) => {
      if (character.object_uuid === characterId) {
        Queue.publish({
          queueName: QueueNames.TO_ENGINE,
          action: character?.muted
            ? toEngineActions.UNMUTE
            : toEngineActions.MUTE,
          data: {
            version: 1,
            type: ClipType.AUDIO,
            group: ClipGroup.CHARACTER,
            object_uuid: characterId,
          },
        });
      }

      return {
        ...character,
        muted:
          character.object_uuid === characterId
            ? !character.muted
            : character.muted,
      };
    }),
  };
}

export function toggleCharacterMinimized(characterId: string) {
  const oldCharacterGroup = characterGroup.value;
  characterGroup.value = {
    ...oldCharacterGroup,
    characters: oldCharacterGroup.characters.map((character) => {
      return {
        ...character,
        minimized:
          character.object_uuid === characterId
            ? !character.minimized
            : character.minimized,
      };
    }),
  };
}

export function selectCharacterClip(clipId: string) {
  const oldCharacterGroup = characterGroup.value;
  characterGroup.value = {
    ...oldCharacterGroup,
    characters: oldCharacterGroup.characters.map((character) => ({
      ...character,
      animationClips: character.animationClips.map((clip) => ({
        ...clip,
        selected: clip.clip_uuid === clipId ? !clip.selected : clip.selected,
      })),
      positionClips: character.positionKeyframes.map((keyframe) => ({
        ...keyframe,
        selected:
          keyframe.keyframe_uuid === clipId
            ? !keyframe.selected
            : keyframe.selected,
      })),
      lipSyncClips: character.lipSyncClips.map((clip) => ({
        ...clip,
        selected: clip.clip_uuid === clipId ? !clip.selected : clip.selected,
      })),
    })),
  };
}
