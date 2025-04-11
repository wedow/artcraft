import { CharacterTrack, MediaItem } from "~/pages/PageEnigma/models";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
import { characterGroup } from "~/pages/PageEnigma/signals";

export function addCharacter(character: MediaItem) {
  Queue.publish({
    queueName: QueueNames.TO_ENGINE,
    action: toEngineActions.ADD_CHARACTER,
    data: character,
  });
}

export function addNewCharacter(data: MediaItem) {
  const newCharacterGroups = {
    ...characterGroup.value,
    characters: [...characterGroup.value.characters],
  };

  const newCharacter = {
    object_uuid: data.object_uuid,
    name: data.name,
    media_id: data.media_id,
    mediaType: data.media_type,
    animationType: data.maybe_animation_type,
    muted: false,
    minimized: false,
    animationClips: [],
    positionKeyframes: [],
    expressionClips: [],
    lipSyncClips: [],
  } as CharacterTrack;

  newCharacterGroups.characters.push(newCharacter);
  newCharacterGroups.characters.sort((charA, charB) =>
    charA.object_uuid < charB.object_uuid ? -1 : 1,
  );

  characterGroup.value = newCharacterGroups;
}
