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
import { useLocalize } from "hooks";

const FILE_TYPES = ["MP3", "WAV", "FLAC", "OGG"];

interface Props {
  setMediaUploadToken: (token?: string) => void;
  formIsCleared: boolean;
  setFormIsCleared: (cleared: boolean) => void;
  setHasUploadedFile: (hasUploadedFile: boolean) => void;
  isUploadDisabled: boolean;
  setIsUploadDisabled: (value: boolean) => void;
  file: File | undefined;
  setFile: (file: File | undefined) => void;
  audioLink: string | undefined;
  setAudioLink: (link: string | undefined) => void;
}

function UploadComponent(props: Props) {
  const { t } = useLocalize("UploadComponent");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploaderKey, setUploaderKey] = useState(uuidv4());

  const handleChange = (file: any) => {
    props.setFile(file);
    const audioUrl = URL.createObjectURL(file);
    props.setAudioLink(audioUrl ?? "");
    props.setFormIsCleared(false);
    props.setIsUploadDisabled(false);
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
    props.setFile(undefined);
    props.setAudioLink("");
    props.setIsUploadDisabled(false);
    props.setMediaUploadToken(undefined);
    props.setFormIsCleared(true);
    props.setHasUploadedFile(false);
    setUploaderKey(uuidv4());
  };

  const handleUploadFile = async () => {
    if (props.file === undefined) {
      return false;
    }

    setUploadLoading(true);

    const request: UploadAudioRequest = {
      uuid_idempotency_token: uuidv4(),
      file: props.file,
      source: "file",
    };

    let result = await UploadAudio(request);

    if (UploadAudioIsOk(result)) {
      props.setIsUploadDisabled(true);
      props.setMediaUploadToken(result.upload_token);
      props.setFormIsCleared(false);
    }

    setUploadLoading(false);
  };

  const fileSize =
    props.file && props.file.size >= 1024 * 1024
      ? (props.file.size / 1024 / 1024).toFixed(2) + " MB"
      : props.file
        ? `${Math.floor(props.file.size / 1024)} KB`
        : null;

  const uploadBtnClass = props.isUploadDisabled
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
              !props.file ? "empty-zone-short" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="me-3">
              {props.file ? (
                <FontAwesomeIcon icon={faFileAudio} className="upload-icon" />
              ) : (
                <FontAwesomeIcon icon={faFileArrowUp} className="upload-icon" />
              )}
            </div>
            <div>
              <div className="pb-0">
                {props.file ? (
                  <span className="filename" title={props.file.name}>
                    {props.file.name.slice(0, props.file.name.lastIndexOf("."))}
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
                  {props.file ? (
                    <p>
                      <span className="opacity-50">
                        {props.file &&
                          `${props.file?.name
                            .split(".")
                            .pop()
                            ?.toUpperCase()}`}{" "}
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
      {props.audioLink ? (
        <div className="panel panel-inner rounded p-3">
          <InputVcAudioPlayer filename={props.audioLink as string} />
        </div>
      ) : (
        <></>
      )}

      {props.file ? (
        <div className="d-flex gap-3">
          <button
            className={uploadBtnClass}
            onClick={() => {
              handleUploadFile();
            }}
            type="submit"
            disabled={uploadLoading || props.isUploadDisabled}
          >
            {props.isUploadDisabled ? (
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

export default UploadComponent;
