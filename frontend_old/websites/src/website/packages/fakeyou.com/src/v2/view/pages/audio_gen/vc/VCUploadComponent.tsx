import {
  faCheck,
  faFileArrowUp,
  faFileAudio,
  faTrash,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import { InputVcAudioPlayer } from "v2/view/_common/InputVcAudioPlayer";
import { v4 as uuidv4 } from "uuid";
import {
  UploadAudio,
  UploadAudioIsOk,
  UploadAudioRequest,
} from "@storyteller/components/src/api/upload/UploadAudio";
import { useLocalize, useVcStore } from "hooks";

const FILE_TYPES = ["MP3", "WAV", "FLAC", "OGG"];

interface Props {
  setMediaUploadToken: (token?: string) => void;
  formIsCleared: boolean;
  setFormIsCleared: (cleared: boolean) => void;
  setHasUploadedFile: (hasUploadedFile: boolean) => void;
}

function VCUploadComponent(props: Props) {
  const { t } = useLocalize("UploadComponent");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploaderKey, setUploaderKey] = useState(uuidv4());
  const {
    isUploadDisabled,
    setIsUploadDisabled,
    file,
    setFile,
    audioLink,
    setAudioLink,
  } = useVcStore();

  const handleChange = (file: any) => {
    console.log("handle change");
    setFile(file);
    const audioUrl = URL.createObjectURL(file);
    setAudioLink(audioUrl ?? "");
    props.setFormIsCleared(false);
    setIsUploadDisabled(false);
    props.setHasUploadedFile(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add("upload-zone-drag");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("upload-zone-drag");
  };

  const handleClear = () => {
    setFile(null);
    setAudioLink("");
    setIsUploadDisabled(false);
    props.setMediaUploadToken(undefined);
    props.setFormIsCleared(true);
    props.setHasUploadedFile(false);
    setUploaderKey(uuidv4());
  };

  const handleUploadFile = async () => {
    if (file === undefined) {
      return false;
    }

    setUploadLoading(true);

    const request: UploadAudioRequest = {
      uuid_idempotency_token: uuidv4(),
      file: file,
      source: "file",
    };

    let result = await UploadAudio(request);

    if (UploadAudioIsOk(result)) {
      setIsUploadDisabled(true);
      props.setMediaUploadToken(result.upload_token);
      props.setFormIsCleared(false);
    }

    setUploadLoading(false);
  };

  const fileSize =
    file && file.size >= 1024 * 1024
      ? (file.size / 1024 / 1024).toFixed(2) + " MB"
      : file
        ? `${Math.floor(file.size / 1024)} KB`
        : null;

  const uploadBtnClass = isUploadDisabled
    ? "btn fw-medium btn-uploaded w-100 disabled"
    : "btn fw-medium btn-primary w-100";

  return (
    <div className="d-flex flex-column gap-3">
      <FileUploader
        key={uploaderKey}
        handleChange={handleChange}
        name="file"
        types={FILE_TYPES}
        maxSize={50}
        children={
          <div
            className={`panel panel-inner upload-zone d-flex align-items-center justify-content-center p-4 ${
              !file ? "empty-zone" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="me-3">
              {file ? (
                <FontAwesomeIcon icon={faFileAudio} className="upload-icon" />
              ) : (
                <FontAwesomeIcon icon={faFileArrowUp} className="upload-icon" />
              )}
            </div>
            <div>
              <div className="pb-0">
                {file ? (
                  <span className="filename" title={file.name}>
                    {file.name.slice(0, file.name.lastIndexOf("."))}
                  </span>
                ) : (
                  <>
                    <u className="fw-medium">{t("uploadFileTextUpload")}</u>{" "}
                    {t("uploadFileTextDrop")}
                  </>
                )}
              </div>
              <div className="d-flex gap-1">
                <div>
                  {file ? (
                    <p>
                      <span className="opacity-50">
                        {file && `${file.name.split(".").pop().toUpperCase()}`}{" "}
                        file size: {fileSize}
                      </span>{" "}
                      <u className="fw-medium opacity-100 ms-1">
                        {t("uploadChangeFile")}
                      </u>
                    </p>
                  ) : (
                    <p className="opacity-50">
                      {FILE_TYPES.join(", ").toString()} supported
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        }
      />
      {file ? (
        <div className="panel panel-inner rounded p-3">
          <InputVcAudioPlayer filename={audioLink as string} />
        </div>
      ) : (
        <></>
      )}

      {file ? (
        <div className="d-flex gap-3">
          <button
            className={uploadBtnClass}
            onClick={() => {
              handleUploadFile();
            }}
            type="submit"
            disabled={uploadLoading || isUploadDisabled}
          >
            {isUploadDisabled ? (
              <>
                <FontAwesomeIcon icon={faCheck} className="me-2" />
                {t("uploadButtonUploaded")}
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faFileArrowUp} className="me-2" />
                {t("uploadButtonUploadAudio")}
              </>
            )}
            {uploadLoading && <LoadingIcon />}
          </button>

          <button
            className="btn btn-destructive w-100 fw-medium"
            onClick={handleClear}
          >
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            {t("uploadButtonClear")}
          </button>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}

const LoadingIcon: React.FC = () => {
  return (
    <>
      <span
        className="spinner-border spinner-border-sm ms-3"
        role="status"
        aria-hidden="true"
      ></span>
      <span className="visually-hidden">Loading...</span>
    </>
  );
};

export default VCUploadComponent;
