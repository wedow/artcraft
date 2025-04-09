import React, { memo, useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  faChevronRight,
  faHistory,
  faPause,
  faPlay,
  faSquareQuote,
  faTrashAlt,
  faWaveformLines,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { BucketConfig } from "@storyteller/components/src/api/BucketConfig";
import {
  GenerateTtsAudio,
  GenerateTtsAudioErrorType,
  GenerateTtsAudioIsError,
  GenerateTtsAudioIsOk,
} from "@storyteller/components/src/api/tts/GenerateTtsAudio";
import {
  FrontendInferenceJobType,
  InferenceJob,
} from "@storyteller/components/src/jobs/InferenceJob";
import {
  Button,
  Label,
  LoadingSpinner,
  Panel,
  TextArea,
  WeightCoverImage,
} from "components/common";
import {
  useDebounce,
  useInferenceJobs,
  useLocalize,
  useModal,
  useSession,
} from "hooks";
import LipsyncAudioPlayer from "./LipsyncAudioPlayer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  GetMedia,
  GetMediaResponse,
  MediaLinks,
} from "@storyteller/components/src/api/media_files";
import { SessionTtsInferenceResultList } from "v2/view/_common/SessionTtsInferenceResultsList";
import { useHistory, useLocation } from "react-router-dom";
import { GetWeight } from "@storyteller/components/src/api/weights/GetWeight";
import { MediaBrowser } from "components/modals";
import ExploreVoices from "../audio_gen/ExploreVoices";

interface GenerateTtsProps {
  weightToken?: string | null;
  onResultToken?: (token: string | null) => void;
  onAudioDelete?: () => void;
  loadingSelectedAudioResult: boolean;
  setLoadingSelectedAudioResult: React.Dispatch<React.SetStateAction<boolean>>;
  currentAudioUrl: string | null;
  setCurrentAudioUrl: React.Dispatch<React.SetStateAction<string | null>>;
}

