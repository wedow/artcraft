import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Checkbox,
  Container,
  Label,
  Panel,
} from "components/common";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowDownToLine,
  faEquals,
  faHistory,
  faLips,
  faLock,
  faPlus,
  faSparkles,
  faWaveformLines,
} from "@fortawesome/pro-solid-svg-icons";
import "../live_portrait/LivePortrait.scss";
import "./Lipsync.scss";
import {
  EnqueueLipsync,
  EnqueueLipsyncResponse,
  MediaFileCropArea,
} from "@storyteller/components/src/api/workflows/EnqueueLipsync";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { v4 as uuidv4 } from "uuid";
import { useInferenceJobs, useLocalize, useSession } from "hooks";
import {
  FrontendInferenceJobType,
  InferenceJob,
} from "@storyteller/components/src/jobs/InferenceJob";
import { AITools } from "components/marketing";
import LoadingSpinner from "components/common/LoadingSpinner";
import {
  GetMedia,
  // MediaFile, please use this type where applicabale
  MediaLinks,
} from "@storyteller/components/src/api/media_files";
import { useLocation } from "react-router-dom";
import { useDocumentTitle } from "@storyteller/components/src/hooks/UseDocumentTitle";
import { useHistory } from "react-router-dom";
import PremiumLock from "components/PremiumLock";
import OutputThumbnailImage from "../live_portrait/OutputThumbnailImage";
import SessionLsInferenceResultsList from "./SessionLsInferenceResultsList";
import ThumbnailMediaPicker from "../live_portrait/ThumbnailMediaPicker";
import { GenerateTts } from "./GenerateTts";
import { LipsyncTokenMap } from "./LipsyncTokens";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { featuredTtsVoiceTokens } from "../audio_gen/tts/FeaturedTTSVoiceTokens";

// Initial source if no source or matching voice that has a source is provided
const PRECOMPUTED_SOURCE_TOKENS: string[] = [
  "m_7ap2qssd4y5ew51dkx4awnng2key32", // Wednesday Addams
];

