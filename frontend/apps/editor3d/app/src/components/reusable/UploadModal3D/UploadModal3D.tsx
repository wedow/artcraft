import { useEffect, useState } from "react";
import { LoadingDots } from "@storyteller/ui-loading";
import { Modal } from "@storyteller/ui-modal";
import { UploadAssetError, UploadSuccess } from "@storyteller/ui-upload-modal";
import { UploadFiles3D } from "./UploadFiles3D";
import { initialUploaderState, UploaderState } from "../../../models";
import {
  FilterEngineCategories,
  UploaderStates,
  OBJECT_FILE_TYPE,
} from "../../../enums";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  galleryModalVisibleViewMode,
  galleryModalVisibleDuringDrag,
} from "@storyteller/ui-gallery-modal";

interface Props {
  onClose: () => void;
  onSuccess: (category: FilterEngineCategories) => void;
  isOpen: boolean;
  title: string;
  titleIcon: IconDefinition;
  options?: {
    fileSubtypes?: { [key: string]: string }[];
    hasLength?: boolean;
    hasThumbnailUpload?: boolean;
  };
}

const objectFileTypes = Object.values(OBJECT_FILE_TYPE);

export function UploadModal3D(props: Props) {
  const { isOpen, onClose, onSuccess, title, titleIcon, options } = props;
  const [uploaderState, setUploaderState] =
    useState<UploaderState>(initialUploaderState);

  // Category fixed to OBJECT
  const selectedCategory = FilterEngineCategories.OBJECT;

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

  useEffect(() => {
    if (uploaderState.status === UploaderStates.success) {
      // Automatically open the global Gallery modal after a successful upload
      galleryModalVisibleViewMode.value = true;
      galleryModalVisibleDuringDrag.value = true;

      onSuccess(selectedCategory);
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploaderState.status]);

  const UploaderModalContent = () => {
    switch (uploaderState.status) {
      case UploaderStates.ready:
        return (
          <div className="space-y-4">
            <UploadFiles3D
              title={title}
              engineCategory={selectedCategory}
              fileTypes={objectFileTypes}
              options={options}
              onClose={onClose}
              onUploadProgress={updateUploaderState}
            />
          </div>
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
      case UploaderStates.success: {
        return (
          <UploadSuccess
            title="3D model"
            onOk={() => {
              onClose();
              onSuccess(selectedCategory);
            }}
          />
        );
      }
      case UploaderStates.assetError:
        return (
          <UploadAssetError
            onCancel={onClose}
            onRetry={() => {
              resetModalState();
            }}
            type={selectedCategory}
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
    return undefined;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      titleIcon={titleIcon}
      title={title}
      className="max-w-xl"
      showClose={true}
    >
      <UploaderModalContent />
    </Modal>
  );
}
