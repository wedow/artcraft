import React, { useEffect, useState, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAudioRecorder } from "react-audio-voice-recorder";
import { InputVcAudioPlayer } from "../../../../_common/InputVcAudioPlayer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileArrowUp, faMicrophone } from "@fortawesome/pro-solid-svg-icons";
import {
  UploadAudio,
  UploadAudioIsOk,
  UploadAudioRequest,
} from "@storyteller/components/src/api/upload/UploadAudio";
import { faCheck, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useLocalize } from "hooks";

interface Props {
  setMediaUploadToken: (token?: string) => void;

  formIsCleared: boolean;
  setFormIsCleared: (cleared: boolean) => void;

  setCanConvert: (canConvert: boolean) => void;
  changeConvertIdempotencyToken: () => void;
}

export default function RecordComponent(props: Props) {
  const { t } = useLocalize("RecordComponent");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [isUploadDisabled, setIsUploadDisabled] = useState<boolean>(false);
  const { startRecording, stopRecording, recordingBlob, isRecording } =
    useAudioRecorder();

  useEffect(() => {
    // NB: This is used to detect changes to `recordingBlob` and upload them
    if (!recordingBlob) {
      return;
    }

    //(async () => {
    //  let idempotencyToken = uuidv4();

    //  const request : UploadAudioRequest = {
    //    uuid_idempotency_token: idempotencyToken,
    //    file: recordingBlob,
    //    source: 'device',
    //  }

    //  let result = await UploadAudio(request);

    //  if (UploadAudioIsOk(result)) {
    //    //setIsUploadDisabled(true);
    //    //ggprops.setMediaUploadToken(result.upload_token);
    //    props.setMediaUploadToken(result.upload_token);
    //  }
    //})();
  }, [recordingBlob]);

  const handleStartRecording = async () => {
    startRecording();
    props.setCanConvert(false);
  };

  const handleStopRecording = async (blob: any) => {
    stopRecording();
    props.setFormIsCleared(false);
    props.setCanConvert(false);
    setIsUploadDisabled(false);
  };

  const handleClear = () => {
    stopRecording();
    props.setMediaUploadToken(undefined); // clear
    props.setFormIsCleared(true);
    props.setCanConvert(false);
    props.changeConvertIdempotencyToken();
  };

  const handleUpload = async () => {
    const request: UploadAudioRequest = {
      uuid_idempotency_token: uuidv4(), // TODO: only send on change.
      file: recordingBlob,
      source: "device",
    };

    setUploadLoading(true);

    let result = await UploadAudio(request);

    if (UploadAudioIsOk(result)) {
      props.setMediaUploadToken(result.upload_token);
      props.setFormIsCleared(false);
      props.setCanConvert(true);
      props.changeConvertIdempotencyToken();
      setIsUploadDisabled(true);
    }

    setUploadLoading(false);
  };

  const enableMediaReview = !props.formIsCleared && recordingBlob !== undefined;
  const enableUploadButton =
    !props.formIsCleared && recordingBlob !== undefined && !isRecording;

  const speakButtonClass = isUploadDisabled
    ? "btn btn-uploaded w-100 disabled"
    : "btn btn-primary w-100";

  return (
    <div className="d-flex flex-column gap-3" id="record-audio">
      {isRecording ? (
        <button className="btn btn-secondary" onClick={handleStopRecording}>
          <div className="d-flex align-items-center">
            <div
              className="spinner-grow spinner-grow-sm text-danger me-2"
              role="status"
            >
              <span className="visually-hidden">Recording...</span>
            </div>
            {t("recordButtonStop")}
          </div>
        </button>
      ) : (
        <button className="btn btn-primary" onClick={handleStartRecording}>
          <FontAwesomeIcon icon={faMicrophone} className="me-2" />
          {t("recordButtonStart")}
        </button>
      )}

      {enableMediaReview ? (
        <>
          <RecordedAudioComponent recordingBlob={recordingBlob} />

          <div className="d-flex gap-3">
            <button
              className={speakButtonClass}
              onClick={handleUpload}
              type="submit"
              disabled={
                isUploadDisabled || uploadLoading || !enableUploadButton
              }
            >
              {isUploadDisabled ? (
                <>
                  <FontAwesomeIcon icon={faCheck} className="me-2" />
                  {t("recordButtonUploaded")}
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faFileArrowUp} className="me-2" />
                  {t("recordButtonUploadAudio")}
                </>
              )}
              {uploadLoading && <LoadingIcon />}
            </button>
            <button className="btn btn-destructive w-100" onClick={handleClear}>
              <FontAwesomeIcon icon={faTrash} className="me-2" />
              {t("recordButtonClear")}
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

/*
  In case you'd like to update colors of the icons just follow the instruction here:
  https://github.com/samhirtarif/react-audio-recorder/issues/19#issuecomment-1420248073
*/
