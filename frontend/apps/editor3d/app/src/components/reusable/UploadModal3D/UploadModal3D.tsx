import { useEffect, useState } from "react";

import {
  TransitionDialogue,
  LoadingDots,
  Label,
  CloseButton,
} from "~/components";

import { UploadAssetError } from "../UploadModal/UploadAssetError";
import { UploadSuccess } from "../UploadModal/UploadSuccess";
import { UploadFiles3D } from "./UploadFiles3D";
import { initialUploaderState, UploaderState } from "~/models";
import { Select } from "../Select";
import {
  FilterEngineCategories,
  UploaderStates,
  OBJECT_FILE_TYPE,
  CHARACTER_MIXAMO_FILE_TYPE,
  IMAGEPLANE_FILE_TYPE,
} from "~/enums";
import { assetModalVisible } from "~/pages/PageEnigma/signals";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  isOpen: boolean;
  title: string;
  options?: {
    fileSubtypes?: { [key: string]: string }[];
    hasLength?: boolean;
    hasThumbnailUpload?: boolean;
  };
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

// Map engine categories to asset modal tabs
const categoryToAssetTab: Partial<Record<FilterEngineCategories, string>> = {
  [FilterEngineCategories.OBJECT]: "objects",
  [FilterEngineCategories.CHARACTER]: "character",
  [FilterEngineCategories.IMAGE_PLANE]: "image-planes",
  [FilterEngineCategories.LOCATION]: "sets",
  [FilterEngineCategories.CREATURE]: "creatures",
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
  options,
}: Props) {
  const [uploaderState, setUploaderState] =
    useState<UploaderState>(initialUploaderState);
  const [selectedCategory, setSelectedCategory] =
    useState<FilterEngineCategories>(FilterEngineCategories.OBJECT);

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
          <div className="space-y-4">
            <div className="flex w-full flex-col">
              <Label>Category</Label>
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
      case UploaderStates.success:
        return (
          <UploadSuccess
            title="3D model"
            onOk={() => {
              onSuccess();
              onClose();
              // Store the selected category and tab in sessionStorage
              const assetTab = categoryToAssetTab[selectedCategory];
              if (assetTab) {
                sessionStorage.setItem(
                  "lastUploadedCategory",
                  selectedCategory,
                );
                sessionStorage.setItem("lastUploadedTab", assetTab);
                // Reopen the asset modal
                assetModalVisible.value = true;
              } else {
                // Clear any existing stored values if we don't have a valid tab
                sessionStorage.removeItem("lastUploadedCategory");
                sessionStorage.removeItem("lastUploadedTab");
              }
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
    <TransitionDialogue
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className="max-w-xl"
      showClose={false}
    >
      <CloseButton className="absolute right-4 top-4" onClick={onClose} />
      <UploaderModalContent />
    </TransitionDialogue>
  );
}
