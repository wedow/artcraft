import { useEffect, useState } from "react";

import { TransitionDialogue, LoadingDots } from "~/components";

import { UploadAssetError } from "./UploadAssetError";
import { UploadSuccess } from "./UploadSuccess";
import { UploadFiles } from "./UploadFiles";

import { FilterEngineCategories, UploaderStates } from "~/enums";
import { UploaderState, initialUploaderState } from "~/models";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  isOpen: boolean;
  title: string;
  fileTypes: string[];
  type: FilterEngineCategories;
  options?: {
    fileSubtypes?: { [key: string]: string }[];
    hasLength?: boolean;
    hasThumbnailUpload?: boolean;
  };
}

export function UploadModal({
  isOpen,
  onClose,
  onSuccess,
  title,
  fileTypes,
  type,
  options,
}: Props) {
  const [uploaderState, setUploaderState] =
    useState<UploaderState>(initialUploaderState);

  const updateUploaderState = (newState: UploaderState) => {
    setUploaderState(newState);
  };

  const resetModalState = () => {
    setUploaderState(initialUploaderState);
  };

  useEffect(() => {
    if (isOpen) {
      resetModalState();
    }
  }, [isOpen]);

  const UploaderModalContent = () => {
    switch (uploaderState.status) {
      case UploaderStates.ready:
        return (
          <UploadFiles
            title={title}
            engineCategory={type}
            fileTypes={fileTypes}
            options={options}
            onClose={onClose}
            onUploadProgress={updateUploaderState}
          />
        );
      case UploaderStates.uploadingAsset:
      case UploaderStates.uploadingCover:
      case UploaderStates.settingCover:
        return (
          <>
            <LoadingDots className="mb-1 bg-transparent" />
            <div className="w-100 text-center opacity-50">Uploading...</div>
          </>
        );
      case UploaderStates.success:
        return (
          <UploadSuccess
            title={title}
            onOk={() => {
              onSuccess();
              onClose();
            }}
          />
        );
      case UploaderStates.assetError:
        return (
          <UploadAssetError
            onCancel={onClose}
            onRetry={() => {
              resetModalState();
            }}
            type={type}
            errorMessage={uploaderState.errorMessage}
          />
        );
      case UploaderStates.coverCreateError:
      case UploaderStates.coverSetError:
        return (
          <UploadAssetError
            onCancel={onClose}
            onRetry={() => {
              resetModalState();
            }}
            type={"Thumbnail"}
            errorMessage={uploaderState.errorMessage}
          />
        );
    }
  };

  return (
    <TransitionDialogue isOpen={isOpen} onClose={onClose} title={title}>
      <UploaderModalContent />
    </TransitionDialogue>
  );
}
