import { useRef, useState } from "react";
import { DialogTitle } from "@headlessui/react";

// TODO Port the file uploader to the new ui library
import { FileUploader } from "../../../components/reusable/FileUploader";
import { Button } from "@storyteller/ui-button";

import { IMAGE_FILE_TYPE } from "../../../constants/fileTypeEnums";
import { Modal } from "@storyteller/ui-modal";

export const DialogAddImage = ({
  stagedImage = null,
  isOpen,
  closeCallback,
  onAddImage,
  isProcessing = false,
}: {
  stagedImage?: File | null;
  isOpen: boolean;
  closeCallback: () => void;
  onAddImage: (file: File) => void;
  isProcessing?: boolean;
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

  // Show dialog if no image is set (currFile is null) and not processing
  const shouldShowDialog = isOpen && (!currFile || !isProcessing);

  return (
    <Modal isOpen={shouldShowDialog} onClose={closeCallback}>
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold">Upload Image</h1>
        <div className="flex flex-col rounded-lg border-2 border-dashed border-white/20">
          <FileUploader
            fileTypes={Object.values(IMAGE_FILE_TYPE)}
            file={currFile ?? undefined}
            handleChange={(file: File) => {
              setAssetFile(file);
              if (file) {
                onAddImage(file);
                handleClose();
              }
            }}
          />
          {currFile && (
            <div
              className="bg-ui-border relative flex items-center justify-center"
              style={{ height: "calc(100vh - 500px)" }}
            >
              <img
                src={URL.createObjectURL(currFile)}
                className="max-h-full object-contain"
                alt="upload img"
              />
            </div>
          )}
        </div>
        <div className="flex w-full justify-end gap-2">
          <Button onClick={handleClose} variant="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};
