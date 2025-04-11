import { Clip, MediaItem } from "~/pages/PageEnigma/models";
import { AssetType } from "~/enums";
import { useEffect, useRef } from "react";
import { ItemElement } from "./ItemElement";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue";
import { fromEngineActions } from "~/pages/PageEnigma/Queue/fromEngineActions";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
import {
  objectWizardItems,
  selectedObjects,
  showList,
} from "~/pages/PageEnigma/Wizard/signals/wizard";
import { useSignals } from "@preact/signals-react/runtime";

export const ObjectList = () => {
  useSignals();
  const addingObject = useRef<MediaItem | null>(null);

  useEffect(() => {
    Queue.subscribe(QueueNames.FROM_ENGINE, "wizard-objects", (message) => {
      switch (message.action) {
        case fromEngineActions.ADD_OBJECT:
          if (addingObject.current) {
            const data = message.data as Clip;
            selectedObjects.value = [
              ...selectedObjects.value,
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
          selectedObjects.value = selectedObjects.value.filter(
            (object) =>
              object.object_uuid !== (message.data as Clip).object_uuid,
          );
          break;
      }
    });
  }, []);

  return (
    <div className="flex h-4/5 flex-wrap gap-4 overflow-y-auto">
      {(objectWizardItems.value ?? []).map((item) => (
        <button
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            addingObject.current = item;
            showList.value = null;
            Queue.publish({
              queueName: QueueNames.TO_ENGINE,
              action: toEngineActions.ADD_OBJECT,
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