export default function Lipsync() {
  useDocumentTitle("Lip Sync AI. Free Video Animation");
  const { enqueueInferenceJob } = useInferenceJobs();
  const { loggedIn, sessionFetched } = useSession();
  // const { open, close } = useModal();
  const [isEnqueuing, setIsEnqueuing] = useState(false);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const [lastEnqueuedJobToken, setLastEnqueuedJobToken] = useState<
    string | null
  >(null);
  const [removeWatermark, setRemoveWatermark] = useState(false);
  const [visibility, setVisibility] = useState<"private" | "public">("public");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [cropArea, setCropArea] = useState<MediaFileCropArea>({
    height: 0,
    width: 0,
    x: 0,
    y: 0,
  });
  const [generatedVideoSrc, setGeneratedVideoSrc] = useState("");
  const [sourceTokens, setSourceTokens] = useState<string[]>([
    ...PRECOMPUTED_SOURCE_TOKENS,
  ]);
  const [sourceTokenFromQuery, setSourceTokenFromQuery] = useState<
    string | null
  >(null);
  // const numberOfInitialSourceTokensRef = useRef(sourceTokens.length);
  // const numberOfInitialSourceTokens = numberOfInitialSourceTokensRef.current;
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobProcessedTokens, setJobProcessedTokens] = useState<string[]>([]);
  const [voiceToken, setVoiceToken] = useState<string | null>(null);
  const [audioToken, setAudioToken] = useState<string | null>(null);
  const [jobPercentage, setJobPercentage] = useState<number | null>(null);
  const location = useLocation();
  const history = useHistory();
  const sourceVideoRef = useRef<HTMLVideoElement | null>(null);
  const [loadingSelectedAudioResult, setLoadingSelectedAudioResult] =
    useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const { t, language } = useLocalize("NewLipsync");

  const handleAudioResultToken = useCallback(
    (token: string | null) => {
      setAudioToken(token);
    },
    [setAudioToken]
  );

  const enqueueClick = () => {
    // Clear the generated video when reanimating
    setGeneratedVideoSrc("");
    setIsGenerating(true);

    setIsEnqueuing(true);

    EnqueueLipsync("", {
      creator_set_visibility: visibility,
      audio_media_file_token: audioToken || "",
      maybe_crop: cropArea,
      remove_watermark: removeWatermark,
      image_or_video_media_file_token: sourceTokens[selectedSourceIndex],
      uuid_idempotency_token: uuidv4(),
    }).then((res: EnqueueLipsyncResponse) => {
      if (res.success && res.inference_job_token) {
        setLastEnqueuedJobToken(res.inference_job_token);
        enqueueInferenceJob(
          res.inference_job_token,
          FrontendInferenceJobType.FaceAnimation,
          false
        );
      } else {
        console.error("Failed to enqueue job", res);
        setIsGenerating(false);
      }
      setIsEnqueuing(false);
    });
  };

  const renderVideoOrPlaceholder = () => {
    if (generatedVideoSrc && !isGenerating && audioToken) {
      return (
        <video
          // loop
          autoPlay
          // muted
          playsInline
          controls={true}
          preload="auto"
          key={generatedVideoSrc}
        >
          <source src={generatedVideoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    } else if (isGenerating && audioToken) {
      return (
        <div className="w-100 h-100 position-relative">
          <div
            className="position-absolute"
            style={{
              textAlign: "center",
              width: "100%",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <h4 className="fw-medium mb-1">
              <div className="d-flex flex-column align-items-center gap-3 justify-content-center">
                <LoadingSpinner padding={false} />
                {jobPercentage !== null
                  ? `Generating video... ${jobPercentage}%`
                  : "Generating video..."}
              </div>
            </h4>
            <p className="fs-6 opacity-75">This should take about a minute.</p>
          </div>
          <OutputThumbnailImage
            src={selectedSourceMediaLink || ""}
            alt="Preview"
            style={{ opacity: 0.15 }}
            draggable={false}
          />
        </div>
      );
    } else {
      return (
        <div className="w-100 h-100 position-relative">
          <div
            className="position-absolute"
            style={{
              textAlign: "center",
              width: "100%",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            {audioToken ? (
              <h4 className="fw-medium">
                {language === "en" ? (
                  <>
                    Click{" "}
                    <b>
                      <FontAwesomeIcon
                        icon={faSparkles}
                        className="me-2 fs-6"
                      />
                      Animate
                    </b>{" "}
                    to start generating
                  </>
                ) : (
                  <>{t("instruction.animate")}</>
                )}
              </h4>
            ) : (
              <h4 className="fw-medium">
                {language === "en" ? (
                  <>
                    <b>
                      <FontAwesomeIcon
                        icon={faWaveformLines}
                        className="me-2 fs-6"
                      />
                      Generate Audio
                    </b>{" "}
                    then click animate
                  </>
                ) : (
                  <>{t("instruction.generateAudio")}</>
                )}
              </h4>
            )}
          </div>
          <OutputThumbnailImage
            src={selectedSourceMediaLink || ""}
            alt="Preview"
            style={{ opacity: 0.15 }}
            draggable={false}
          />
        </div>
      );
    }
  };

  const [selectedSourceMedia, setSelectedSourceMedia] = useState<{
    [key: string]: any;
  }>({});

  const handleSelectedMediaChange = (media: any) => {
    setSelectedSourceMedia(media);
  };

  const selectedSourceMediaLink = selectedSourceMedia?.public_bucket_path
    ? MediaLinks(selectedSourceMedia.media_links).mainURL
    : null;

  const handleJobProgress = (progressPercentage: number | null) => {
    setJobPercentage(progressPercentage);
  };

  const handleJobTokens = async (
    maybeResultToken: string,
    jobToken: string,
    createdAt: Date
  ) => {
    if (!maybeResultToken) {
      return;
    }

    // makes sure that it only processes each job once and exactly when needed
    if (jobProcessedTokens.includes(jobToken)) {
      return;
    }

    const response = await GetMedia(maybeResultToken, {});

    if (
      response &&
      response.media_file &&
      response.media_file.public_bucket_path
    ) {
      const { mainURL } = MediaLinks(response.media_file.media_links);

      if (jobToken === lastEnqueuedJobToken) {
        setGeneratedVideoSrc(mainURL);
        setIsGenerating(false);
        setJobPercentage(null);

        // Pause the source video if it's playing
        if (sourceVideoRef.current && !sourceVideoRef.current.paused) {
          sourceVideoRef.current.pause();
        }
      }

      setJobProcessedTokens(prevTokens => [...prevTokens, jobToken]);
    } else {
      console.error(
        "Failed to retrieve media or media has no public bucket path",
        response
      );
      setIsGenerating(false);
      setGeneratedVideoSrc("");
      setIsEnqueuing(false);
      setJobPercentage(null);
    }
  };

  // const handleDownloadClick = () => {
  //   if (generatedVideoSrc) {
  //     const link = document.createElement("a");
  //     link.href = generatedVideoSrc;
  //     link.download = "output_video.mp4";
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //   } else {
  //     console.error("No video source available for download");
  //   }
  // };

  const handleAudioDelete = useCallback(() => {
    setAudioToken(null);
    setGeneratedVideoSrc("");
    setJobProcessedTokens([]);
    setJobPercentage(null);
    setLastEnqueuedJobToken(null);
    setIsGenerating(false);
  }, [
    setAudioToken,
    setGeneratedVideoSrc,
    setJobProcessedTokens,
    setJobPercentage,
    setLastEnqueuedJobToken,
    setIsGenerating,
  ]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    let voiceTokenFromQuery = queryParams.get("voice");
    const sourceTokenFromQuery = queryParams.get("source");

    setVoiceToken(voiceTokenFromQuery);
    setSourceTokenFromQuery(sourceTokenFromQuery);

    if (!voiceTokenFromQuery) {
      if (featuredTtsVoiceTokens.length > 0) {
        voiceTokenFromQuery =
          featuredTtsVoiceTokens[
            Math.floor(Math.random() * featuredTtsVoiceTokens.length)
          ];
        setVoiceToken(voiceTokenFromQuery);
      }
    }

    if (sourceTokenFromQuery) {
      setSourceTokens(prevTokens => {
        const tokenIndex = prevTokens.indexOf(sourceTokenFromQuery);
        if (tokenIndex !== -1) {
          setSelectedSourceIndex(tokenIndex);
          return prevTokens;
        } else {
          const updatedTokens = [...prevTokens, sourceTokenFromQuery];
          setSelectedSourceIndex(updatedTokens.length - 1);
          return updatedTokens;
        }
      });
    } else if (voiceTokenFromQuery) {
      const precomputedSourceToken = LipsyncTokenMap[voiceTokenFromQuery];
      if (precomputedSourceToken) {
        setSourceTokens(prevTokens => {
          const tokenIndex = prevTokens.indexOf(precomputedSourceToken);
          if (tokenIndex !== -1) {
            setSelectedSourceIndex(tokenIndex);
            return prevTokens;
          } else {
            const updatedTokens = [...prevTokens, precomputedSourceToken];
            setSelectedSourceIndex(updatedTokens.length - 1);
            return updatedTokens;
          }
        });
      }
    }
  }, [location.search]);

  const signupCTA = (
    <>
      {!sessionFetched ? null : (
        <div className="lp-signup-cta text-center">
          <FontAwesomeIcon icon={faLock} className="fs-3 mb-3" />
          <h4 className="mb-1 fw-bold">
            You need to be logged in to use Lip Sync
          </h4>
          <p className="mb-4 opacity-75">
            Please login or sign up to continue.
          </p>
          <div className="d-flex gap-2">
            <Button
              label="Login"
              variant="action"
              onClick={() => {
                history.push("/login?redirect=/ai-live-portrait");
              }}
            />
            <Button
              label="Sign up now"
              onClick={() => {
                history.push("/signup?redirect=/ai-live-portrait");
              }}
            />
          </div>
        </div>
      )}
    </>
  );

  const handleRemoveSourceMedia = () => {
    if (sourceTokenFromQuery) {
      setSourceTokenFromQuery(null);
      setGeneratedVideoSrc("");
      setJobProcessedTokens([]);
      setJobPercentage(null);
      setLastEnqueuedJobToken(null);
      setIsGenerating(false);

      const queryParams = new URLSearchParams(location.search);
      queryParams.delete("source");
      history.push({ search: queryParams.toString() });
      setSelectedSourceIndex(0);
    }
  };

  const handleJobClick = async (job: InferenceJob) => {
    const lipsyncDetails = job.maybeLipsyncDetails;
    const jobResult = job.maybeResultToken;

    if (!lipsyncDetails) {
      return;
    }

    if (currentAudioUrl) {
      setLoadingSelectedAudioResult(true);
      setCurrentAudioUrl(null);
    }

    const { audio_source_token, image_or_video_source_token } = lipsyncDetails;

    const queryParams = new URLSearchParams(location.search);
    if (audio_source_token) {
      queryParams.set("audio", audio_source_token);
    }
    if (image_or_video_source_token) {
      queryParams.set("source", image_or_video_source_token);
    }
    history.push({ search: queryParams.toString() });

    if (jobResult) {
      const response = await GetMedia(jobResult, {});

      if (
        response &&
        response.media_file &&
        response.media_file.public_bucket_path
      ) {
        const { mainURL } = MediaLinks(response.media_file.media_links);

        setGeneratedVideoSrc(mainURL);
        setIsGenerating(false);
        setIsEnqueuing(false);
        setJobPercentage(null);
      } else {
        console.error(
          "Failed to retrieve media or media has no public bucket path",
          response
        );
        setIsGenerating(false);
        setGeneratedVideoSrc("");
        setIsEnqueuing(false);
        setJobPercentage(null);
      }
    } else {
      setIsGenerating(true);
    }

    setLoadingSelectedAudioResult(false);
  };

  return (
    <>
      <Container type="panel" className="mt-3 mt-lg-5">
        <Panel padding={true}>
          <h1 className="fw-bold fs-1">
            <FontAwesomeIcon icon={faLips} className="me-3 fs-2" />
            {t("title.lipsync")}
          </h1>

          <h2
            className="fs-5 opacity-75 fw-semibold pb-2"
            style={{ marginBottom: "3rem" }}
          >
            {t("subtitle.lipsync")}
          </h2>

          {/* {voiceModelTitle ? (
            <Panel
              style={{ marginBottom: "3rem" }}
              className="panel-inner p-3 rounded"
            >
              <div className="d-flex align-items-center gap-2">
                <FontAwesomeIcon icon={faMicrophone} className="me-1" />
                <h3 className="fs-6 fw-semibold mb-0">
                  {voiceModelTitle ? `Current Voice: ${voiceModelTitle}` : null}
                </h3>
              </div>
            </Panel>
          ) : null} */}
          {/* <hr style={{ marginBottom: "2.5rem" }} /> */}

          {!loggedIn && <div style={{ marginBottom: "3rem" }}>{signupCTA}</div>}

          <div>
            <div className="row gx-0 gy-4">
              <div className="col-12 col-lg-3 d-flex gap-3 flex-column align-items-center">
                <div className="w-100">
                  <ThumbnailMediaPicker
                    videoRef={sourceVideoRef}
                    mediaTokens={sourceTokens}
                    selectedIndex={selectedSourceIndex}
                    title={t("step.one.title")}
                    description={t("step.one.subtitle")}
                    badgeLabel={t("badge.sourceMedia")}
                    stepNumber={1}
                    onSelectedMediaChange={handleSelectedMediaChange}
                    showUploadButton={false}
                    showThumbnails={false}
                    stepAlwaysOnTop={true}
                    showRemoveButton={!!sourceTokenFromQuery}
                    onRemoveMedia={handleRemoveSourceMedia}
                  />
                </div>
                <Button
                  className="w-100 d-none d-lg-flex"
                  icon={faDiscord}
                  label={t("button.suggestImages")}
                  variant="secondary"
                  href="https://discord.gg/fakeyou"
                  target="_blank"
                />
              </div>

              <div className="col-12 col-lg-1 d-flex justify-content-center ls-section-between">
                <FontAwesomeIcon
                  icon={faPlus}
                  className="display-3 opacity-75"
                />
              </div>

              <div className="col-12 col-lg-3 d-flex gap-3 flex-column">
                <GenerateTts
                  weightToken={voiceToken}
                  onResultToken={handleAudioResultToken}
                  onAudioDelete={handleAudioDelete}
                  loadingSelectedAudioResult={loadingSelectedAudioResult}
                  setLoadingSelectedAudioResult={setLoadingSelectedAudioResult}
                  currentAudioUrl={currentAudioUrl}
                  setCurrentAudioUrl={setCurrentAudioUrl}
                />
              </div>

              <div className="col-12 col-lg-1 d-flex justify-content-center ls-section-between">
                <FontAwesomeIcon
                  icon={faEquals}
                  className="display-3 opacity-75 d-none d-lg-block"
                />
                <FontAwesomeIcon
                  icon={faArrowDown}
                  className="display-3 opacity-75 d-block d-lg-none"
                />
              </div>

              <div className="col-12 col-lg-4 d-flex gap-3 flex-column">
                <div>
                  <div className="d-flex gap-2 align-items-center mb-1">
                    <div className="lp-step">3</div>
                    <h2 className="fs-5 mb-0 fw-semibold">
                      {t("step.three.title")}
                    </h2>
                  </div>

                  <p className="fw-medium fs-7 opacity-75">
                    {t("step.three.subtitle")}
                  </p>
                </div>

                <div className="lp-media">
                  {renderVideoOrPlaceholder()}

                  <div className="lp-tag">
                    <div className="d-flex gap-2 w-100">
                      <Badge
                        label={t("badge.outputVideo")}
                        color="ultramarine"
                        overlay={true}
                      />
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-column gap-4">
                  <div className="d-flex gap-2">
                    <Button
                      icon={faSparkles}
                      label={
                        !loggedIn
                          ? t("button.signUpAndAnimate")
                          : generatedVideoSrc
                            ? t("button.reanimate")
                            : t("button.animate")
                      }
                      onClick={
                        loggedIn
                          ? enqueueClick
                          : () => history.push("/signup?redirect=/ai-lip-sync")
                      }
                      className="flex-grow-1"
                      // disabled={!isUserContent}
                      isLoading={isEnqueuing || isGenerating}
                      disabled={!loggedIn || !audioToken}
                    />
                    <Tippy
                      theme="fakeyou"
                      content={
                        generatedVideoSrc
                          ? t("tooltip.download")
                          : t("tooltip.downloadNoOutput")
                      }
                    >
                      <div>
                        <Button
                          square={true}
                          icon={faArrowDownToLine}
                          variant="action"
                          download="output_video.mp4"
                          href={generatedVideoSrc}
                          target="_blank"
                          disabled={!loggedIn || !generatedVideoSrc}
                        />
                      </div>
                    </Tippy>
                  </div>

                  <div>
                    <Label
                      label={
                        <div className="d-flex gap-2 align-items-center fw-semibold">
                          <FontAwesomeIcon icon={faHistory} />
                          {t("label.latestLipsyncOutputs")}
                        </div>
                      }
                    />
                    <div>
                      <SessionLsInferenceResultsList
                        onJobTokens={handleJobTokens}
                        onJobProgress={handleJobProgress}
                        onJobClick={handleJobClick}
                      />
                    </div>
                  </div>

                  <div className="d-flex flex-column gap-2 mb-4">
                    <PremiumLock
                      lockPosition="top"
                      requiredPlan="pro"
                      plural={true}
                    >
                      <div className="d-flex gap-3">
                        <Checkbox
                          label={t("check.makePrivate")}
                          onChange={() => {
                            setVisibility(prevVisibility =>
                              prevVisibility === "private"
                                ? "public"
                                : "private"
                            );
                          }}
                          checked={visibility === "private"}
                          className="mb-0"
                        />

                        <Checkbox
                          label={t("check.removeWatermark")}
                          onChange={() => {
                            setRemoveWatermark(
                              prevRemoveWatermark => !prevRemoveWatermark
                            );
                          }}
                          checked={removeWatermark}
                          className="mb-0"
                        />
                      </div>
                    </PremiumLock>

                    {/* {!hasPremium && ( 
                      <div className="d-flex">
                        <Button
                          variant="link"
                          label="Upgrade to Premium to use features above"
                          icon={faStars}
                          to="/pricing"
                        />
                      </div>
                    )} */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </Container>

      <Container type="panel" className="pt-5 mt-5">
        <Panel clear={true}>
          <h2 className="fw-bold mb-3">Try other AI video tools</h2>
          <AITools />
        </Panel>
      </Container>
    </>
  );
}
