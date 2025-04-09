import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  faImage,
  faImageUser,
  faLips,
  faLock,
  faPlus,
  faSparkles,
  faVideo,
} from "@fortawesome/pro-solid-svg-icons";
import "./LivePortrait.scss";
import ThumbnailMediaPicker from "./ThumbnailMediaPicker";
import {
  EnqueueFaceMirror,
  EnqueueFaceMirrorResponse,
  MediaFileCropArea,
} from "@storyteller/components/src/api/workflows/EnqueueFaceMirror";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { v4 as uuidv4 } from "uuid";
import { useInferenceJobs, useLocalize, useModal, useSession } from "hooks";
import {
  FrontendInferenceJobType,
  InferenceJob,
} from "@storyteller/components/src/jobs/InferenceJob";
import { AITools } from "components/marketing";
import LoadingSpinner from "components/common/LoadingSpinner";
import SessionLpInferenceResultsList from "./SessionLpInferenceResultsList";
import {
  GetMedia,
  MediaLinks,
} from "@storyteller/components/src/api/media_files";
import { useLocation } from "react-router-dom";
import { LivePortraitDetails } from "@storyteller/components/src/api/model_inference/GetModelInferenceJobStatus";
import { useDocumentTitle } from "@storyteller/components/src/hooks/UseDocumentTitle";
import SourceEntityInput from "./SourceEntityInput";
import MotionEntityInput from "./MotionEntityInput";
import OutputThumbnailImage from "./OutputThumbnailImage";
import { useHistory } from "react-router-dom";
import { JobState } from "@storyteller/components/src/jobs/JobStates";
import PremiumLock from "components/PremiumLock";
import HowToUseSection from "components/common/HowToUseSection";
import FAQSection from "components/common/FAQSection";
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
  useDocumentTitle("Live Portrait AI. Free Video Animation");
  const { enqueueInferenceJob } = useInferenceJobs();
  const { loggedIn, loggedInOrModal, sessionFetched } = useSession();
  const { open, close } = useModal();
  const [isEnqueuing, setIsEnqueuing] = useState(false);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const [selectedMotionIndex, setSelectedMotionIndex] = useState(0);
  const [removeWatermark, setRemoveWatermark] = useState(false);
  const [visibility, setVisibility] = useState<"private" | "public">("public");
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
  const [resultTokens, setResultTokens] = useState<{
    [key: string]: string | null;
  }>({});
  const [currentlyGeneratingList, setCurrentlyGeneratingList] = useState<
    CurrentlyGenerating[]
  >([]);
  const [jobProgress, setJobProgress] = useState<JobProgress>({});
  const [currentCombinationKey, setCurrentCombinationKey] = useState("");
  const getCombinationKey = (sourceIndex: number, motionIndex: number) =>
    `s${sourceIndex}_m${motionIndex}`;

  const location = useLocation();
  const history = useHistory();

  const { t, language } = useLocalize("LivePortrait");
  const { isVideoToolsEnabled } = useFeatureFlags();

  const precomputedVideos = useMemo(
    () => [
      // Source 1: Mona Lisa
      { src: "/videos/live-portrait/1_1.mp4" }, // Smile
      { src: "/videos/live-portrait/1_2.mp4" }, // Dance Monkey
      {
        src: "https://storage.googleapis.com/vocodes-public/media/9/w/s/v/x/9wsvx4fyaraf2prgq1zgpsrq0f1phfs1/storyteller_9wsvx4fyaraf2prgq1zgpsrq0f1phfs1.mp4",
      }, // Split (Mona Lisa)
      {
        src: "https://storage.googleapis.com/vocodes-public/media/w/4/8/k/7/w48k741jsfgnv82vbmhc3meycf77sx1r/storyteller_w48k741jsfgnv82vbmhc3meycf77sx1r.mp4",
      }, // Slight Smile (Mona Lisa)
      // Source 2: Wednesday
      { src: "/videos/live-portrait/2_1.mp4" }, // Smile
      { src: "/videos/live-portrait/2_2.mp4" }, // Dance Monkey
      {
        src: "https://storage.googleapis.com/vocodes-public/media/v/6/7/3/b/v673bmm04f8vk0815d00fnm37qd53n7n/storyteller_v673bmm04f8vk0815d00fnm37qd53n7n.mp4",
      }, // Split (Wednesday)
      {
        src: "https://storage.googleapis.com/vocodes-public/media/m/5/w/k/0/m5wk0ev4wf7wrqmhgxb334ja21mz6p3j/storyteller_m5wk0ev4wf7wrqmhgxb334ja21mz6p3j.mp4",
      }, // Slight Smile (Wednesday)
      // Source 3: Shiba
      {
        src: "https://storage.googleapis.com/vocodes-public/media/y/5/k/p/t/y5kptzew0t63pq12y83v0cstv8mkzvk0/storyteller_y5kptzew0t63pq12y83v0cstv8mkzvk0.mp4",
      }, // Smile (Shiba)
      {
        src: "https://storage.googleapis.com/vocodes-public/media/2/f/m/v/m/2fmvmwv65zehbyyzs1bd9mth02b8jsqr/storyteller_2fmvmwv65zehbyyzs1bd9mth02b8jsqr.mp4",
      }, // Dance Monkey (Shiba)
      {
        src: "https://storage.googleapis.com/vocodes-public/media/v/d/n/f/x/vdnfxzzxer8ghjb76s1yf0htx1e59fpr/storyteller_vdnfxzzxer8ghjb76s1yf0htx1e59fpr.mp4",
      }, // Split (Shiba)
      {
        src: "https://storage.googleapis.com/vocodes-public/media/j/w/5/c/m/jw5cmgsdwpr0d7ekdvjnf5rac5w08nbx/storyteller_jw5cmgsdwpr0d7ekdvjnf5rac5w08nbx.mp4",
      }, // Slight Smile (Shiba)
      // Source 4: Link
      {
        src: "https://storage.googleapis.com/vocodes-public/media/3/v/m/0/t/3vm0t89v1jaaft8rrr23gtv22r3fnqr9/storyteller_3vm0t89v1jaaft8rrr23gtv22r3fnqr9.mp4",
      }, // Smile (Link)
      {
        src: "https://storage.googleapis.com/vocodes-public/media/m/a/8/e/7/ma8e7s6zgggcbywbp08kqk4gzgjfe7pw/storyteller_ma8e7s6zgggcbywbp08kqk4gzgjfe7pw.mp4",
      }, // Dance Monkey (Link)
      {
        src: "https://storage.googleapis.com/vocodes-public/media/s/m/9/c/6/sm9c6gewq4cfcebc0j79bama8bn2ht7m/storyteller_sm9c6gewq4cfcebc0j79bama8bn2ht7m.mp4",
      }, // Split (Link)
      {
        src: "https://storage.googleapis.com/vocodes-public/media/3/v/b/7/3/3vb736v1rmpefynr7xamdajf2vt99bam/storyteller_3vb736v1rmpefynr7xamdajf2vt99bam.mp4",
      }, // Slight Smile (Link)
    ],
    []
  );

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

  const handleMotionSelect = (index: number) => {
    setIsUserUploaded(index >= numberOfInitialMotionTokens);
    setSelectedMotionIndex(index);
    setCurrentCombinationKey(getCombinationKey(selectedSourceIndex, index));
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
      face_driver_media_file_token: motionTokens[selectedMotionIndex],
      maybe_crop: cropArea,
      remove_watermark: removeWatermark,
      source_media_file_token: sourceTokens[selectedSourceIndex],
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
          page: "/live-portrait",
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

  const renderVideoOrPlaceholder = () => {
    const isCurrentlyGenerating = currentlyGeneratingList.some(
      gen =>
        gen.sourceIndex === selectedSourceIndex &&
        gen.motionIndex === selectedMotionIndex
    );

    const currentProgress =
      jobProgress[
        getCombinationKey(selectedSourceIndex, selectedMotionIndex)
      ] || null;

    const latestVideoSrc = getLatestVideoForCombination(
      selectedSourceIndex,
      selectedMotionIndex
    );

    const precomputedVideoSrc = getPrecomputedVideoSrc();

    const isUserUploadedContent =
      selectedSourceIndex >= numberOfInitialSourceTokens ||
      selectedMotionIndex >= numberOfInitialMotionTokens;

    // Show generated or precomputed video if available
    if (latestVideoSrc && !isCurrentlyGenerating) {
      return (
        <video
          loop
          autoPlay
          muted
          playsInline
          controls={true}
          preload="auto"
          key={latestVideoSrc}
        >
          <source src={latestVideoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    } else if (isCurrentlyGenerating) {
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
            <h4 className="fw-medium">
              <div className="d-flex flex-column align-items-center gap-3 justify-content-center">
                <LoadingSpinner padding={false} />
                {currentProgress !== null
                  ? `${t("output.label.generating")} ${currentProgress}%`
                  : `${t("output.label.generating")}`}
              </div>
            </h4>
          </div>
          <OutputThumbnailImage
            src={selectedSourceMediaLink || ""}
            alt="Preview"
            style={{ opacity: 0.15 }}
            draggable={false}
          />
        </div>
      );
    } else if (precomputedVideoSrc && !isUserUploadedContent) {
      return (
        <video
          loop
          autoPlay
          muted
          playsInline
          controls={true}
          preload="auto"
          key={precomputedVideoSrc}
        >
          <source src={precomputedVideoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    } else {
      // Show "Click to Animate" if no video is available
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
            <h4 className="fw-medium">
              {language === "en" ? (
                <>
                  Click{" "}
                  <b>
                    <FontAwesomeIcon icon={faSparkles} className="me-2 fs-6" />
                    Animate
                  </b>{" "}
                  to start generating
                </>
              ) : (
                <>{t("instruction.animate")}</>
              )}
            </h4>
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

  const getPrecomputedVideoSrc = useCallback(() => {
    const index =
      selectedSourceIndex * PRECOMPUTED_DRIVER_TOKENS.length +
      selectedMotionIndex;
    if (index >= 0 && index < precomputedVideos.length) {
      return precomputedVideos[index].src;
    }
    return "";
  }, [selectedSourceIndex, selectedMotionIndex, precomputedVideos]);

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

  const isUserContent =
    selectedSourceIndex >= numberOfInitialSourceTokens ||
    selectedMotionIndex >= numberOfInitialMotionTokens;

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

  const handleOpenUploadMotionModal = () => {
    open({
      component: MotionEntityInput,
      props: {
        onChange: ({ target }: { target: any }) => {
          setUserMotionToken(target.value);
          close();
        },
      },
      width: "small",
    });
  };

  const [selectedSourceMedia, setSelectedSourceMedia] = useState<{
    [key: string]: any;
  }>({});

  const handleSelectedMediaChange = (media: any) => {
    setSelectedSourceMedia(media);
  };

  const selectedSourceMediaLink =
    MediaLinks(selectedSourceMedia?.media_links).mainURL || null;

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

      const sourceToken = livePortraitDetails.source_media_file_token;
      const motionToken = livePortraitDetails.face_driver_media_file_token;

      const combinationKey = `${sourceToken}_${motionToken}`;

      setResultTokens(prevTokens => ({
        ...prevTokens,
        [combinationKey]: maybeResultToken,
      }));

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

  const uploadFocusPointMotion = useMemo(() => {
    const queryParams = new URLSearchParams(location.search);
    const sourceToken = queryParams.get("source");
    const motionToken = queryParams.get("motion");

    if (sourceToken && !motionToken) {
      return true;
    } else if (!sourceToken && motionToken) {
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

  if (!isVideoToolsEnabled()) {
    return (
      <Maintenance
        title="Live Portrait is currently under maintenance"
        description="We're working hard to bring you the best experience possible. Please check back soon!"
      />
    );
  }

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

  const combinationKey = `${sourceTokens[selectedSourceIndex]}_${motionTokens[selectedMotionIndex]}`;

  return (
    <>
      <Container type="panel" className="mt-3 mt-lg-5">
        <Panel padding={true}>
          <h1 className="fw-bold fs-1 mb-0">
            <FontAwesomeIcon icon={faImageUser} className="me-3 fs-2" />
            {t("title.livePortrait")}
          </h1>
          <p
            className="opacity-75 fw-medium"
            style={{ marginBottom: "2.5rem" }}
          >
            {t("subtitle.livePortrait")}
          </p>

          {!loggedIn && (
            <div style={{ marginBottom: "2.5rem" }}>{signupCTA}</div>
          )}

          <div>
            <div className="row gx-0 gy-4">
              <div
                className="col-12 col-lg-3 d-flex gap-3 flex-column"
                // style={{ paddingTop: "4.2%" }}
              >
                <ThumbnailMediaPicker
                  mediaTokens={sourceTokens}
                  selectedIndex={selectedSourceIndex}
                  handleThumbnailClick={handleSourceSelect}
                  title={t("step.one.title")}
                  description={t("step.one.subtitle")}
                  badgeLabel={t("badge.source")}
                  stepNumber={1}
                  onUploadClick={handleOpenUploadSourceModal}
                  onSelectedMediaChange={handleSelectedMediaChange}
                  uploadFocusPoint={uploadFocusPointSource}
                  uploadButtonText={
                    loggedIn
                      ? t("button.uploadImageVideo")
                      : t("button.signUpToUpload")
                  }
                />
              </div>

              <div className="col-12 col-lg-1 d-flex justify-content-center lp-section-between">
                <FontAwesomeIcon
                  icon={faPlus}
                  className="display-3 opacity-75"
                />
              </div>

              <div
                className="col-12 col-lg-3 d-flex gap-3 flex-column"
                // style={{ paddingTop: "4.2%" }}
              >
                <ThumbnailMediaPicker
                  mediaTokens={motionTokens}
                  selectedIndex={selectedMotionIndex}
                  handleThumbnailClick={handleMotionSelect}
                  title={t("step.two.title")}
                  description={t("step.two.subtitle")}
                  badgeLabel={t("badge.motion")}
                  cropper={true}
                  cropArea={cropArea}
                  setCropArea={setCropArea}
                  stepNumber={2}
                  onUploadClick={handleOpenUploadMotionModal}
                  uploadFocusPoint={uploadFocusPointMotion}
                  uploadButtonText={
                    loggedIn
                      ? t("button.uploadMotionVideo")
                      : t("button.signUpToUpload")
                  }
                />
              </div>

              <div className="col-12 col-lg-1 d-flex justify-content-center lp-section-between">
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
                <div className="lp-media">
                  {renderVideoOrPlaceholder()}

                  <div className="lp-tag">
                    <div className="d-flex gap-2 w-100">
                      <Badge
                        label={t("badge.output")}
                        color="ultramarine"
                        overlay={true}
                      />
                      {!isUserContent && (
                        <Badge
                          label={t("badge.pregeneratedExample")}
                          color="gray"
                          overlay={true}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-column gap-4">
                  <div className="d-flex flex-column gap-3">
                    {generatedVideoSrc && resultTokens[combinationKey] && (
                      <Button
                        icon={faLips}
                        label={t("button.useWithLipsync")}
                        onClick={() =>
                          history.push(
                            `/ai-lip-sync?source=${resultTokens[combinationKey]}`
                          )
                        }
                        className="flex-grow-1"
                        variant="primary"
                      />
                    )}

                    <div className="d-flex gap-2">
                      <Button
                        icon={isUserContent ? faSparkles : undefined}
                        label={
                          !loggedIn && isUserContent
                            ? t("button.signUpToAnimate")
                            : isUserContent
                              ? generatedVideoSrc
                                ? t("button.reanimate")
                                : t("button.animate")
                              : !loggedIn
                                ? t("button.signUpToAnimate")
                                : t("button.uploadToGenerate")
                        }
                        onClick={
                          loggedIn
                            ? enqueueClick
                            : () =>
                                history.push(
                                  "/signup?redirect=/ai-live-portrait"
                                )
                        }
                        className="flex-grow-1"
                        // disabled={!isUserContent}
                        isLoading={isEnqueuing || isGenerating}
                        disabled={!isUserContent && loggedIn}
                        variant={generatedVideoSrc ? "action" : "primary"}
                      />

                      <Tippy
                        theme="fakeyou"
                        content={
                          generatedVideoSrc && isUserContent
                            ? t("tooltip.download")
                            : t("tooltip.downloadNoOutput")
                        }
                      >
                        <div>
                          <Button
                            square={true}
                            icon={faArrowDownToLine}
                            variant="action"
                            onClick={handleDownloadClick}
                            disabled={!generatedVideoSrc}
                          />
                        </div>
                      </Tippy>
                    </div>
                  </div>

                  <div className="d-flex flex-column gap-2">
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

              {loggedIn && (
                <div className="mt-5 pt-3 order-3">
                  <Label label={t("label.latestOutputs")} />
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
          </div>
        </Panel>
      </Container>

      <HowToUseSection
        title="How to Use Live Portrait AI"
        steps={howToUseSteps}
      />

      <FAQSection faqItems={faqItems} />

      <Container type="panel" className="pt-5 mt-5">
        <Panel clear={true}>
          <h2 className="fw-bold mb-3">Try other AI video tools</h2>
          <AITools />
        </Panel>
      </Container>
    </>
  );
}

const faqItems = [
  {
    question: "What is Live Portrait AI?",
    answer:
      "Live Portrait AI is an advanced animation tool that transforms static photos into dynamic videos using AI technology. It can animate faces in photos to match the expressions, movements, and emotions from a driver video, creating realistic and engaging animations.",
  },
  {
    question: "What types of images can I animate?",
    answer:
      "Live Portrait AI works with a wide range of images, including human portraits, pet photos, artwork, and character illustrations. The image should have a clear, visible face for the best results. It works particularly well with front-facing portraits.",
  },
  {
    question: "How does Live Portrait AI work?",
    answer:
      "The technology uses AI-powered reenactment to map facial movements from a driver video onto your source image. It analyzes facial features and expressions in both the source image and driver video, then creates a seamless animation that maintains the identity of your source image while adopting the movements from the driver.",
  },
  {
    question: "Can I use my own motion videos?",
    answer:
      "Yes! While we provide a selection of pre-made motion videos, you can upload your own custom videos to drive the animation. This gives you complete creative control over how your portrait will move and express itself.",
  },
];

const howToUseSteps = [
  {
    icon: faImage,
    title: "Step 1: Upload Your Photo or Video",
    description:
      "Select a clear portrait photo with a visible face. Our AI will automatically detect and prepare it for animation.",
  },
  {
    icon: faVideo,
    title: "Step 2: Choose Motion",
    description:
      "Pick a motion face video that defines how your photo will move. Use our preset animations or upload your own custom motion video. Make sure the video has a clear face and minimal shoulder movements for the best results.",
  },
  {
    icon: faSparkles,
    title: "Step 3: Generate Animation",
    description:
      "Click 'Animate' and watch as our AI brings your photo to life. Download your animated video in high quality for sharing or further editing.",
  },
];
