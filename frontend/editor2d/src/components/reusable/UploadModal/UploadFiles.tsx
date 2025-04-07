import { Button, H6, Input, ListDropdown } from "~/components";
import { FileUploader } from "./FileUploader";
import { useState } from "react";
import {
  THUMBNAILS_FILE_TYPE,
  MediaFileAnimationType,
  FilterEngineCategories,
} from "~/enums";
import { uploadAssets } from "./uploadAssets";
import { UploaderState } from "~/models";

interface Props {
  title: string;
  engineCategory: FilterEngineCategories;
  fileTypes: string[];
  onClose: () => void;
  options?: {
    fileSubtypes?: { [key: string]: string }[];
    hasLength?: boolean;
    hasThumbnailUpload?: boolean;
  };
  onUploadProgress: (newState: UploaderState) => void;
}

export const UploadFiles = ({
  fileTypes,
  engineCategory,
  onClose,
  title,
  options,
  onUploadProgress,
}: Props) => {
  const fileSubtypes = options?.fileSubtypes;
  const hasLength = options?.hasLength;
  const hasThumbnailUpload = options?.hasThumbnailUpload;

  const [typeOption, setTypeOption] = useState<
    MediaFileAnimationType | undefined
  >(
    fileSubtypes
      ? (Object.values(fileSubtypes[0])[0] as MediaFileAnimationType)
      : undefined,
  );
  const [uploadTitle, setUploadTitle] = useState<{
    value: string;
    error?: string;
  }>({
    value: "",
  });

  const [assetFile, setAssetFile] = useState<{
    value: File | null;
    error?: string;
  }>({ value: null });
  const [uploadLength, setUploadLength] = useState<number>();
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const handleSubmit = () => {
    if (!uploadTitle.value) {
      setUploadTitle((curr) => ({
        ...curr,
        error: "Please enter a title.",
      }));
      return;
    }

    if (!assetFile.value) {
      setAssetFile((curr) => ({
        ...curr,
        error: "Please select a file to upload.",
      }));
      return;
    }

    uploadAssets({
      title: uploadTitle.value,
      assetFile: assetFile.value,
      engineCategory: engineCategory,
      animationType: typeOption,
      thumbnailFile: thumbnailFile || undefined,
      length: uploadLength,
      progressCallback: onUploadProgress,
    });
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-4">
        <Input
          placeholder="Enter the title here"
          errorMessage={uploadTitle.error}
          value={uploadTitle.value}
          onChange={(event) => setUploadTitle({ value: event.target.value })}
          className={uploadTitle.error ? "mb-3" : ""}
        />
        {fileSubtypes && fileSubtypes.length > 1 && (
          <ListDropdown
            list={fileSubtypes}
            onSelect={(value) => setTypeOption(value as MediaFileAnimationType)}
          />
        )}
        {hasLength && (
          <Input
            type="number"
            placeholder="Enter the length in ms (optional)"
            value={uploadLength}
            onChange={(event) => setUploadLength(parseInt(event.target.value))}
          />
        )}
        <FileUploader
          title={title}
          fileTypes={fileTypes}
          file={assetFile.value}
          setFile={(file: File | null) => {
            setAssetFile({
              value: file,
            });
          }}
        />
        {assetFile.error && (
          <H6 className="z-10 text-red">{assetFile.error}</H6>
        )}
        {hasThumbnailUpload && (
          <FileUploader
            title="Upload Thumbnail (optional)"
            fileTypes={Object.values(THUMBNAILS_FILE_TYPE)}
            file={thumbnailFile}
            setFile={setThumbnailFile}
          />
        )}
        <div className="flex justify-end gap-4">
          <Button variant="primary" onClick={handleSubmit}>
            Upload
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
};
