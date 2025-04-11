import { useCallback, useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import { v4 as uuidv4 } from "uuid";
import {
  faCheck,
  faCircleXmark,
  faFileArrowUp,
  faFileAudio,
  faSpinnerThird,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Button, ButtonIcon, P, Tooltip, WaveformPlayer } from "~/components";
import { MediaUploadApi } from "~/Classes/ApiManager";
import { getFileName } from "~/utilities";
import { AUDIO_FILE_TYPE, ToastTypes } from "~/enums";
import { addToast } from "~/signals";
const FILE_TYPES = Object.keys(AUDIO_FILE_TYPE);

interface Props {
  onFileStaged?: (file: File) => void;
  onClear?: () => void;
  onFileUploaded: (token: string) => void;
}

export const UploadAudioComponent = ({
  onFileStaged,
  onClear,
  onFileUploaded,
}: Props) => {
  const [{ file, uploadState }, setState] = useState<{
    file: File | undefined;
    uploadState: "none" | "staged" | "uploading" | "uploaded" | "error";
  }>({
    file: undefined,
    uploadState: "none",
  });

  const audioUrl = file ? URL.createObjectURL(file) : "";

  const handleChange = (file: File) => {
    setState((curr) => ({
      ...curr,
      file: file,
      uploadState: "staged",
    }));
    if (onFileStaged) {
      onFileStaged(file);
    }
  };

  const handleClear = () => {
    setState((curr) => ({
      ...curr,
      file: undefined,
      uploadState: "none",
      uploadToken: undefined,
    }));
    if (onClear) {
      onClear();
    }
  };

  const handleUploadFile = useCallback(
    async (file: File) => {
      setState((curr) => ({ ...curr, uploadState: "uploading" }));

      const mediaUploadApi = new MediaUploadApi();
      const request = {
        blob: file,
        fileName: getFileName(file),
        uuid: uuidv4(),
        maybe_title: getFileName(file),
      };
      const response = await mediaUploadApi.UploadAudio(request);
      if (response.success && response.data) {
        setState((curr) => ({
          ...curr,
          uploadState: "uploaded",
        }));
        onFileUploaded(response.data);
        return;
      }
      //handle errors
      addToast(
        ToastTypes.ERROR,
        response.errorMessage || "Unknown Error: Upload Audio",
      );
      setState((curr) => ({
        ...curr,
        uploadState: "staged",
      }));
    },
    [onFileUploaded],
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Usage refer to https://github.com/KarimMokhtar/react-drag-drop-files */}
      <FileUploader
        handleChange={handleChange}
        name="file"
        types={FILE_TYPES}
        maxSize={50}
      >
        <DragAndDropZone file={file} />
      </FileUploader>

      {file && (
        <>
          <div className="flex items-center gap-3 rounded-lg bg-brand-secondary p-3">
            <div className="grow">
              <WaveformPlayer audio={audioUrl} hasPlayButton />
            </div>
            <Tooltip content="Remove" position="top">
              <ButtonIcon
                icon={faXmark}
                onClick={handleClear}
                className="h-auto w-auto bg-transparent p-0 text-xl opacity-60 hover:bg-transparent hover:opacity-90"
              />
            </Tooltip>
          </div>
          <div className="flex gap-2">
            <Button
              className="w-full py-2.5"
              variant="action"
              onClick={() => {
                if (!file) {
                  //TODO: Maybe more verbose on not having file
                  return false;
                }
                handleUploadFile(file);
              }}
              disabled={uploadState !== "staged"}
              icon={
                uploadState === "uploaded"
                  ? faCheck
                  : uploadState === "error"
                    ? faCircleXmark
                    : faFileArrowUp
              }
            >
              {uploadState === "uploaded"
                ? "Uploaded"
                : uploadState === "error"
                  ? "Upload Error"
                  : "Upload Audio"}
              {uploadState === "uploading" && (
                <FontAwesomeIcon icon={faSpinnerThird} spin />
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

const DragAndDropZone = ({ file }: { file: File | undefined }) => {
  const fileSize =
    file && file.size >= 1024 * 1024
      ? (file.size / 1024 / 1024).toFixed(2) + " MB"
      : file
        ? `${Math.floor(file.size / 1024)} KB`
        : null;
  const fileName =
    file && file.name ? file.name.split(".")[0].toUpperCase() : "";

  if (!file) {
    return (
      <div className="flex cursor-pointer items-center gap-3.5 rounded-lg border border-dashed border-[#3F3F3F] bg-brand-secondary p-3">
        <FontAwesomeIcon icon={faFileArrowUp} className="text-4xl" />
        <div className="flex flex-col gap-0">
          <P className="font-medium">
            <u>Upload a file</u> or drop it here
          </P>
          <P className="flex items-center gap-2 text-sm font-normal opacity-50">
            {FILE_TYPES.join(", ").toString()} supported
          </P>
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex cursor-pointer items-center gap-3.5 rounded-lg border border-dashed border-[#3F3F3F] bg-brand-secondary p-3">
        <FontAwesomeIcon icon={faFileAudio} className="text-4xl" />
        <div className="flex flex-col gap-0">
          <P className="font-medium">
            {file.name.slice(0, file.name.lastIndexOf("."))}
          </P>
          <P className="flex items-center gap-2 text-sm font-normal">
            <span className="opacity-50">
              {`${fileName} file size: ${fileSize} `}
            </span>
            <u className="transition-all hover:text-white/80">Change File</u>
          </P>
        </div>
      </div>
    );
  }
};
