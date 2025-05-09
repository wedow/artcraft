import { MouseEventHandler } from "react";
// import { useSignalEffect } from "@preact/signals-react";
import { Transition } from "@headlessui/react";
import { toolbarMain } from "./signals/uiAccess/toolbarMain";
import { dispatchers } from "./signals/uiEvents/toolbarMain";

import { ToolbarMain } from "./components/features/ToolbarMain";
import { LoadingBar } from "./components/ui/LoadingBar";

import { ToolbarMainButtonNames } from "./components/features/ToolbarMain/enum";
import { LayoutSignalType } from "./contextSignals/layout";
import { AppUiContextInterface } from "./contextSignals/appUi";
import { twMerge } from "tailwind-merge";
import { paperWrapperStyles } from "./components/styles";
import { dispatchUiEvents } from "./signals/uiEvents";
import { useSignals } from "@preact/signals-react/runtime";

export const SignaledToolbarMain = ({
  // layoutSignal,
  appUiContext,
}: {
  layoutSignal: LayoutSignalType;
  appUiContext: AppUiContextInterface;
}) => {
  useSignals();
  const loadingBar = toolbarMain.loadingBar.signal.value;
  const getButtonDispatcher = (buttonName: ToolbarMainButtonNames) => {
    switch (buttonName) {
      case ToolbarMainButtonNames.ADD_TEXT:
        return () => appUiContext.openEditText();
      case ToolbarMainButtonNames.ADD_IMAGE:
        return () => appUiContext.openAddImage();
      case ToolbarMainButtonNames.ADD_VIDEO:
        return () => appUiContext.openAddVideo();
      case ToolbarMainButtonNames.ADD_CIRCLE:
        return () => dispatchUiEvents.addShapeToEngine({ shape: "circle" });
      case ToolbarMainButtonNames.ADD_TRIANGLE:
        return () => dispatchUiEvents.addShapeToEngine({ shape: "triangle" });
      case ToolbarMainButtonNames.ADD_SQUARE:
        return () => dispatchUiEvents.addShapeToEngine({ shape: "square" });
      case ToolbarMainButtonNames.SELECT:
      case ToolbarMainButtonNames.ERASER:
      case ToolbarMainButtonNames.PAINT:
        return (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          toolbarMain.setMode(buttonName);
          dispatchers[buttonName](e);
        };
      default:
        return dispatchers[buttonName];
    }
  };
  const buttonProps = Object.values(ToolbarMainButtonNames).reduce(
    (acc, buttonName) => {
      acc[buttonName] = {
        disabled: toolbarMain.signal.value.buttonStates[buttonName].disabled,
        active: toolbarMain.signal.value.buttonStates[buttonName].active,
        onClick: getButtonDispatcher(buttonName),
      };
      return acc;
    },
    {} as {
      [key in ToolbarMainButtonNames]: {
        disabled: boolean;
        active: boolean;
        onClick: MouseEventHandler<HTMLButtonElement>;
      };
    },
  );

  const handleOnClickRetry = (e: React.MouseEvent<HTMLButtonElement>) => {
    dispatchers.loadingBarRetry(e);
  };
  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2">
      <Transition
        as="div"
        className={twMerge(
          paperWrapperStyles,
          "absolute left-0 right-0 -m-8 mx-auto w-96 -translate-y-14 items-end p-4",
        )}
        show={loadingBar.isShowing}
      >
        <LoadingBar
          progress={loadingBar.progress}
          message={loadingBar.message}
          status={loadingBar.status}
          onRetry={handleOnClickRetry}
          colReverse
        />
      </Transition>

      <ToolbarMain
        disabled={toolbarMain.signal.value.disabled}
        buttonProps={buttonProps}
      />
    </div>
  );
};
