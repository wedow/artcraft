import { Button } from "~/components";
import { faSparkles } from "@fortawesome/pro-solid-svg-icons";
import { useSignals } from "@preact/signals-react/runtime";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
import {
  sidePanelVisible,
  stylizeActiveTab,
  addToQueue,
  promptsStore,
  editorState,
} from "~/pages/PageEnigma/signals";
import { EditorStates } from "~/pages/PageEnigma/enums";

export function StyleButtons() {
  useSignals();

  const switchPreview = async () => {
    addToQueue(promptsStore.textBufferPositive.value);
    Queue.publish({
      queueName: QueueNames.TO_ENGINE,
      action: toEngineActions.ENTER_PREVIEW_STATE,
      data: null,
    });
    stylizeActiveTab.value = "queue";
    sidePanelVisible.value = false;
  };

  const refreshPreview = async () => {
    addToQueue(promptsStore.textBufferPositive.value);
    Queue.publish({
      queueName: QueueNames.TO_ENGINE,
      action: toEngineActions.REFRESH_PREVIEW,
      data: null,
    });
    stylizeActiveTab.value = "queue";
    sidePanelVisible.value = false;
  };

  return (
    <div className="flex w-full flex-col justify-center gap-4">
      <div className="flex w-full flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex w-full text-[13px]">
            <span className="grow opacity-75">Final Resolution:</span>
            <span className="opacity-90">1080 x 1080</span>
          </div>
          <div className="flex w-full text-[13px]">
            <span className="grow opacity-75">Estimated Time:</span>
            <span className="opacity-90">10 - 30s</span>
          </div>
        </div>
        <div className="w-full">
          {/* <Label>Render the camera view with AI</Label> */}
          <Button
            icon={faSparkles}
            variant="primary"
            className="mt-1.5 h-12 w-full"
            onClick={
              editorState.value === EditorStates.PREVIEW
                ? refreshPreview
                : switchPreview
            }
          >
            Generate Image
          </Button>
        </div>
      </div>
    </div>
  );
}
