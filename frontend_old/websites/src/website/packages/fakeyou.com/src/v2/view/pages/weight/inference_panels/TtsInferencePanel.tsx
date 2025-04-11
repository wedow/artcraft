import React, { useState } from "react";
import { faDeleteLeft } from "@fortawesome/pro-solid-svg-icons";
import Panel from "components/common/Panel/Panel";
import TextArea from "components/common/TextArea";
import { Button } from "components/common";
// import InferenceJobsList from "components/layout/InferenceJobsList";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import { faVolumeUp } from "@fortawesome/free-solid-svg-icons";
import { v4 as uuidv4 } from "uuid";
import Accordion from "components/common/Accordion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  GenerateTtsAudio,
  GenerateTtsAudioErrorType,
  GenerateTtsAudioIsError,
  GenerateTtsAudioIsOk,
} from "@storyteller/components/src/api/tts/GenerateTtsAudio";
import { Analytics } from "common/Analytics";
import { Link } from "react-router-dom";
import { SessionTtsInferenceResultList } from "v2/view/_common/SessionTtsInferenceResultsList";
import { useInferenceJobs, useSession } from "hooks";

interface TtsInferencePanelProps {
  voiceToken: string;
  // enqueueTtsJob: (jobToken: string) => void;
}

export default function TtsInferencePanel({
  voiceToken,
}: TtsInferencePanelProps) {
  const { enqueueInferenceJob, inferenceJobsByCategory } = useInferenceJobs();
  const { sessionSubscriptions } = useSession();
  const ttsJobs = inferenceJobsByCategory.get(
    FrontendInferenceJobType.TextToSpeech
  );
  const [textBuffer, setTextBuffer] = useState("");
  const [isEnqueuing, setIsEnqueuing] = useState(false);
  const [maybeTtsError, setMaybeTtsError] = useState<
    GenerateTtsAudioErrorType | undefined
  >(undefined);
  const [isAudioLimitAlertVisible, setAudioLimitAlertVisible] = useState(false);

  const handleChangeText = (ev: React.FormEvent<HTMLTextAreaElement>) => {
    const textValue = (ev.target as HTMLTextAreaElement).value;
    setTextBuffer(textValue);
    setAudioLimitAlertVisible(textValue.length > 100);
  };

  const handleClearText = () => {
    setTextBuffer("");
  };

  const handleEnqueueTts = async (ev: React.FormEvent<HTMLButtonElement>) => {
    ev.preventDefault();

    if (!textBuffer) {
      return false;
    }

    setIsEnqueuing(true);

    const modelToken = voiceToken;

    const request = {
      uuid_idempotency_token: uuidv4(),
      tts_model_token: modelToken,
      inference_text: textBuffer,
    };

    const response = await GenerateTtsAudio(request);

    Analytics.ttsGenerate(modelToken, textBuffer.length);

    if (GenerateTtsAudioIsOk(response)) {
      setMaybeTtsError(undefined);

      // if (response.inference_job_token_type === "generic") {
      enqueueInferenceJob(
        response.inference_job_token,
        FrontendInferenceJobType.TextToSpeech
      );
      // } else {
      //   enqueueTtsJob(response.inference_job_token);
      // }
    } else if (GenerateTtsAudioIsError(response)) {
      setMaybeTtsError(response.error);
    }

    setIsEnqueuing(false);

    return false;
  };

  let maybeError = <></>;
  if (!!maybeTtsError) {
    let hasMessage = false;
    let message = <></>;
    switch (maybeTtsError) {
      case GenerateTtsAudioErrorType.TooManyRequests:
        hasMessage = true;
        message = <>Error: Too many requests. Please try again in a bit.</>;
        break;
      case GenerateTtsAudioErrorType.ServerError |
        GenerateTtsAudioErrorType.BadRequest |
        GenerateTtsAudioErrorType.NotFound:
        break;
    }

    if (hasMessage) {
      maybeError = (
        <div
          className="alert alert-primary alert-dismissible fade show m-0"
          role="alert"
        >
          <button
            className="btn-close"
            onClick={() => setMaybeTtsError(undefined)}
            data-bs-dismiss="alert"
            aria-label="Close"
          ></button>
          {message}
        </div>
      );
    }
  }

  let audioLimitAlert = <></>;
  if (isAudioLimitAlertVisible && !sessionSubscriptions?.hasPaidFeatures()) {
    audioLimitAlert = (
      <>
        <div className="alert alert-warning fs-7 mb-0">
          <span className="fw-semibold">
            <u>Note:</u> Non-premium is limited to 12 seconds of audio.{" "}
            <Link className="fw-semibold" to="/pricing">
              Upgrade now
            </Link>
            .
          </span>
        </div>
      </>
    );
  }

  return (
    <Panel padding={true}>
      <form>
        <div className="d-flex flex-column gap-3">
          <h4 className="fw-semibold">
            <FontAwesomeIcon icon={faVolumeUp} className="me-3" />
            Generate TTS
          </h4>
          <TextArea
            placeholder="Enter the text you want your character to say here..."
            value={textBuffer}
            onChange={handleChangeText}
            rows={6}
          />
          {audioLimitAlert}
        </div>

        <div className="d-flex gap-2 justify-content-end mt-3">
          <Button
            icon={faDeleteLeft}
            label="Clear"
            variant="danger"
            onClick={handleClearText}
            disabled={textBuffer.length === 0}
          />
          <Button
            icon={faVolumeUp}
            label="Speak"
            onClick={handleEnqueueTts}
            isLoading={isEnqueuing}
            disabled={textBuffer.length === 0}
          />
        </div>
      </form>

      {/*      <InferenceJobsList
        {...{
          failures: () => "Uknown failure",
          onSelect: () => Analytics.voiceConversionClickDownload(),
          jobType: FrontendInferenceJobType.TextToSpeech,
        }}
      />*/}

      {ttsJobs && ttsJobs.length ? (
        <div className="mt-4">
          <Accordion>
            <Accordion.Item title="Session TTS Results" defaultOpen={true}>
              <div className="p-3">
                <SessionTtsInferenceResultList />
              </div>
            </Accordion.Item>
          </Accordion>
          {maybeError}
        </div>
      ) : null}
    </Panel>
  );
}
