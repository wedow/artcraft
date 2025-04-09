import {
  faCheck,
  faFileArrowUp,
  faFileAudio,
  faTrash,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import { InputVcAudioPlayer } from "../../../../_common/InputVcAudioPlayer";
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

  setCanConvert: (canConvert: boolean) => void;
  changeConvertIdempotencyToken: () => void;
}

function UploadComponent(props: Props) {
  const { t } = useLocalize("UploadComponent");

  const [file, setFile] = useState<any>(undefined);
  const [audioLink, setAudioLink] = useState<string>();
  const [isUploadDisabled, setIsUploadDisabled] = useState<boolean>(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Auto generated
  const [idempotencyToken, setIdempotencyToken] = useState(uuidv4());

  const handleChange = (file: any) => {
    console.log("handle change");
    setFile(file);
    setIdempotencyToken(uuidv4());
    const audioUrl = URL.createObjectURL(file);
    setAudioLink(audioUrl ?? "");
    props.setFormIsCleared(false);
    props.setCanConvert(false);
    props.changeConvertIdempotencyToken();
    setIsUploadDisabled(false);
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
    setIdempotencyToken(uuidv4());
    setIsUploadDisabled(false);
    props.setMediaUploadToken(undefined); // clear
    props.setFormIsCleared(true);
    props.setCanConvert(false);
    props.changeConvertIdempotencyToken();
  };

  const handleUploadFile = async () => {
    if (file === undefined) {
      return false;
    }

    setUploadLoading(true);

    const request: UploadAudioRequest = {
      uuid_idempotency_token: idempotencyToken,
      file: file,
      source: "file",
    };

    let result = await UploadAudio(request);

    if (UploadAudioIsOk(result)) {
      setIsUploadDisabled(true);
      props.setMediaUploadToken(result.upload_token);
      props.setFormIsCleared(false);
      props.setCanConvert(true);
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
    ? "btn btn-uploaded w-100 disabled"
    : "btn btn-primary w-100";

  return (
    <div className="d-flex flex-column gap-3">
      {/* Usage refer to https://github.com/KarimMokhtar/react-drag-drop-files */}
      <FileUploader
        handleChange={handleChange}
        name="file"
        types={FILE_TYPES}
        maxSize={50}
        children={
          <div
            className="panel panel-inner upload-zone d-flex align-items-center p-3"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="me-4">
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
      {/*file ? (
        <div className="d-flex mb-4 mb-lg-3">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              value=""
              id="checkSave"
            />
            <label className="form-check-label opacity-75" htmlFor="checkSave">
              Save audio to collection
            </label>
          </div>
        </div>
      ) : (
        <></>
      )*/}

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

          <button className="btn btn-destructive w-100" onClick={handleClear}>
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
