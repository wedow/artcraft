import { useCallback, useEffect, useState, useRef } from "react";

import { Button, H6, Input, ListDropdown } from "~/components";
import { FileUploader } from "../UploadModal/FileUploader";
import { loadPreviewOnCanvas, snapshotCanvasAsThumbnail } from "./utilities";
import { upload3DObjects } from "./utilities/upload3DObjects";
import { UploaderState } from "~/models";
import { FilterEngineCategories, MediaFileAnimationType } from "~/enums";

interface Props {
  title: string;
  fileTypes: string[];
  engineCategory: FilterEngineCategories;
  options?: {
    fileSubtypes?: { [key: string]: string }[];
    hasLength?: boolean;
    hasThumbnailUpload?: boolean;
  };
  onClose: () => void;
  onUploadProgress: (newState: UploaderState) => void;
}

export const UploadFiles3D = ({
  title,
  fileTypes,
  engineCategory,
  options,
  onClose,
  onUploadProgress,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | undefined>(undefined);
  const canvasCallbackRef = useCallback((node: HTMLCanvasElement) => {
    if (node !== null) {
      canvasRef.current = node;
    }
  }, []);

  const fileSubtypes = options?.fileSubtypes;
  // const hasLength = options?.hasLength;
  // const hasThumbnailUpload = options?.hasThumbnailUpload;

  const [subtype, setSubtype] = useState<MediaFileAnimationType | undefined>(
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

  const [previewStatus, setPreviewStatus] = useState<{
    type: string;
    message?: string;
  }>({ type: "init" });

  const [thumbnailFile, setThumbnailFile] = useState<Blob | undefined>(
    undefined,
  );

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

    upload3DObjects({
      title: uploadTitle.value,
      assetFile: assetFile.value,
      thumbnailSnapshot: thumbnailFile,
      engineCategory: engineCategory,
      animationType: subtype,
      progressCallback: onUploadProgress,
    });
  };

  useEffect(() => {
    if (canvasRef.current && assetFile.value) {
      loadPreviewOnCanvas({
        file: assetFile.value,
        canvas: canvasRef.current,
        statusCallback: (statusObject: { type: string; message?: string }) => {
          setPreviewStatus(statusObject);
        },
      });
    }
  }, [assetFile.value]);

  useEffect(() => {
    if (previewStatus.type === "OK" && canvasRef.current) {
      snapshotCanvasAsThumbnail({
        targetNode: canvasRef.current!,
        resultCallback: (snapshotBlob) => {
          if (snapshotBlob) {
            setThumbnailFile(snapshotBlob);
          }
        },
      });
    }
  }, [previewStatus]);

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
        {fileSubtypes && fileSubtypes.length > 1 && (
          <ListDropdown
            list={fileSubtypes}
            onSelect={(value) => setSubtype(value as MediaFileAnimationType)}
          />
        )}
        {assetFile.error && (
          <H6 className="z-10 text-red">{assetFile.error}</H6>
        )}

        <div className="relative m-auto aspect-square w-full overflow-hidden rounded-lg bg-brand-secondary">
          <canvas className="h-full w-full" ref={canvasCallbackRef} />
          {!assetFile.value && (
            <H6 className="absolute left-0 top-1/2 -mt-5 w-full text-center">
              File Preview
            </H6>
          )}
          {previewStatus.type.includes("Error") && (
            <>
              <H6 className="absolute left-0 top-1/2 -mt-5 w-full text-center">
                {previewStatus.type}
                {previewStatus.message && <br />}
                {previewStatus.message}
              </H6>
            </>
          )}
        </div>

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