export const GenerateTts = memo(function GenerateTts({
  weightToken,
  onResultToken,
  onAudioDelete,
  loadingSelectedAudioResult,
  setLoadingSelectedAudioResult,
  currentAudioUrl,
  setCurrentAudioUrl,
}: GenerateTtsProps) {
  const { sessionSubscriptions } = useSession();
  const { modalState, open, close } = useModal();
  const [textBuffer, setTextBuffer] = useState("");
  const [maybeTtsError, setMaybeTtsError] = useState<
    GenerateTtsAudioErrorType | undefined
  >(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [jobToken, setJobToken] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [voiceToken, setVoiceToken] = useState(weightToken);
  const [progress, setProgress] = useState(0);
  const { enqueueInferenceJob, inferenceJobs } = useInferenceJobs();
  const history = useHistory();
  const [transcript, setTranscript] = useState<string | null>(null);
  const handleChangeText = (ev: React.FormEvent<HTMLTextAreaElement>) => {
    const textValue = (ev.target as HTMLTextAreaElement).value;
    setTextBuffer(textValue);
  };
  const location = useLocation();
  const [voiceTitle, setVoiceTitle] = useState<string | null>(null);
  const [voiceCoverImage, setVoiceCoverImage] = useState<string | null>(null);
  const [search, searchSet] = useState("");
  const [updated, updatedSet] = useState(false);
  const { t } = useLocalize("NewLipsync");

  const handleEnqueueTts = async (ev: React.FormEvent<HTMLButtonElement>) => {
    ev.preventDefault();

    if (!textBuffer) {
      return false;
    }

    if (!voiceToken) {
      return false;
    }

    // Check if the text hasn't changed and the voice hasn't changed

    setIsAudioLoading(true);

    const modelToken = voiceToken;

    const request = {
      uuid_idempotency_token: uuidv4(),
      tts_model_token: modelToken,
      inference_text: textBuffer,
    };

    const response = await GenerateTtsAudio(request);

    if (GenerateTtsAudioIsOk(response)) {
      setMaybeTtsError(undefined);

      enqueueInferenceJob(
        response.inference_job_token,
        FrontendInferenceJobType.TextToSpeech
      );
      setJobToken(response.inference_job_token);
      setTranscript(textBuffer);
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

      if (job && job.progressPercentage) {
        setProgress(job.progressPercentage);
      }

      if (job && job.maybeResultToken) {
        const url = new URL(window.location.href);
        url.searchParams.set("audio", job.maybeResultToken);
        window.history.replaceState({}, "", url.toString());

        if (onResultToken) {
          onResultToken(job.maybeResultToken);
        }
      }

      if (job && job.maybeResultPublicBucketMediaPath) {
        const audioLink = new BucketConfig().getGcsUrl(
          job.maybeResultPublicBucketMediaPath
        );
        setCurrentAudioUrl(audioLink);
        setProgress(0);

        if (audioLink !== currentAudioUrl) {
          setIsAudioLoading(false);
          setIsPlaying(true);
        }
      }
    };

    fetch();
  }, [
    currentAudioUrl,
    jobToken,
    inferenceJobs,
    onResultToken,
    setCurrentAudioUrl,
  ]);

  const handleClearAudio = useCallback(() => {
    setJobToken(null);
    setCurrentAudioUrl(null);

    const queryParams = new URLSearchParams(location.search);
    queryParams.delete("audio");
    history.push({ search: queryParams.toString() });

    if (onResultToken) {
      onResultToken(null);
    }

    if (onAudioDelete) {
      onAudioDelete();
    }
  }, [
    setCurrentAudioUrl,
    location.search,
    history,
    onResultToken,
    onAudioDelete,
  ]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const maybeResultToken = urlParams.get("audio");

    if (maybeResultToken) {
      const fetchMedia = async () => {
        try {
          const response: GetMediaResponse = await GetMedia(
            maybeResultToken,
            {}
          );
          if (
            response &&
            response.media_file &&
            response.media_file.public_bucket_path &&
            response.media_file.maybe_text_transcript
          ) {
            const { mainURL } = MediaLinks(response.media_file.media_links);

            if (mainURL && currentAudioUrl === null) {
              setCurrentAudioUrl(mainURL);
              setTranscript(response.media_file.maybe_text_transcript || "");
              if (onResultToken) {
                onResultToken(response.media_file.token);
              }
            }
          } else {
            console.error(
              "Failed to retrieve media or media has no public bucket path",
              response
            );
          }
        } catch (error) {
          console.error("Error fetching media:", error);
        }
      };

      fetchMedia();
    }
  }, [location.search, currentAudioUrl, onResultToken, setCurrentAudioUrl]);

  const handleAudioFinish = useCallback(() => {
    setIsPlaying(false);
  }, []);

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

  useEffect(() => {
    if (weightToken) {
      setVoiceToken(weightToken);
    }
  }, [weightToken]);

  useEffect(() => {
    if (voiceToken) {
      GetWeight(voiceToken, {})
        .then(response => {
          if (response && response.success) {
            const title = response.title || null;
            const cover_image =
              response.cover_image.maybe_cover_image_public_bucket_path || null;
            setVoiceTitle(title);
            if (cover_image) {
              setVoiceCoverImage(
                new BucketConfig().getCdnUrl(cover_image, 36, 100)
              );
            } else {
              setVoiceCoverImage("");
            }
          } else {
            console.error(
              "Failed to retrieve media or media has no title",
              response
            );
          }
        })
        .catch(error => {
          console.error("Error fetching media:", error);
        });
    }
  }, [voiceToken]);

  const handleResultClick = async (
    modelToken: string | undefined,
    resultToken: string | undefined | null
  ) => {
    if (modelToken && resultToken && !isAudioLoading) {
      handleClearAudio();
      setLoadingSelectedAudioResult(true);
      const url = new URL(window.location.href);
      const searchParams = new URLSearchParams(url.search);
      const sourceToken = searchParams.get("source");
      searchParams.set("voice", modelToken);
      searchParams.set("audio", resultToken || "");

      if (sourceToken) {
        searchParams.set("source", sourceToken);
      }

      const newUrl = `${url.pathname}?${searchParams.toString()}`;

      history.push(newUrl);

      try {
        const response = await GetMedia(resultToken, {});
        if (
          response &&
          response.media_file &&
          response.media_file.public_bucket_path &&
          response.media_file.maybe_text_transcript
        ) {
          const audioLink = new BucketConfig().getGcsUrl(
            response.media_file.public_bucket_path
          );
          setCurrentAudioUrl(audioLink);
          setTranscript(response.media_file.maybe_text_transcript || "");
          if (onResultToken) {
            onResultToken(response.media_file.token);
          }
          setLoadingSelectedAudioResult(false);
        } else {
          console.error(
            "Failed to retrieve media or media has no public bucket path",
            response
          );
          setLoadingSelectedAudioResult(false);
        }
      } catch (error) {
        console.error("Error fetching media:", error);
        setLoadingSelectedAudioResult(false);
      }
    }
  };

  const searchChange =
    (setUpdate = true) =>
    ({ target }: { target: any }) => {
      if (setUpdate) updatedSet(true);
      searchSet(target.value);
    };

  const handleVoiceSelect = async (data: any) => {
    if (data.weight_token) {
      const url = new URL(window.location.href);
      const searchParams = new URLSearchParams(url.search);
      const sourceToken = searchParams.get("source");
      searchParams.set("voice", data.weight_token);

      if (sourceToken) {
        searchParams.set("source", sourceToken);
      }

      const newUrl = `${url.pathname}?${searchParams.toString()}`;
      history.push(newUrl);

      close();
    }
  };

  const mediaBrowserProps = {
    onSelect: (weight: any) => setVoiceToken(weight.weight_token),
    inputMode: 3,
    onSearchChange: searchChange(false),
    search,
    emptyContent: (
      <ExploreVoices
        onResultSelect={handleVoiceSelect}
        filterCategory="text_to_speech"
      />
    ),
    showFilters: false,
    showPagination: false,
    searchFilter: "text_to_speech",
  };

  useDebounce({
    blocked: !(updated && !modalState && search),
    onTimeout: () => {
      updatedSet(false);
      open({
        component: MediaBrowser,
        props: mediaBrowserProps,
      });
    },
  });

  const handleOpenVoiceSelection = () => {
    open({
      component: MediaBrowser,
      props: mediaBrowserProps,
    });
  };

  return (
    <>
      <div>
        <div className="d-flex gap-2 align-items-center mb-1">
          <div className="lp-step">2</div>
          <h2 className="fs-5 mb-0 fw-semibold">{t("step.two.title")}</h2>
        </div>

        <p className="fw-medium fs-7 opacity-75">{t("step.two.subtitle")}</p>
      </div>

      <div className="ratio ratio-1x1">
        <div className="d-flex flex-column h-100">
          {loadingSelectedAudioResult ? (
            <Panel
              padding={true}
              className="panel-inner h-100 position-relative rounded d-flex align-items-center justify-content-center"
            >
              <LoadingSpinner padding={false} />
            </Panel>
          ) : currentAudioUrl ? (
            <Panel
              padding={true}
              className="panel-inner h-100 position-relative rounded"
              key={`${currentAudioUrl}`}
            >
              <div className="d-flex flex-column justify-content-center h-100">
                <div className="d-flex gap-3 align-items-center justify-content-center">
                  <Button
                    icon={isPlaying ? faPause : faPlay}
                    onClick={() => setIsPlaying(!isPlaying)}
                    isLoading={isAudioLoading}
                    square={true}
                    small={true}
                  />
                  <div className="w-100">
                    <LipsyncAudioPlayer
                      filename={currentAudioUrl || ""}
                      play={isPlaying}
                      onFinish={handleAudioFinish}
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <h6 className="fw-bold">
                    <FontAwesomeIcon icon={faSquareQuote} className="me-2" />
                    {t("label.audioTranscript")}
                  </h6>
                  <p className="fs-7">{transcript}</p>
                </div>
              </div>
              <div style={{ position: "absolute", top: "10px", right: "10px" }}>
                <button
                  onClick={handleClearAudio}
                  className="ls-remove-audio-btn"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            </Panel>
          ) : (
            <>
              <button
                className="ls-voice-picker-preview mb-3"
                onClick={handleOpenVoiceSelection}
              >
                <div className="d-flex align-items-center flex-grow-1">
                  <div className="d-flex">
                    <WeightCoverImage
                      src={voiceCoverImage || ""}
                      height={36}
                      width={36}
                      marginRight={8}
                    />
                  </div>
                  <span className="text-truncate" style={{ maxWidth: "300px" }}>
                    {voiceTitle || "Click here to select a voice..."}
                  </span>
                </div>
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
              <TextArea
                placeholder={t("input.textPlaceholder")}
                value={textBuffer}
                onChange={handleChangeText}
                rows={6}
                resize={false}
                autoFocus={true}
                disabled={isAudioLoading}
                className="h-100"
              />
              {maybeError}
            </>
          )}
        </div>
      </div>

      {currentAudioUrl !== null || loadingSelectedAudioResult ? (
        <Button
          label={t("button.clearAudio")}
          variant="secondary"
          icon={faTrashAlt}
          onClick={handleClearAudio}
          isLoading={isAudioLoading}
        />
      ) : (
        <Button
          label={
            isAudioLoading
              ? `${t("button.generating")} ${
                  progress !== 0 ? progress + "%" : ""
                }`
              : t("button.generateAudio")
          }
          variant={"action"}
          icon={faWaveformLines}
          onClick={handleEnqueueTts}
          disabled={textBuffer.length === 0 || voiceToken === null}
          isLoading={isAudioLoading}
        />
      )}

      <div className="mt-3 d-none d-lg-flex flex-column mb-2 h-100">
        <Label
          label={
            <div className="d-flex gap-2 align-items-center fw-semibold">
              <FontAwesomeIcon icon={faHistory} />
              {t("label.previousTtsResults")}
            </div>
          }
        />
        <div
          style={{
            height: "100%",
            maxHeight:
              sessionSubscriptions?.hasActiveProSubscription() ||
              sessionSubscriptions?.hasActiveEliteSubscription()
                ? "460px"
                : "520px",
            overflow: "auto",
          }}
        >
          <SessionTtsInferenceResultList
            mode="lipsync"
            onResultClick={handleResultClick}
          />
        </div>
      </div>
    </>
  );
});
