import { MouseEventHandler } from "react";
import { Transition } from "@headlessui/react";

import { ToolbarVideoExtraction } from "~/components/features/ToolbarVideoExtraction";
import { ToolbarVideoExtractionButtonNames } from "~/components/features/ToolbarVideoExtraction/enums";
import { toolbarVideoExtraction } from "~/signals/uiAccess/toolbarVideoExtraction";
import { dispatchers } from "~/signals/uiEvents/toolbarVideoExtraction";
import { LoadingBarStatus } from "~/components/ui";

export const SignaledToolbarVideoExtraction = () => {
  const getButtonDispatcher = (
    buttonName: ToolbarVideoExtractionButtonNames,
  ) => {
    return dispatchers[buttonName];
  };

  const buttonProps = Object.values(ToolbarVideoExtractionButtonNames).reduce(
    (acc, buttonName) => {
      acc[buttonName] = {
        disabled:
          toolbarVideoExtraction.signal.value.buttonStates[buttonName].disabled,
        active:
          toolbarVideoExtraction.signal.value.buttonStates[buttonName].active,
        onClick: getButtonDispatcher(buttonName),
      };
      return acc;
    },
    {} as {
      [key in ToolbarVideoExtractionButtonNames]: {
        disabled: boolean;
        active: boolean;
        onClick: MouseEventHandler<HTMLButtonElement>;
      };
    },
  );

  const { progress, message } =
    toolbarVideoExtraction.signal.value.loadingBarState;
  const loadingBarProps = {
    progress: progress,
    message: message,
    status: progress === 100 ? LoadingBarStatus.IDLE : LoadingBarStatus.LOADING,
  };
  return (
    <Transition
      as="div"
      className="fixed bottom-24 left-1/2 -translate-x-1/2"
      show={toolbarVideoExtraction.signal.value.isShowing}
    >
      <ToolbarVideoExtraction
        readyToSubmit={toolbarVideoExtraction.signal.value.ready}
        extractionMode={toolbarVideoExtraction.signal.value.mode}
        disabled={toolbarVideoExtraction.signal.value.disabled}
        buttonsProps={buttonProps}
        loadingBarProps={loadingBarProps}
      />
    </Transition>
  );
};
