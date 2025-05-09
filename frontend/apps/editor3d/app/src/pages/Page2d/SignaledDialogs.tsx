import { useCallback } from "react";
import { Signal } from "@preact/signals-react";
import { dispatchUiEvents } from "./signals/uiEvents";
import {
  DialogAddImage,
  DialogEditText,
  DialogError,
} from "./components/features";
import { AppUiSignalType } from "./contextSignals/appUi";
import { dialogError } from "./signals/uiAccess/dialogError";

export const SignaledDialogs = ({
  appUiSignal,
  resetAll,
}: {
  appUiSignal: Signal<AppUiSignalType>;
  resetAll: () => void;
}) => {
  return (
    <>
      {/* Dialogs that are opened from within Reactland*/}
      <DialogAddImage
        isOpen={appUiSignal.value.isAddImageOpen ?? false}
        stagedImage={appUiSignal.value.stagedImage}
        closeCallback={resetAll}
        onAddImage={(file) => {
          dispatchUiEvents.addImageToEngine(file);
        }}
      />
      <DialogEditText
        isOpen={appUiSignal.value.isEditTextOpen ?? false}
        onDoneEditText={(data) => {
          dispatchUiEvents.addTextToEngine(data);
        }}
        closeCallback={resetAll}
      />
      {/* Dialogs that are opened from the Engine*/}
      <SignaledDialogError />
    </>
  );
};

const SignaledDialogError = () => {
  const props = dialogError.signal.value;
  const { isShowing, title, message } = props;
  const onClose = useCallback(() => {
    dialogError.hide();
  }, []);
  return (
    <DialogError
      isShowing={isShowing}
      title={title}
      message={message}
      onClose={onClose}
    />
  );
};
