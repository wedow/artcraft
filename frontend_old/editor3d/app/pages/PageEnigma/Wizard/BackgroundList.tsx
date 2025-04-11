import { useContext } from "react";
import { ItemElement } from "./ItemElement";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
import { objectGroup } from "~/pages/PageEnigma/signals";
import { EngineContext } from "~/pages/PageEnigma/contexts/EngineContext";
import {
  backgroundWizardItems,
  selectedBackground,
} from "~/pages/PageEnigma/Wizard/signals/wizard";
import { useSignals } from "@preact/signals-react/runtime";

interface Props {
  onClose: () => void;
}

export const BackgroundList = ({ onClose }: Props) => {
  useSignals();
  const editorEngine = useContext(EngineContext);

  return (
    <div className="flex h-4/5 flex-wrap gap-4 overflow-y-auto">
      {(backgroundWizardItems.value ?? []).map((item) => (
        <button
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const existingBackground = objectGroup.value.objects.find(
              (object) => object.name === selectedBackground.value?.name,
            );
            if (existingBackground) {
              editorEngine?.deleteObject(existingBackground?.object_uuid ?? "");
            }

            selectedBackground.value = item;
            Queue.publish({
              queueName: QueueNames.TO_ENGINE,
              action: toEngineActions.ADD_OBJECT,
              data: item,
            });
            onClose();
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
