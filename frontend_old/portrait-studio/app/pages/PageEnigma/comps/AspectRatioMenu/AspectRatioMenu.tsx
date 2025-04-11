import { useSignals } from "@preact/signals-react/runtime";
import {
  faChevronLeft,
  faRectangle,
  faRectangleVertical,
  faSquare,
} from "@fortawesome/pro-solid-svg-icons";
import { CameraAspectRatio, EditorStates } from "~/pages/PageEnigma/enums";
import {
  cameraAspectRatio,
  editorState,
  previewSrc,
} from "~/pages/PageEnigma/signals";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
import { Button, ButtonDropdown } from "~/components";

export const AspectRatioMenu = () => {
  useSignals();
  const buttonIcon =
    cameraAspectRatio.value === CameraAspectRatio.HORIZONTAL_16_9
      ? faRectangle
      : cameraAspectRatio.value === CameraAspectRatio.VERTICAL_9_16
        ? faRectangleVertical
        : faSquare;
  const buttonText =
    cameraAspectRatio.value === CameraAspectRatio.HORIZONTAL_16_9
      ? "16:9 Horizontal"
      : cameraAspectRatio.value === CameraAspectRatio.VERTICAL_9_16
        ? "9:16 Vertical"
        : "1:1 Square";

  const handleChangeAspectRatio = (newRatio: CameraAspectRatio) => {
    Queue.publish({
      queueName: QueueNames.TO_ENGINE,
      action: toEngineActions.CHANGE_CAMERA_ASPECT_RATIO,
      data: newRatio,
    });
  };

  const switchEdit = async () => {
    editorState.value = EditorStates.EDIT;
    Queue.publish({
      queueName: QueueNames.TO_ENGINE,
      action: toEngineActions.ENTER_EDIT_STATE,
      data: null,
    });
  };

  return (
    <div className="absolute right-0 top-0 m-2 flex items-end gap-1.5">
      <ButtonDropdown
        label={`${buttonText}`}
        className="shadow-xl"
        icon={buttonIcon}
        align="right"
        showSelected={true}
        options={[
          {
            label: "16:9",
            icon: faRectangle,
            className: "pl-4",
            description: "Horizontal",
            selected:
              cameraAspectRatio.value === CameraAspectRatio.HORIZONTAL_16_9,
            onClick: () =>
              handleChangeAspectRatio(CameraAspectRatio.HORIZONTAL_16_9),
          },
          {
            label: "9:16",
            icon: faRectangleVertical,
            className: "pl-4",
            description: "Vertical",
            selected:
              cameraAspectRatio.value === CameraAspectRatio.VERTICAL_9_16,
            onClick: () =>
              handleChangeAspectRatio(CameraAspectRatio.VERTICAL_9_16),
          },
          {
            label: "1:1",
            icon: faSquare,
            className: "pl-4",
            description: "Square",
            selected: cameraAspectRatio.value === CameraAspectRatio.SQUARE_1_1,
            onClick: () =>
              handleChangeAspectRatio(CameraAspectRatio.SQUARE_1_1),
          },
        ]}
      />

      {editorState.value === EditorStates.PREVIEW && (
        <Button icon={faChevronLeft} variant="primary" onClick={switchEdit}>
          Back to Edit
        </Button>
      )}
    </div>
  );
};
