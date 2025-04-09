import { useCallback, useRef, useState, useEffect } from "react";
import { signal } from "@preact/signals-react";
import { twMerge } from "tailwind-merge";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

import {
  dialogBackgroundStyles,
  paperWrapperStyles,
  dialogPanelStyles,
} from "~/components/styles";
import { Button } from "~/components/ui";

import {
  QuickTrimVideoUploader,
  TrimData,
  VideoProps,
} from "./QuickTrimVideoUploader";
import { ButtonSubmitAdd } from "./ButtonSumbitAdd";

import { DialogAddMediaStatuses } from "./enums";
import { LoadingScreens } from "./LoadingScreens";

import { ApiResponse } from "~/Classes/ApiManager/ApiManager";
import { MediaFile } from "~/Classes/ApiManager/models/MediaFile";

const initialState = {
  file: null,
  dialogStatus: DialogAddMediaStatuses.STAGING_FILE,
};
export const DialogAddVideo = ({
  stagedVideo = null,
  isOpen,
  closeCallback,
  onUploadedVideo,
}: {
  stagedVideo?: File | null;
  isOpen: boolean;
  closeCallback: () => void;
  onUploadedVideo: (
    videoProperties: {
      width: number;
      height: number;
    },
    response: ApiResponse<MediaFile>,
  ) => void;
}) => {
  const [{ file, dialogStatus }, setStates] = useState<{
    file: File | null;
    dialogStatus: DialogAddMediaStatuses;
  }>(initialState);
  const previouslyStagedVideoRef = useRef<File | null>(null);

  const currFile =
    stagedVideo &&
    stagedVideo !== file &&
    stagedVideo !== previouslyStagedVideoRef.current
      ? stagedVideo
      : file;
  if (previouslyStagedVideoRef.current !== stagedVideo) {
    previouslyStagedVideoRef.current = stagedVideo;
  }

  const trimDataRef = useRef(signal<TrimData | undefined>(undefined));
  const trimData = trimDataRef.current;
  const videoPropsRef = useRef(signal<VideoProps | undefined>(undefined));
  const videoProps = videoPropsRef.current;

  const handleOnUploadedVideo = useCallback(
    (response: ApiResponse<MediaFile>) => {
      if (!videoProps.value) {
        console.error("Video Props not recorded in Uploader Dialog");
        return;
      }
      onUploadedVideo(
        {
          width: videoProps.value.width,
          height: videoProps.value.height,
        },
        response,
      );
    },
    [],
  );

  const handleClose = useCallback(() => {
    closeCallback();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      //this reset the modal on close
      setStates(initialState);
      trimData.value = {
        trimStartMs: 0,
        trimEndMs: 0,
      };
    }
  }, [isOpen]);

  const changeDialogStatus = useCallback(
    (newStatus: DialogAddMediaStatuses) => {
      setStates((curr) => ({ ...curr, dialogStatus: newStatus }));
      if (newStatus === DialogAddMediaStatuses.FILE_RECORD_RECEIVED) {
        setTimeout(handleClose, 1000);
      }
    },
    [],
  );

  return (
    <Dialog open={isOpen} onClose={closeCallback} className="relative z-50">
      <div className={dialogBackgroundStyles}>
        <DialogPanel
          className={twMerge("w-full", file ? "max-w-5xl" : "max-w-2xl")}
        >
          <div className={twMerge(paperWrapperStyles, dialogPanelStyles)}>
            <DialogTitle className="text-3xl font-bold">
              Upload Video
            </DialogTitle>
            {dialogStatus === DialogAddMediaStatuses.STAGING_FILE && (
              <>
                <QuickTrimVideoUploader
                  file={currFile}
                  onFileStaged={(file) => {
                    setStates((curr) => ({ ...curr, file }));
                  }}
                  videoPropsSignal={videoProps}
                  trimDataSignal={trimData}
                  onTrimChange={(newTrimData: TrimData) => {
                    trimData.value = newTrimData;
                  }}
                />
                <span className="grow" />
              </>
            )}
            <LoadingScreens
              currStatus={dialogStatus}
              retryButton={
                <ButtonSubmitAdd
                  file={file}
                  trimData={trimData}
                  onStatusChanged={changeDialogStatus}
                  onUploadedVideo={handleOnUploadedVideo}
                  retry
                />
              }
            />

            <div className="-mt-2 flex w-full justify-end gap-2">
              <Button
                onClick={handleClose}
                variant="secondary"
                disabled={
                  dialogStatus === DialogAddMediaStatuses.FILE_UPLOADING ||
                  dialogStatus === DialogAddMediaStatuses.FILE_RECORD_REQUESTING
                }
              >
                Close
              </Button>
              {dialogStatus === DialogAddMediaStatuses.STAGING_FILE && (
                <ButtonSubmitAdd
                  file={currFile}
                  trimData={trimData}
                  onStatusChanged={changeDialogStatus}
                  onUploadedVideo={handleOnUploadedVideo}
                />
              )}
              {(dialogStatus === DialogAddMediaStatuses.ERROR_FILE_UPLOAD ||
                dialogStatus ===
                  DialogAddMediaStatuses.ERROR_FILE_RECORD_REQUEST) && (
                <Button
                  onClick={() => {
                    setStates(initialState);
                  }}
                >
                  Add Another Video
                </Button>
              )}
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
