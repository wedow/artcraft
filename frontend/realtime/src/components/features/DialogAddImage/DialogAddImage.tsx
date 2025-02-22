import { useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

import { FileUploader } from "../FileUploader";
import { Button } from "~/components/ui";

import { IMAGE_FILE_TYPE } from "~/constants/fileTypeEnums";

import {
  paperWrapperStyles,
  dialogBackgroundStyles,
  dialogPanelStyles,
} from "~/components/styles";

export const DialogAddImage = ({
  stagedImage = null,
  isOpen,
  closeCallback,
  onAddImage,
}: {
  stagedImage?: File | null;
  isOpen: boolean;
  closeCallback: () => void;
  onAddImage: (file: File) => void;
}) => {
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const previouslyStagedImageRef = useRef<File | null>(null);

  const currFile =
    stagedImage &&
    stagedImage !== assetFile &&
    stagedImage !== previouslyStagedImageRef.current
      ? stagedImage
      : assetFile;
  if (previouslyStagedImageRef.current !== stagedImage) {
    previouslyStagedImageRef.current = stagedImage;
  }

  function handleClose() {
    setAssetFile(null);
    closeCallback();
  }

  return (
    <Dialog open={isOpen} onClose={closeCallback} className="relative z-50">
      <div className={dialogBackgroundStyles}>
        <DialogPanel
          className={twMerge(
            paperWrapperStyles,
            dialogPanelStyles,
            "w-full max-w-2xl",
          )}
        >
          <DialogTitle className="text-2xl font-bold">Upload Image</DialogTitle>
          <div className="flex flex-col rounded-lg border-2 border-dashed border-ui-border">
            <FileUploader
              title=""
              fileTypes={Object.values(IMAGE_FILE_TYPE)}
              file={currFile}
              setFile={(file: File | null) => {
                setAssetFile(file);
                if (file) {
                  onAddImage(file);
                  handleClose();
                }
              }}
            />
            {currFile && (
              <div
                className="relative flex items-center justify-center bg-ui-border"
                style={{ height: "calc(100vh - 500px)" }}
              >
                <img
                  src={URL.createObjectURL(currFile)}
                  className="max-h-full object-contain"
                />
              </div>
            )}
          </div>
          <div className="flex w-full justify-end gap-2">
            <Button onClick={handleClose} variant="secondary">
              Cancel
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
