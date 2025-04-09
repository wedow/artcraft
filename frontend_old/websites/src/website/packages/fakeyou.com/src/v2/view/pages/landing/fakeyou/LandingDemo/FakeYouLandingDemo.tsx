import React, { useEffect, useState } from "react";
import { faPause, faPlay, faShuffle } from "@fortawesome/pro-solid-svg-icons";
import { Panel, Button, TextArea, SelectionBubbles } from "components/common";
import {
  FrontendInferenceJobType,
  InferenceJob,
} from "@storyteller/components/src/jobs/InferenceJob";
import { v4 as uuidv4 } from "uuid";
import {
  GenerateTtsAudio,
  GenerateTtsAudioErrorType,
  GenerateTtsAudioIsError,
  GenerateTtsAudioIsOk,
} from "@storyteller/components/src/api/tts/GenerateTtsAudio";
import { Analytics } from "common/Analytics";
import { BucketConfig } from "@storyteller/components/src/api/BucketConfig";
import DemoTtsAudioPlayer from "./DemoAudioPlayer";
import { RandomTexts, PlaceholderTexts } from "./RandomTexts";
import "./LandingDemo.scss";
import { isMobile } from "react-device-detect";
import { useInferenceJobs } from "hooks";

interface TtsInferencePanelProps {
  showHanashi?: boolean;
  autoFocusTextBox?: boolean;
}

