import { useCallback } from "react";
import { Signal } from "@preact/signals-react";
import { dispatchUiEvents } from "~/signals";
import {
  DialogAddImage,
  DialogAddVideo,
  DialogAiStylize,
  DialogChromakey,
  DialogEditText,
  DialogError,
} from "~/components/features";

import { AppUiSignalType } from "./contextSignals/appUi";
import { dialogError } from "~/signals/uiAccess/dialogError";
import { dialogChromakey } from "~/signals/uiAccess/dialogChromakey";

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
      <DialogAddVideo
        isOpen={appUiSignal.value.isAddVideoOpen ?? false}
        stagedVideo={appUiSignal.value.stagedVideo}
        closeCallback={resetAll}
        onUploadedVideo={(videoProps, response) => {
          if (!response.data) {
            return;
          }
          dispatchUiEvents.addVideoToEngine({
            mediaFileToken: response.data.token,
            mediaFileUrl: response.data.media_links.cdn_url,
            videoWidth: videoProps.width,
            videoHeight: videoProps.height,
          });
        }}
      />
      <DialogAiStylize
        isOpen={appUiSignal.value.isAiStylizeOpen ?? false}
        onRequestAIStylize={(data) => {
          const { selectedArtStyle: artstyle, ...rest } = data;
          dispatchUiEvents.aiStylize.dispatchRequest({
            artstyle,
            ...rest,
          });
        }}
        closeCallback={resetAll}
      />
      <DialogEditText
        isOpen={appUiSignal.value.isEditTextOpen ?? false}
        onDoneEditText={(data) => {
          dispatchUiEvents.addTextToEngine(data);
        }}
        closeCallback={resetAll}
      />
      {/* Dialogs that are opened from the Engine*/}
      <SignaledDialogChromakey />
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

const SignaledDialogChromakey = () => {
  const props = dialogChromakey.signal.value;
  const { isShowing, chromakeyProps } = props;
  const onClose = useCallback(() => {
    dialogChromakey.hide();
  }, []);
  const onConfirm = (newProps: typeof chromakeyProps) => {
    dispatchUiEvents.dispatchChromakeyRequest(newProps);
  };
  return (
    <DialogChromakey
      isShowing={isShowing}
      {...chromakeyProps}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
};
