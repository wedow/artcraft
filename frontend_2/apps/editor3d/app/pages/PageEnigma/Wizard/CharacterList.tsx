import { Clip, MediaItem } from "~/pages/PageEnigma/models";
import { useEffect, useRef } from "react";
import { ItemElement } from "./ItemElement";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue";
import { fromEngineActions } from "~/pages/PageEnigma/Queue/fromEngineActions";
import { AssetType } from "~/enums";
import {
  characterWizardItems,
  selectedCharacters,
  showList,
} from "~/pages/PageEnigma/Wizard/signals/wizard";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
import { useSignals } from "@preact/signals-react/runtime";

export const CharacterList = () => {
  useSignals();
  const addingObject = useRef<MediaItem | null>(null);

  useEffect(() => {
    Queue.subscribe(QueueNames.FROM_ENGINE, "wizard-character", (message) => {
      switch (message.action) {
        case fromEngineActions.UPDATE_CHARACTER_ID:
          if (addingObject.current) {
            const data = message.data as Clip;
            selectedCharacters.value = [
              ...selectedCharacters.value,
              {
                ...addingObject.current,
                version: data.version,
                type: data.type.toString() as AssetType,
                media_id: data.media_id,
                name: data.name,
                object_uuid: data.object_uuid,
              },
            ];
          }
          break;
        case fromEngineActions.DELETE_OBJECT:
          selectedCharacters.value = selectedCharacters.value.filter(
            (object) =>
              object.object_uuid !== (message.data as Clip).object_uuid,
          );
          break;
      }
    });
  }, []);

  return (
    <div className="flex h-4/5 flex-wrap gap-4 overflow-y-auto">
      {(characterWizardItems.value ?? []).map((item) => (
        <button
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            addingObject.current = item;
            showList.value = null;
            Queue.publish({
              queueName: QueueNames.TO_ENGINE,
              action: toEngineActions.ADD_CHARACTER,
              data: item,
            });
          }}
          key={item.object_uuid}
          className="w-[144px]"
        >
          <ItemElement item={item} />
        </button>
      ))}
    </div>
  );
};
