import { Label } from "~/components";
import { Button } from "@storyteller/ui-button";
import {
  faArrowsRotate,
  faChevronLeft,
} from "@fortawesome/pro-solid-svg-icons";
import { editorState, previewSrc } from "~/pages/PageEnigma/signals/engine";
import { EditorStates } from "~/pages/PageEnigma/enums";
import { useSignals } from "@preact/signals-react/runtime";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
import { StyleStrength } from "~/pages/PageEnigma/comps/SidePanelTabs/tabComps/StylizeTab/StyleStrength";
import { StyleOptions } from "~/pages/PageEnigma/comps/SidePanelTabs/tabComps/StylizeTab/StyleOptions";
export function StyleButtons() {
  useSignals();

  const switchPreview = async () => {
    if (editorState.value === EditorStates.EDIT) {
      Queue.publish({
        queueName: QueueNames.TO_ENGINE,
        action: toEngineActions.ENTER_EDIT_STATE,
        data: null,
      });
    }
    Queue.publish({
      queueName: QueueNames.TO_ENGINE,
      action: toEngineActions.ENTER_PREVIEW_STATE,
      data: null,
    });
  };

  const switchEdit = async () => {
    Queue.publish({
      queueName: QueueNames.TO_ENGINE,
      action: toEngineActions.ENTER_EDIT_STATE,
      data: null,
    });
  };

  const refreshPreview = async () => {
    Queue.publish({
      queueName: QueueNames.TO_ENGINE,
      action: toEngineActions.REFRESH_PREVIEW,
      data: null,
    });
  };

  return (
    <div className="flex w-full flex-col justify-center gap-4 rounded-b-lg bg-ui-panel">
      <div className="flex w-full flex-col gap-3">
        <div className="w-full">
          <Label>Render the camera view with AI</Label>
          <div className="mb-2 text-xs text-white/70">
            (This helps you test and re-test your scene)
          </div>
          {editorState.value !== EditorStates.PREVIEW && (
            <>
              <Button
                icon={faArrowsRotate}
                variant="action"
                className="mt-1.5 w-full"
                onClick={switchPreview}
              >
                Preview Frame
              </Button>
            </>
          )}
          {editorState.value === EditorStates.PREVIEW && (
            <div className="flex gap-2">
              <Button
                icon={faChevronLeft}
                variant="action"
                onClick={switchEdit}
              >
                Back
              </Button>
              <Button
                icon={faArrowsRotate}
                variant="primary"
                onClick={refreshPreview}
                className="grow"
                loading={previewSrc.value === ""}
              >
                {previewSrc.value === "" ? "Rendering..." : "Re-render Preview"}
              </Button>
            </div>
          )}
        </div>
        <StyleOptions />
        <StyleStrength />
      </div>
    </div>
  );
}
