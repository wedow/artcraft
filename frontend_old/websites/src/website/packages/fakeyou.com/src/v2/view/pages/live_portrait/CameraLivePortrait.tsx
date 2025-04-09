import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Button,
  CameraInput,
  CameraInputEvent,
  Checkbox,
  Container,
  InputDescription,
  Label,
  Panel,
} from "components/common";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDownToLine,
  faImageUser,
  faLock,
  faSparkles,
  faStars,
} from "@fortawesome/pro-solid-svg-icons";

import "./CameraLivePortrait.scss";
import "./LivePortrait.scss";
import ThumbnailMediaPicker from "./ThumbnailMediaPicker";
import {
  EnqueueFaceMirror,
  EnqueueFaceMirrorResponse,
} from "@storyteller/components/src/api/workflows/EnqueueFaceMirror";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { v4 as uuidv4 } from "uuid";
import { useInferenceJobs, useModal, useSession } from "hooks";
import {
  FrontendInferenceJobType,
  InferenceJob,
} from "@storyteller/components/src/jobs/InferenceJob";
import { AITools } from "components/marketing";
import SessionLpInferenceResultsList from "./SessionLpInferenceResultsList";
import {
  GetMedia,
  MediaLinks,
} from "@storyteller/components/src/api/media_files";
import { useLocation } from "react-router-dom";
import { LivePortraitDetails } from "@storyteller/components/src/api/model_inference/GetModelInferenceJobStatus";
import { useDocumentTitle } from "@storyteller/components/src/hooks/UseDocumentTitle";
import SourceEntityInput from "./SourceEntityInput";
import { useHistory } from "react-router-dom";
import { JobState } from "@storyteller/components/src/jobs/JobStates";
import { useFeatureFlags } from "hooks/useFeatureFlags";
import Maintenance from "components/common/Maintenance";

interface GeneratedVideo {
  sourceIndex: number;
  motionIndex: number;
  sourceToken: string;
  motionToken: string;
  videoSrc: string;
  jobToken: string;
  createdAt: Date;
}

interface CurrentlyGenerating {
  sourceIndex: number;
  motionIndex: number;
  jobState?: JobState;
}

interface JobProgress {
  [key: string]: number | null;
}

const PRECOMPUTED_SOURCE_TOKENS: string[] = [
  "m_2xrse9799wvy8hkv8tbxqxct8089t7", // Mona Lisa
  "m_pt99cdgcanv1m8yejdr3yzxyv5jmps", // Wednesday
  "m_780cd9zhc5tznwcc2d8tnrqgs5dwh7", // Shiba
  "m_mfstb9ac7x657eyb0pbw6ybmfxh25s", // Link
];

const PRECOMPUTED_DRIVER_TOKENS: string[] = [
  "m_z278r5b1r2279xqkxszxjkqhc1dg2g", // Awkward Smile
  "m_dv9pcmmwdpgyevyxsyxcahkhd2c839", // Dance Monkey
  "m_53j0kfaesw4jem4713tttk6142sd0y", // Split
  "m_ar300kqxy3ez8znq9p40y2qejfhsc2", // Slight Smile
];

