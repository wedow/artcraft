import { useEffect, useState } from "react";
import { LoadingDots } from "@storyteller/ui-loading";
import { Modal } from "@storyteller/ui-modal";
import { Label } from "@storyteller/ui-label";
import { UploadAssetError, UploadSuccess } from "@storyteller/ui-upload-modal";
import { UploadFiles3D } from "./UploadFiles3D";
import { initialUploaderState, UploaderState } from "~/models";
import { Select } from "@storyteller/ui-select";
import {
  FilterEngineCategories,
  UploaderStates,
  OBJECT_FILE_TYPE,
  CHARACTER_MIXAMO_FILE_TYPE,
  IMAGEPLANE_FILE_TYPE,
} from "~/enums";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

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
  preselectedCategory?: FilterEngineCategories;
  isSelectVisible: boolean;
}

// Map categories to their allowed file types
const categoryFileTypes: Partial<Record<FilterEngineCategories, string[]>> = {
  [FilterEngineCategories.OBJECT]: Object.values(OBJECT_FILE_TYPE),
  [FilterEngineCategories.CHARACTER]: [
    ...Object.values(CHARACTER_MIXAMO_FILE_TYPE),
  ],
  [FilterEngineCategories.IMAGE_PLANE]: Object.values(IMAGEPLANE_FILE_TYPE),
  [FilterEngineCategories.LOCATION]: Object.values(OBJECT_FILE_TYPE),
  [FilterEngineCategories.CREATURE]: Object.values(OBJECT_FILE_TYPE),
};
// Excluded category options for the upload modal
const categoryOptions = Object.entries(FilterEngineCategories)
  .filter(
    ([, value]) =>
      ![
        "audio",
        "video_plane",
        "skybox",
        "set_dressing",
        "expression",
        "animation",
        "scene",
      ].includes(value),
  )
  .sort(([, a], [, b]) => (a === "object" ? -1 : b === "object" ? 1 : 0))
  .map(([key, value]) => ({
    // This is because sets is location i guess - BFlat
    label:
      key === "LOCATION"
        ? "Set"
        : key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, " "),
    value: value,
  }));

export function UploadModal3D({
  isOpen,
  onClose,
  onSuccess,
  title,
  titleIcon,
  options,
  preselectedCategory,
  isSelectVisible,
}: Props & { preselectedCategory?: FilterEngineCategories }) {
  const [uploaderState, setUploaderState] =
    useState<UploaderState>(initialUploaderState);
  const [selectedCategory, setSelectedCategory] =
    useState<FilterEngineCategories>(
      preselectedCategory !== undefined
        ? preselectedCategory
        : FilterEngineCategories.OBJECT,
    );

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
    if (preselectedCategory !== undefined) {
      setSelectedCategory(preselectedCategory);
    }
  }, [preselectedCategory]);

  useEffect(() => {
    console.log("Preselected category:", preselectedCategory);
    console.log("Initial selected category:", selectedCategory);
  }, [preselectedCategory, selectedCategory]);

  useEffect(() => {
    if (uploaderState.status === UploaderStates.success) {
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
            {isSelectVisible && (
              <div className="flex w-full flex-col">
                <Label className="mb-1">Category</Label>
                <Select
                  id="category-select"
                  options={categoryOptions}
                  value={selectedCategory}
                  onChange={(value) => {
                    if (
                      typeof value === "string" &&
                      Object.values(FilterEngineCategories).includes(
                        value as FilterEngineCategories,
                      )
                    ) {
                      setSelectedCategory(value as FilterEngineCategories);
                    }
                  }}
                  placeholder="Select a category"
                />
              </div>
            )}
            <UploadFiles3D
              title={title}
              engineCategory={selectedCategory}
              fileTypes={categoryFileTypes[selectedCategory] || []}
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