export default function LandingDemo({
  showHanashi = true,
  autoFocusTextBox = true,
}: TtsInferencePanelProps) {
  const [textBuffer, setTextBuffer] = useState("");
  const [maybeTtsError, setMaybeTtsError] = useState<
    GenerateTtsAudioErrorType | undefined
  >(undefined);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [jobToken, setJobToken] = useState<string | null>(null);
  const [lastEnqueuedText, setLastEnqueuedText] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [lastSelectedVoice, setLastSelectedVoice] = useState<string | null>(
    null
  );
  const [placeholder, setPlaceholder] = useState("");
  const [isHanashiHovered, setIsHanashiHovered] = useState(false);

  const { enqueueInferenceJob, inferenceJobs } = useInferenceJobs();

  useEffect(() => {
    // Randomize placeholder text on component mount
    const randomPlaceholderIndex = Math.floor(
      Math.random() * PlaceholderTexts.length
    );
    setPlaceholder(PlaceholderTexts[randomPlaceholderIndex]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textBuffer]);

  const handleChangeText = (ev: React.FormEvent<HTMLTextAreaElement>) => {
    const textValue = (ev.target as HTMLTextAreaElement).value;
    setTextBuffer(textValue);
  };

  //Set voices here
  const voiceModelTokenMap: { [key: string]: string } = {
    Rick: "weight_0f762jdzgsy1dhpb86qxy4ssm",
    Mickey: "weight_sfyjyr67ag1647xs0r7gmvkks",
    Eric: "weight_h8ebh6fyjyrr1vsjregw6yz8y",
    Stan: "weight_0cg1294gaf52c7rh0vz7a2ger",
    Zelda: "weight_b8rncypy7gw6nb0wthnwe2kk4",
    "Angry Male": "weight_hehgvegadf08mfp5rzd69dmh4",
  };

  const [voiceToken, setVoiceToken] = useState(
    voiceModelTokenMap[Object.keys(voiceModelTokenMap)[0]]
  );

  const handleVoiceSelection = (selected: string) => {
    console.log(`Selected option: ${selected}`);
    setVoiceToken(voiceModelTokenMap[selected]);
  };

  const handleEnqueueTts = async (ev: React.FormEvent<HTMLButtonElement>) => {
    ev.preventDefault();

    if (!textBuffer) {
      return false;
    }

    // Check if the text hasn't changed and the voice hasn't changed
    if (textBuffer === lastEnqueuedText && voiceToken === lastSelectedVoice) {
      setIsPlaying(!isPlaying);
      setIsAudioLoading(false);
      return false;
    }

    setIsAudioLoading(true);

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
      // Store the job token
      setJobToken(response.inference_job_token);
      // Store the last enqueued text
      setLastEnqueuedText(textBuffer);
      // Store the last selected voice
      setLastSelectedVoice(voiceToken);
    } else if (GenerateTtsAudioIsError(response)) {
      setMaybeTtsError(response.error);
    }

    return false;
  };

  useEffect(() => {
    if (!jobToken) return;

    const fetch = async () => {
      const job = inferenceJobs.find(
        (job: InferenceJob) => job.jobToken === jobToken
      );

      if (job && job.maybeResultPublicBucketMediaPath) {
        const audioLink = new BucketConfig().getGcsUrl(
          job.maybeResultPublicBucketMediaPath
        );
        setCurrentAudioUrl(audioLink);

        if (audioLink !== currentAudioUrl) {
          setIsAudioLoading(false);
          setIsPlaying(true);
        }
      }
    };

    fetch();
  }, [currentAudioUrl, jobToken, inferenceJobs]);

  const handleAudioFinish = () => {
    setIsPlaying(false);
  };

  const voiceOptions = Object.keys(voiceModelTokenMap);

  // Show errors on TTS failure
  let maybeError = <></>;
  if (!!maybeTtsError) {
    let hasMessage = false;
    let message = <></>;
    switch (maybeTtsError) {
      case GenerateTtsAudioErrorType.TooManyRequests:
        hasMessage = true;
        message = (
          <>Too many requests! Please wait a few minutes then try again.</>
        );
        break;
      case GenerateTtsAudioErrorType.ServerError |
        GenerateTtsAudioErrorType.BadRequest |
        GenerateTtsAudioErrorType.NotFound:
        break;
    }

    if (hasMessage) {
      maybeError = (
        <div
          className="alert alert-primary alert-dismissible fade show mt-3"
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

  const generateRandomText = () => {
    const randomIndex = Math.floor(Math.random() * RandomTexts.length);
    const randomText = RandomTexts[randomIndex];
    setTextBuffer(randomText);
  };

  return (
    <div className="position-relative">
      {showHanashi && (
        <img
          src={
            isHanashiHovered
              ? "/images/landing/hanashi-demo-2.webp"
              : "/images/landing/hanashi-demo-1.webp"
          }
          alt="Hanashi Demo"
          onMouseEnter={() => setIsHanashiHovered(true)}
          onMouseLeave={() => setIsHanashiHovered(false)}
          className="hanashi-demo-image"
          draggable="false"
        />
      )}

      <Panel padding={true} className="rounded">
        <form className="d-flex flex-column">
          <div>
            <div className="d-flex">
              <label className="sub-title flex-grow-1">Select a Voice</label>
            </div>
            <SelectionBubbles
              options={voiceOptions}
              onSelect={handleVoiceSelection}
              mobileSideScroll={true}
            />
          </div>

          <div className="d-flex flex-column mt-3">
            <div className="d-flex justify-content-center pb-2">
              <label className="sub-title flex-grow-1 pb-0">
                What would you like to say?
              </label>
              <Button
                icon={faShuffle}
                label="Randomize Text"
                onClick={generateRandomText}
                variant="link"
                className="fs-7 randomize-text-button"
              />
            </div>
            <TextArea
              placeholder={placeholder}
              value={textBuffer}
              onChange={handleChangeText}
              rows={4}
              resize={false}
              autoFocus={isMobile ? false : autoFocusTextBox ? true : false}
            />
          </div>

          {maybeError}

          <div className="d-flex gap-3 align-items-center mt-4">
            <Button
              icon={isPlaying ? faPause : faPlay}
              label="Speak"
              onClick={handleEnqueueTts}
              isLoading={isAudioLoading}
              disabled={textBuffer.length === 0}
            />
            <DemoTtsAudioPlayer
              filename={currentAudioUrl || ""}
              play={isPlaying}
              onFinish={handleAudioFinish}
            />
          </div>
        </form>
      </Panel>
    </div>
  );
}