export default function LivePortrait() {
  const { isVideoToolsEnabled } = useFeatureFlags();

  useDocumentTitle("Live Portrait AI. Free Video Animation");
  const { enqueueInferenceJob } = useInferenceJobs();
  const { loggedIn, loggedInOrModal, sessionFetched, sessionSubscriptions } =
    useSession();
  const { open, close } = useModal();
  const [isEnqueuing, setIsEnqueuing] = useState(false);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const [selectedMotionIndex, setSelectedMotionIndex] = useState(0);
  const [removeWatermark, setRemoveWatermark] = useState(false);
  const [visibility, setVisibility] = useState<"private" | "public">("public");
  const hasPremium = sessionSubscriptions?.hasPaidFeatures();
  const [generatedVideoSrc, setGeneratedVideoSrc] = useState("");
  const [sourceTokens, setSourceTokens] = useState<string[]>([
    ...PRECOMPUTED_SOURCE_TOKENS,
  ]);
  const [motionTokens, setMotionTokens] = useState<string[]>([
    ...PRECOMPUTED_DRIVER_TOKENS,
  ]);
  const numberOfInitialSourceTokensRef = useRef(sourceTokens.length);
  const numberOfInitialSourceTokens = numberOfInitialSourceTokensRef.current;
  const numberOfInitialMotionTokensRef = useRef(motionTokens.length);
  const numberOfInitialMotionTokens = numberOfInitialMotionTokensRef.current;
  const [userSourceToken, setUserSourceToken] = useState<string>("");
  const [userMotionToken, setUserMotionToken] = useState<string>("");
  const [isUserUploaded, setIsUserUploaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [jobProcessedTokens, setJobProcessedTokens] = useState<string[]>([]);
  const [currentlyGeneratingList, setCurrentlyGeneratingList] = useState<
    CurrentlyGenerating[]
  >([]);
  const [jobProgress, setJobProgress] = useState<JobProgress>({});
  const [currentCombinationKey, setCurrentCombinationKey] = useState("");
  const getCombinationKey = (sourceIndex: number, motionIndex: number) =>
    `s${sourceIndex}_m${motionIndex}`;
  const [cameraInputToken, cameraInputTokenSet] = useState("");

  const location = useLocation();
  const history = useHistory();

  const handleJobClick = (job: InferenceJob) => {
    const livePortraitDetails = job.maybeLivePortraitDetails;
    if (livePortraitDetails) {
      const { source_media_file_token, face_driver_media_file_token } =
        livePortraitDetails;

      const sourceIndex = sourceTokens.indexOf(source_media_file_token);
      const motionIndex = motionTokens.indexOf(face_driver_media_file_token);
      setSelectedSourceIndex(sourceIndex);
      setSelectedMotionIndex(motionIndex);
      setCurrentCombinationKey(getCombinationKey(sourceIndex, motionIndex));

      // Find the video for the clicked job
      const videoFromJob = generatedVideos.find(
        video => video.jobToken === job.jobToken
      );
      if (videoFromJob) {
        setGeneratedVideoSrc(videoFromJob.videoSrc);
        setIsGenerating(false);
      } else {
        // If there's no video and the job is still in the generating list, show progress
        const isGenerating = currentlyGeneratingList.some(
          gen =>
            gen.sourceIndex === sourceIndex && gen.motionIndex === motionIndex
        );
        if (isGenerating) {
          const progress =
            jobProgress[getCombinationKey(sourceIndex, motionIndex)] || 0;
          setJobProgress({
            ...jobProgress,
            [getCombinationKey(sourceIndex, motionIndex)]: progress,
          });
          setIsGenerating(true);
        } else {
          setIsGenerating(false);
          setGeneratedVideoSrc("");
        }
      }
    }
  };

  const handleJobStateChange = useCallback(
    (jobToken: string, jobState: JobState) => {
      const currentCombinationKey = getCombinationKey(
        selectedSourceIndex,
        selectedMotionIndex
      );

      if (jobState === JobState.COMPLETE_FAILURE) {
        setCurrentlyGeneratingList(prevList =>
          prevList.filter(
            gen =>
              !(
                gen.sourceIndex === selectedSourceIndex &&
                gen.motionIndex === selectedMotionIndex
              )
          )
        );

        setJobProgress(prevProgress => {
          const updatedProgress = { ...prevProgress };
          delete updatedProgress[currentCombinationKey];
          return updatedProgress;
        });

        setIsGenerating(false);
      }
    },
    [selectedSourceIndex, selectedMotionIndex]
  );

  const handleJobProgress = (progress: number | null) => {
    setJobProgress(prevProgress => ({
      ...prevProgress,
      [currentCombinationKey]: progress,
    }));
  };

  const handleSourceSelect = (index: number) => {
    setIsUserUploaded(index >= numberOfInitialSourceTokens);
    setSelectedSourceIndex(index);
    setCurrentCombinationKey(getCombinationKey(index, selectedMotionIndex));
  };

  const enqueueClick = () => {
    if (
      !loggedInOrModal({
        loginMessage: "Login to finish animating your portrait",
        signupMessage: "Sign up to finish animating your portrait",
      })
    ) {
      return;
    }
    // Clear the generated video when reanimating
    setGeneratedVideoSrc("");
    setIsGenerating(true);

    // Add the current source and motion combination to the generating list
    setCurrentlyGeneratingList(prevList => [
      ...prevList,
      { sourceIndex: selectedSourceIndex, motionIndex: selectedMotionIndex },
    ]);

    setIsEnqueuing(true);

    const combinationKey = getCombinationKey(
      selectedSourceIndex,
      selectedMotionIndex
    );
    setCurrentCombinationKey(combinationKey);

    EnqueueFaceMirror("", {
      creator_set_visibility: visibility,
      face_driver_media_file_token: cameraInputToken,
      maybe_crop: {
        height: 0,
        width: 0,
        x: 0,
        y: 0,
      },
      remove_watermark: removeWatermark,
      source_media_file_token: sourceTokens[selectedSourceIndex],
      used_webcam: true,
      uuid_idempotency_token: uuidv4(),
    }).then((res: EnqueueFaceMirrorResponse) => {
      if (res.success && res.inference_job_token) {
        enqueueInferenceJob(
          res.inference_job_token,
          FrontendInferenceJobType.LivePortrait,
          false
        );
      } else {
        // @ts-ignore
        window.dataLayer.push({
          event: "enqueue_failure",
          page: "/webcam-acting",
          user_id: "$user_id",
        });
        console.error("Failed to enqueue job", res);
        setIsGenerating(false);
        // Remove the combination from currentlyGeneratingList if fail
        setCurrentlyGeneratingList(prevList =>
          prevList.filter(
            gen =>
              gen.sourceIndex !== selectedSourceIndex ||
              gen.motionIndex !== selectedMotionIndex
          )
        );
      }
      setIsEnqueuing(false);
    });
  };

  useEffect(() => {
    if (userSourceToken) {
      setSourceTokens(prevTokens => {
        const tokenIndex = prevTokens.indexOf(userSourceToken);
        if (tokenIndex !== -1) {
          setSelectedSourceIndex(tokenIndex);
          setIsUserUploaded(tokenIndex >= numberOfInitialSourceTokens);
          return prevTokens;
        } else {
          const updatedTokens = [...prevTokens, userSourceToken];
          setSelectedSourceIndex(updatedTokens.length - 1);
          setIsUserUploaded(true);
          return updatedTokens;
        }
      });
      setUserSourceToken("");
    }
  }, [userSourceToken, numberOfInitialSourceTokens]);

  useEffect(() => {
    if (userMotionToken) {
      setMotionTokens(prevTokens => {
        const tokenIndex = prevTokens.indexOf(userMotionToken);
        if (tokenIndex !== -1) {
          setSelectedMotionIndex(tokenIndex);
          setIsUserUploaded(tokenIndex >= numberOfInitialMotionTokens);
          return prevTokens;
        } else {
          const updatedTokens = [...prevTokens, userMotionToken];
          setSelectedMotionIndex(updatedTokens.length - 1);
          setIsUserUploaded(true);
          return updatedTokens;
        }
      });
      setUserMotionToken("");
    }
  }, [userMotionToken, numberOfInitialMotionTokens]);

  const handleOpenUploadSourceModal = () => {
    open({
      component: SourceEntityInput,
      props: {
        onChange: ({ target }: { target: any }) => {
          setUserSourceToken(target.value);
          close();
        },
      },
      width: "small",
    });
  };

  const [, setSelectedSourceMedia] = useState<{
    [key: string]: any;
  }>({});

  const handleSelectedMediaChange = (media: any) => {
    setSelectedSourceMedia(media);
  };

  const handleJobTokens = async (
    maybeResultToken: string,
    jobToken: string,
    createdAt: Date,
    livePortraitDetails?: LivePortraitDetails
  ) => {
    if (!livePortraitDetails) {
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

      const sourceIndex = sourceTokens.indexOf(
        livePortraitDetails.source_media_file_token
      );
      const motionIndex = motionTokens.indexOf(
        livePortraitDetails.face_driver_media_file_token
      );

      const newGeneratedVideo = {
        sourceIndex,
        motionIndex,
        sourceToken: livePortraitDetails.source_media_file_token,
        motionToken: livePortraitDetails.face_driver_media_file_token,
        videoSrc: mainURL,
        jobToken,
        createdAt,
      };

      setGeneratedVideos(prevGeneratedVideos => {
        return [
          ...prevGeneratedVideos.filter(v => v.jobToken !== jobToken),
          newGeneratedVideo,
        ];
      });

      // Set the video source from the clicked job, regardless of its timestamp relative to others
      if (
        selectedSourceIndex === newGeneratedVideo.sourceIndex &&
        selectedMotionIndex === newGeneratedVideo.motionIndex
      ) {
        setGeneratedVideoSrc(mainURL);
        setIsGenerating(false);
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
    }
  };

  const getLatestVideoForCombination = useCallback(
    (sourceIndex: number, motionIndex: number) => {
      const matchingVideos = generatedVideos.filter(
        video =>
          video.sourceIndex === sourceIndex && video.motionIndex === motionIndex
      );
      const sortedVideos = matchingVideos.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const latestVideo =
        sortedVideos.length > 0 ? sortedVideos[0].videoSrc : null;

      return latestVideo;
    },
    [generatedVideos]
  );

  useEffect(() => {
    const latestVideoSrc = getLatestVideoForCombination(
      selectedSourceIndex,
      selectedMotionIndex
    );

    if (latestVideoSrc) {
      setGeneratedVideoSrc(latestVideoSrc);
      setIsGenerating(false);
    } else if (!isUserUploaded) {
      setGeneratedVideoSrc("");
      setIsGenerating(false);
    } else {
      setGeneratedVideoSrc("");
    }
  }, [
    selectedSourceIndex,
    selectedMotionIndex,
    generatedVideos,
    isUserUploaded,
    getLatestVideoForCombination,
  ]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const sourceToken = queryParams.get("source");
    const motionToken = queryParams.get("motion");

    if (sourceToken) {
      setSourceTokens(prevTokens => {
        const tokenIndex = prevTokens.indexOf(sourceToken);
        if (tokenIndex !== -1) {
          setSelectedSourceIndex(tokenIndex);
          setIsUserUploaded(tokenIndex >= numberOfInitialSourceTokens);
          return prevTokens;
        } else {
          const updatedTokens = [...prevTokens, sourceToken];
          setSelectedSourceIndex(updatedTokens.length - 1);
          setIsUserUploaded(true);
          return updatedTokens;
        }
      });
    }

    if (motionToken) {
      setMotionTokens(prevTokens => {
        const tokenIndex = prevTokens.indexOf(motionToken);
        if (tokenIndex !== -1) {
          setSelectedMotionIndex(tokenIndex);
          setIsUserUploaded(tokenIndex >= numberOfInitialMotionTokens);
          return prevTokens;
        } else {
          const updatedTokens = [...prevTokens, motionToken];
          setSelectedMotionIndex(updatedTokens.length - 1);
          setIsUserUploaded(true);
          return updatedTokens;
        }
      });
    }
  }, [
    location.search,
    numberOfInitialSourceTokens,
    numberOfInitialMotionTokens,
  ]);

  const uploadFocusPointSource = useMemo(() => {
    const queryParams = new URLSearchParams(location.search);
    const sourceToken = queryParams.get("source");
    const motionToken = queryParams.get("motion");

    if (motionToken && !sourceToken) {
      return true;
    } else if (!motionToken && sourceToken) {
      return false;
    } else {
      return false;
    }
  }, [location.search]);

  useEffect(() => {
    // When switching source or motion indexes, check if the current combination is generating
    const isCurrentlyGenerating = currentlyGeneratingList.some(
      gen =>
        gen.sourceIndex === selectedSourceIndex &&
        gen.motionIndex === selectedMotionIndex
    );

    if (isCurrentlyGenerating) {
      setIsGenerating(true);
    } else if (generatedVideoSrc) {
      setIsGenerating(false);
    } else if (!isUserUploaded) {
      setIsGenerating(false);
    } else {
      setIsGenerating(false);
    }
  }, [
    selectedSourceIndex,
    selectedMotionIndex,
    currentlyGeneratingList,
    generatedVideoSrc,
    isUserUploaded,
  ]);

  useEffect(() => {
    if (generatedVideos.length > 0) {
      const relevantVideos = generatedVideos.filter(video =>
        currentlyGeneratingList.some(
          gen =>
            gen.sourceIndex === video.sourceIndex &&
            gen.motionIndex === video.motionIndex
        )
      );

      relevantVideos.forEach(video => {
        if (video.jobToken) {
          const jobIndex = currentlyGeneratingList.findIndex(
            gen =>
              gen.sourceIndex === video.sourceIndex &&
              gen.motionIndex === video.motionIndex
          );
          if (jobIndex !== -1) {
            const updatedGeneratingList = [...currentlyGeneratingList];
            updatedGeneratingList.splice(jobIndex, 1);
            setCurrentlyGeneratingList(updatedGeneratingList);

            const isCurrentJobGenerating = currentlyGeneratingList.some(
              gen =>
                gen.sourceIndex === selectedSourceIndex &&
                gen.motionIndex === selectedMotionIndex
            );

            if (!isCurrentJobGenerating) {
              setGeneratedVideoSrc(video.videoSrc);
              setIsGenerating(false);
            }
          }
        }
      });
    }
  }, [
    generatedVideos,
    currentlyGeneratingList,
    selectedSourceIndex,
    selectedMotionIndex,
  ]);

  const handleDownloadClick = () => {
    if (generatedVideoSrc) {
      const link = document.createElement("a");
      link.href = generatedVideoSrc;
      link.download = "output_video.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error("No video source available for download");
    }
  };

  const signupCTA = (
    <>
      {!sessionFetched ? null : (
        <div className="lp-signup-cta text-center">
          <FontAwesomeIcon icon={faLock} className="fs-3 mb-3" />
          <h4 className="mb-1 fw-bold">
            You need to be logged in to use Live Portrait
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

  if (!isVideoToolsEnabled()) {
    return (
      <Maintenance
        title="Webcam Acting is currently in maintenance mode"
        description="We're working hard to bring you the best experience possible. Please check back soon!"
      />
    );
  }

  return (
    <>
      <Container type="panel" className="mt-3 mt-lg-5">
        <Panel padding={true}>
          <h1 className="fw-bold fs-1 mb-0">
            <FontAwesomeIcon icon={faImageUser} className="me-3 fs-2" />
            Webcam Acting
          </h1>
          <p
            className="opacity-75 fw-medium"
            style={{ marginBottom: "2.5rem" }}
          >
            Use AI to transfer facial expressions, audio, and vocals from one
            face video to an image or video.
          </p>

          {!loggedIn && (
            <div style={{ marginBottom: "2.5rem" }}>{signupCTA}</div>
          )}

          <div>
            <div {...{ className: "fy-cam-lp-column-set" }}>
              <div {...{ className: "fy-cam-lp-column" }}>
                <ThumbnailMediaPicker
                  mediaTokens={sourceTokens}
                  selectedIndex={selectedSourceIndex}
                  handleThumbnailClick={handleSourceSelect}
                  title="Select Source"
                  description="This image or video is what the final video will look like."
                  badgeLabel="Source Media"
                  stepNumber={1}
                  onUploadClick={handleOpenUploadSourceModal}
                  onSelectedMediaChange={handleSelectedMediaChange}
                  uploadFocusPoint={uploadFocusPointSource}
                  uploadButtonText={
                    loggedIn
                      ? "Upload your image/video"
                      : "Sign up to upload image/video"
                  }
                />
              </div>
              <div {...{ className: "fy-cam-lp-column" }}>
                <div {...{ className: "fy-cam-lp-camera-section" }}>
                  <CameraInput
                    {...{
                      onChange: ({ target }: CameraInputEvent) =>
                        cameraInputTokenSet(target.value),
                    }}
                  />
                  <InputDescription
                    {...{
                      className: "fy-cam-lp-camera-description mt-3 mb-3",
                      description:
                        "Use your webcam to create a motion reference",
                      stepNumber: 2,
                      title: "Record yourself",
                    }}
                  />
                </div>
                <div className="d-flex flex-column gap-4">
                  <div className="d-flex gap-2">
                    <Button
                      {...{
                        className: "flex-grow-1",
                        disabled: !loggedIn || !cameraInputToken,
                        icon: faSparkles,
                        label: loggedIn
                          ? generatedVideoSrc
                            ? "Re-animate"
                            : "Animate"
                          : "Sign up now to Animate",
                        onClick: loggedIn
                          ? enqueueClick
                          : () =>
                              history.push(
                                "/signup?redirect=/ai-live-portrait"
                              ),
                        isLoading: isEnqueuing || isGenerating,
                      }}
                    />
                    <Tippy theme="fakeyou" content="Download video">
                      <div>
                        <Button
                          square={true}
                          icon={faArrowDownToLine}
                          variant="action"
                          onClick={handleDownloadClick}
                          disabled={!loggedIn}
                        />
                      </div>
                    </Tippy>
                  </div>

                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex gap-3">
                      <Checkbox
                        disabled={!hasPremium}
                        label={"Make Private"}
                        onChange={() => {
                          setVisibility(prevVisibility =>
                            prevVisibility === "private" ? "public" : "private"
                          );
                        }}
                        checked={visibility === "private"}
                      />

                      <Checkbox
                        disabled={!hasPremium}
                        label={"Remove Watermark"}
                        onChange={() => {
                          setRemoveWatermark(
                            prevRemoveWatermark => !prevRemoveWatermark
                          );
                        }}
                        checked={removeWatermark}
                      />
                    </div>

                    {!hasPremium && (
                      <div className="d-flex">
                        <Button
                          variant="link"
                          label="Upgrade to Premium to use features above"
                          icon={faStars}
                          to="/pricing"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {loggedIn && (
              <div className="mt-5 pt-3 order-3">
                <Label label="Latest Outputs" />
                <div>
                  <SessionLpInferenceResultsList
                    onJobTokens={handleJobTokens}
                    addSourceToken={(newToken: string) =>
                      setSourceTokens(prevTokens =>
                        prevTokens.includes(newToken)
                          ? prevTokens
                          : [...prevTokens, newToken]
                      )
                    }
                    addMotionToken={(newToken: string) =>
                      setMotionTokens(prevTokens =>
                        prevTokens.includes(newToken)
                          ? prevTokens
                          : [...prevTokens, newToken]
                      )
                    }
                    onJobClick={handleJobClick}
                    onJobProgress={handleJobProgress}
                    onJobStateChange={handleJobStateChange}
                  />
                </div>
              </div>
            )}
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
