import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { faCirclePlus, faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  Button,
  FileUploader,
  H2,
  TransitionDialogue,
  WaveformPlayer,
} from "~/components";

import { MediaUploadApi } from "~/Classes/ApiManager/MediaUploadApi";
import { AUDIO_FILE_TYPE, ToastTypes } from "~/enums";
export const FILE_TYPES = Object.keys(AUDIO_FILE_TYPE);

import { getFileName } from "~/utilities";
import { addToast } from "~/signals";

type ComponentState = {
  isOpen: boolean;
  file: File | undefined;
  audioUrl: string;
  uploadState: "init" | "staged" | "uploading" | "uploaded" | "error";
  fileToken: string | undefined;
};
const initialValues: ComponentState = {
  isOpen: false,
  file: undefined,
  audioUrl: "",
  uploadState: "init",
  fileToken: undefined,
};

export const UploadAudioButtonDialogue = ({
  onUploaded,
}: {
  onUploaded: (fileToken: string) => void;
}) => {
  const [{ isOpen, file, audioUrl, uploadState, fileToken }, setState] =
    useState<ComponentState>(initialValues);

  const closeModal = () => setState(initialValues);
  const openModal = () => setState((curr) => ({ ...curr, isOpen: true }));

  const handleFileChange = (file: File) => {
    setState((curr) => ({
      ...curr,
      file: file,
      audioUrl: URL.createObjectURL(file),
      uploadState: "staged",
    }));
  };
  const handleClear = () => {
    setState({
      ...initialValues,
      isOpen: true,
    });
  };
  const submitUpload = async () => {
    if (!file) {
      //TODO: Maybe more verbose on not having file
      return;
    }
    setState((curr) => ({
      ...curr,
      uploadState: "uploading",
    }));
    const mediaApi = new MediaUploadApi();

    const request = {
      blob: file,
      fileName: getFileName(file),
      uuid: uuidv4(),
      maybe_title: getFileName(file),
    };
    const response = await mediaApi.UploadAudio(request);
    if (response.success && response.data) {
      setState((curr) => ({
        ...curr,
        uploadState: "uploaded",
        fileToken: response.data,
      }));
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
  };

  useEffect(() => {
    if (fileToken && uploadState === "uploaded") {
      //calling the callback on a successful upload
      onUploaded(fileToken);
    }
  }, [fileToken, uploadState, onUploaded]);

  return (
    <>
      <Button
        className="grow py-3 text-sm font-medium"
        variant="action"
        icon={faCirclePlus}
        type="button"
        onClick={openModal}
      >
        Upload Audio
      </Button>
      <TransitionDialogue
        isOpen={isOpen}
        onClose={closeModal}
        title={<H2>Upload Audio</H2>}
      >
        <div className="flex w-full flex-col gap-3">
          <FileUploader
            file={file}
            fileTypes={FILE_TYPES}
            handleChange={handleFileChange}
          />

          {file && (
            <div className="flex items-center gap-3 rounded-lg bg-brand-secondary p-3">
              <div className="grow">
                <WaveformPlayer audio={audioUrl} hasPlayButton />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>
              {uploadState === "uploaded" ? "Close" : "Cancel"}
            </Button>
            {uploadState !== "uploaded" && (
              <Button
                onClick={submitUpload}
                disabled={uploadState !== "staged"}
              >
                Upload
                {uploadState === "uploading" && (
                  <FontAwesomeIcon icon={faSpinnerThird} spin />
                )}
              </Button>
            )}
            {uploadState === "uploaded" && (
              <Button onClick={handleClear}>Upload Another</Button>
            )}
          </div>
        </div>
      </TransitionDialogue>
    </>
  );
};
