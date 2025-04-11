import React, { useEffect, useState, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAudioRecorder } from "react-audio-voice-recorder";
import { InputVcAudioPlayer } from "v2/view/_common/InputVcAudioPlayer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faFileArrowUp } from "@fortawesome/pro-solid-svg-icons";
import {
  UploadAudio,
  UploadAudioIsOk,
  UploadAudioRequest,
} from "@storyteller/components/src/api/upload/UploadAudio";
import { faCheck, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useLocalize } from "hooks";
import { Button } from "components/common";

interface Props {
  setMediaUploadToken: (token?: string) => void;
  formIsCleared: boolean;
  setFormIsCleared: (cleared: boolean) => void;
  setHasRecordedFile: (hasRecordedFile: boolean) => void;
  hasRecordedFile: boolean;
  setIsRecordingAudio: (isRecordingAudio: boolean) => void;
  recordingBlobStore: Blob | undefined;
  setRecordingBlobStore: (blob: Blob | undefined) => void;
  isUploadDisabled: boolean;
  setIsUploadDisabled: (value: boolean) => void;
}

export default function RecordComponent(props: Props) {
  const { t } = useLocalize("NewVC");
  const [uploadLoading, setUploadLoading] = useState(false);
  const { startRecording, stopRecording, recordingBlob, isRecording } =
    useAudioRecorder();

  useEffect(() => {
    if (!recordingBlob) {
      return;
    } else props.setRecordingBlobStore(recordingBlob);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingBlob, props.setRecordingBlobStore]);

  const handleStartRecording = async () => {
    startRecording();
    props.setIsRecordingAudio(true);
  };

  const handleStopRecording = async (blob: any) => {
    stopRecording();
    props.setFormIsCleared(false);
    props.setIsUploadDisabled(false);
    props.setHasRecordedFile(true);
  };

  const handleClear = () => {
    stopRecording();
    props.setMediaUploadToken(undefined);
    props.setFormIsCleared(true);
    props.setHasRecordedFile(false);
  };

  const handleUpload = async () => {
    const request: UploadAudioRequest = {
      uuid_idempotency_token: uuidv4(),
      file: props.recordingBlobStore,
      source: "device",
    };

    setUploadLoading(true);

    let result = await UploadAudio(request);

    if (UploadAudioIsOk(result)) {
      props.setMediaUploadToken(result.upload_token);
      props.setFormIsCleared(false);
      props.setIsUploadDisabled(true);
    } else {
      // @ts-ignore
      window.dataLayer.push({
        event: "upload_failure",
        page: "/voice-conversion",
        user_id: "$user_id",
      });
    }

    setUploadLoading(false);
  };

  const enableMediaReview =
    !props.formIsCleared && props.recordingBlobStore !== undefined;
  const enableUploadButton =
    !props.formIsCleared &&
    props.recordingBlobStore !== undefined &&
    !isRecording;

  const speakButtonClass = props.isUploadDisabled
    ? "btn btn-uploaded w-100 disabled"
    : "btn btn-primary w-100";

  return (
    <div className="d-flex flex-column gap-3" id="record-audio">
      {isRecording ? (
        <button
          className="btn btn-secondary py-3"
          onClick={handleStopRecording}
        >
          <div className="d-flex align-items-center">
            <div
              className="spinner-grow spinner-grow-sm text-danger me-2"
              role="status"
            >
              <span className="visually-hidden">Recording...</span>
            </div>
            {t("button.stopRecord")}
          </div>
        </button>
      ) : (
        <Button
          icon={faCircle}
          iconClassName="text-danger"
          variant="secondary"
          label={
            props.hasRecordedFile
              ? t("button.rerecord")
              : t("button.startRecord")
          }
          onClick={handleStartRecording}
          className="py-3"
        />
      )}

      {enableMediaReview ? (
        <>
          <RecordedAudioComponent recordingBlob={props.recordingBlobStore} />

          <div className="d-flex gap-3">
            <button
              className={speakButtonClass}
              onClick={handleUpload}
              type="submit"
              disabled={
                props.isUploadDisabled || uploadLoading || !enableUploadButton
              }
            >
              {props.isUploadDisabled ? (
                <>
                  <FontAwesomeIcon icon={faCheck} className="me-2" />
                  {t("button.recordUploaded")}
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faFileArrowUp} className="me-2" />
                  {t("button.recordUpload")}
                </>
              )}
              {uploadLoading && <LoadingIcon />}
            </button>
            <button className="btn btn-destructive w-100" onClick={handleClear}>
              <FontAwesomeIcon icon={faTrash} className="me-2" />
              {t("button.recordClear")}
            </button>
          </div>
        </>
      ) : (
        <></>
      )}
    </div>
  );
}

interface RecorderProps {
  recordingBlob: any;
}

function RecordedAudioComponent(props: RecorderProps) {
  // Only generate the URL on change.
  const audioLink = useMemo(() => {
    if (!props.recordingBlob) {
      return;
    }
    return URL.createObjectURL(props.recordingBlob);
  }, [props.recordingBlob]);

  if (!props.recordingBlob) {
    return <></>;
  }

  return (
    <div className="panel panel-inner rounded p-3">
      <InputVcAudioPlayer filename={audioLink as string} />
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
