import React, { useEffect, useState } from "react";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import { v4 as uuidv4 } from "uuid";
import { useInferenceJobs, useModal, useSession } from "hooks";
import {
  Button,
  Container,
  Panel,
  SegmentButtons,
  TextArea,
  Slider,
  Label,
  DropdownOptions,
  SessionFetchingSpinner,
  LoginBlock,
} from "components/common";
import { EntityInput } from "components/entities";
import {
  EnqueueVST,
  EnqueueVSTResponse,
} from "@storyteller/components/src/api/workflows/EnqueueVST";
import { Prompt } from "@storyteller/components/src/api/prompts/GetPrompts";
import { Link, useHistory, useParams } from "react-router-dom";
import { STYLE_OPTIONS, STYLES_BY_KEY } from "common/StyleOptions";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import { StyleSelectionButton } from "./StyleSelection/StyleSelectionButton";
import useStyleStore from "hooks/useStyleStore";
import StyleSelectionList from "./StyleSelection/StyleSelectionList";
import { isMobile } from "react-device-detect";
import { AITools } from "components/marketing";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faPaintBrush,
  faSparkles,
  faVideo,
} from "@fortawesome/pro-solid-svg-icons";
import PremiumLock from "components/PremiumLock";
import HowToUseSection from "components/common/HowToUseSection";
import FAQSection from "components/common/FAQSection";
import { useFeatureFlags } from "hooks/useFeatureFlags";
import Maintenance from "components/common/Maintenance";

export default function StyleVideo() {
  const { mediaToken: pageMediaToken } = useParams<{ mediaToken: string }>();
  const { loggedIn, loggedInOrModal, sessionFetched, sessionSubscriptions } =
    useSession();
  const [mediaToken, mediaTokenSet] = useState(pageMediaToken || "");
  const [IPAToken, IPATokenSet] = useState("");
  const [prompt, promptSet] = useState("");
  const [negativePrompt, negativePromptSet] = useState("");
  const [length, lengthSet] = useState(3000);
  const [useFaceDetailer, setUseFaceDetailer] = useState(true);
  const [useUpscaler, setUseUpscaler] = useState(false);
  const [useCinematic, setUseCinematic] = useState(true);
  const [enableLipsync, setEnableLipsync] = useState(false);
  const [strength, setStrength] = useState(1.0);
  const { enqueue } = useInferenceJobs();
  const { setSelectedStyles, setCurrentImages, selectedStyleValues } =
    useStyleStore();
  const { open, modalOpen } = useModal();
  const history = useHistory();
  const [enableSignUpBlock] = useState(false);

  const openStyleSelection = () =>
    open({
      component: StyleSelectionList,
      props: {
        styleOptions: STYLE_OPTIONS,
        onStyleClick: handleStyleClick,
      },
    });

  usePrefixedDocumentTitle("Style Video");

  const { isVideoToolsEnabled } = useFeatureFlags();

  if (!isVideoToolsEnabled()) {
    return (
      <Maintenance
        title="Video Style Transfer is currently in maintenance mode"
        description="We're working hard to bring you the best experience possible. Please check back soon!"
      />
    );
  }

  const onClick = async () => {
    if (
      loggedInOrModal({
        loginMessage: "Login to finish styling your video",
        signupMessage: "Sign up to finish styling your video",
      }) &&
      mediaToken &&
      selectedStyleValues.length > 0
    ) {
      const maxJobs = Math.min(3, selectedStyleValues.length);
      for (let i = 0; i < maxJobs; i++) {
        try {
          const res: EnqueueVSTResponse = await EnqueueVST("", {
            creator_set_visibility: "private",
            enable_lipsync: enableLipsync,
            ...(IPAToken ? { global_ipa_media_token: IPAToken } : {}),
            input_file: mediaToken,
            negative_prompt: negativePrompt,
            prompt,
            style: selectedStyleValues[i],
            trim_end_millis: length,
            trim_start_millis: 0,
            use_face_detailer: useFaceDetailer,
            use_cinematic: useCinematic,
            use_upscaler: useUpscaler,
            use_strength: strength,
            uuid_idempotency_token: uuidv4(),
          });

          if (res.success && res.inference_job_token) {
            enqueue(
              res.inference_job_token,
              FrontendInferenceJobType.VideoStyleTransfer,
              true
            );
          } else {
            // @ts-ignore
            window.dataLayer.push({
              event: "enqueue_failure",
              page: "/style-video",
              user_id: "$user_id",
            });
            console.log("Failed to enqueue job", res);
          }
        } catch (error) {
          console.error("Error enqueuing job", error);
        }
      }
    }
  };

  const lengthOptions = [
    { label: "3 seconds", value: 3000 },
    { label: "5 seconds", value: 5000 },
    { label: "7 seconds", value: 7000 },
  ];

  const proOrElite =
    sessionSubscriptions?.hasActiveProSubscription() ||
    sessionSubscriptions?.hasActiveEliteSubscription();

  const onPromptUpdate = (prompt: Prompt | null) => {
    promptSet(prompt?.maybe_positive_prompt || "");
    negativePromptSet(prompt?.maybe_negative_prompt || "");
    const styleOption = STYLES_BY_KEY.get(prompt?.maybe_style_name || "");
    if (styleOption) {
      setSelectedStyles(
        [styleOption.value],
        [styleOption.label],
        [styleOption.image || ""]
      );
    }
    IPATokenSet(prompt?.maybe_global_ipa_image_token || "");
    setStrength(prompt?.maybe_strength || 1.0);
    setUseFaceDetailer(!!prompt?.used_face_detailer);
    setUseUpscaler(!!prompt?.used_upscaler);
    setUseCinematic(!!prompt?.use_cinematic);
    setEnableLipsync(!!prompt?.lipsync_enabled);
  };

  const handleSliderChange = ({ target }: { target: any }) => {
    setStrength(parseFloat(target.value));
  };

  const handleStyleClick = (
    updatedStyles: string[],
    updatedLabels: string[],
    updatedImages: string[]
  ) => {
    setSelectedStyles(updatedStyles, updatedLabels, updatedImages);
    setCurrentImages(updatedImages);
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!modalOpen) {
      if (selectedStyleValues.length === 0) {
        const firstStyle = STYLE_OPTIONS[0];
        setSelectedStyles(
          [firstStyle.value],
          [firstStyle.label],
          [firstStyle.image || ""]
        );
        setCurrentImages([firstStyle.image || ""]);
      }
    }
  }, [modalOpen, selectedStyleValues, setSelectedStyles, setCurrentImages]);

  const vstInfo = (
    <div className="d-flex gap-3 justify-content-center">
      <div>
        <div
          className="overflow-hidden"
          style={{
            maxHeight: "250px",
            height: "100%",
          }}
        >
          {!isMobile ? (
            <video
              preload="metadata"
              style={{
                height: "100%",
                width: "100%",
                objectFit: "contain",
                overflow: "hidden",
              }}
              autoPlay={true}
              controls={false}
              muted={true}
              loop={true}
              playsInline={true}
            >
              <source src="/videos/vst_banner_desktop.mp4" type="video/mp4" />
            </video>
          ) : (
            <video
              preload="metadata"
              style={{
                height: "100%",
                width: "100%",
                objectFit: "contain",
                overflow: "hidden",
              }}
              autoPlay={true}
              controls={false}
              muted={true}
              loop={true}
              playsInline={true}
              className="px-2"
            >
              <source src="/videos/vst_banner_mobile.mp4" type="video/mp4" />
            </video>
          )}
        </div>
      </div>
    </div>
  );

  const signupCTA = (
    <>
      {!sessionFetched ? null : (
        <div className="lp-signup-cta text-center h-100">
          <FontAwesomeIcon icon={faLock} className="fs-3 mb-3" />
          <h4 className="mb-1 fw-bold">
            You need to be logged in to use Video Style Transfer
          </h4>
          <p className="mb-4 opacity-75">
            Please login or sign up to upload a video.
          </p>
          <div className="d-flex gap-2">
            <Button
              label="Login"
              variant="action"
              onClick={() => {
                history.push("/login?redirect=/style-video");
              }}
            />
            <Button
              label="Sign up now"
              onClick={() => {
                history.push("/signup?redirect=/style-video");
              }}
            />
          </div>
        </div>
      )}
    </>
  );

  if (!sessionFetched) {
    return <SessionFetchingSpinner />;
  }

  if (!loggedIn) {
    return (
      <LoginBlock
        title="You need to be logged in to use Video Style Transfer"
        redirect="/style-video"
      />
    );
  }

  const faqItems = [
    {
      question: "What is AI Video Style Transfer?",
      answer:
        "FakeYou's AI Video Style Transfer is a powerful tool that transforms your videos by applying artistic styles and visual effects using advanced AI technology. Upload any video and choose from our collection of styles to create stunning visual transformations. With features like face detailing, cinematic enhancement, and upscaling, you can create professional-looking stylized videos for content creation, social media, or artistic projects.",
    },
    {
      question: "How do I start using AI Video Style Transfer?",
      answer:
        "Getting started is simple: Upload your video, choose your preferred style, and customize settings like style strength (0-100%) and quality options. You can enhance your results using features like Face Detailer for better facial details, Cinematic mode for dramatic effects, and our Upscaler for higher quality output. You can even add a reference image to further guide the style transfer process.",
    },
    {
      question: "What types of video styles can I choose from?",
      answer:
        "Our style collection offers a wide range of options, from artistic styles like anime, watercolor, and oil painting to modern effects like cyberpunk, noir, and fantasy themes. Each style can be fine-tuned using our style strength slider, and you can further customize the look using positive and negative text prompts to guide the AI transformation process.",
    },
    {
      question: "Can I use AI Video Style Transfer for any type of video?",
      answer:
        "Yes! Our AI Video Style Transfer works with most types of videos, though best results are achieved with clear, well-lit footage.",
    },
    {
      question: "How long does it take to process a video?",
      answer:
        "Processing time varies depending on video length (3-7 seconds), selected quality options, and current system load. Using features like Face Detailer, Cinematic mode, or Upscaler will increase processing time but deliver higher quality results. You can generate multiple style variations simultaneously (up to 3) to explore different looks for your video.",
    },
  ];

  const howToUseSteps = [
    {
      icon: faVideo,
      title: "Step 1: Upload Your Video",
      description:
        "Start by uploading your video (up to 7 seconds with Pro/Elite subscription). For best results, use clear, well-lit footage. Your video will be the foundation for the style transformation, so quality matters!",
    },
    {
      icon: faPaintBrush,
      title: "Step 2: Choose Your Style",
      description:
        "Select from our diverse collection of AI video styles. Fine-tune your selection using the style strength slider (0-100%) and enhance it further with text prompts. You can even upload a reference image to guide the style transfer process.",
    },

    {
      icon: faSparkles,
      title: "Step 3: Generate and Share",
      description:
        "Click 'Generate Styled Video' to start the transformation. You can create up to 3 variations simultaneously to explore different looks. Once complete, download your stylized video for sharing on social media, content creation, or artistic projects.",
    },
  ];

  return (
    <>
      <Container className="mt-3 mt-lg-5" type="panel">
        <Panel className="d-block d-lg-none mb-3">{vstInfo}</Panel>
        <div className="row flex-lg-row-reverse g-3">
          <div className="col-12 col-lg-8 col-xl-9 d-flex flex-column gap-3">
            <Panel className="d-none d-lg-block">{vstInfo}</Panel>

            <Panel padding={true} className="h-auto">
              <h2 className="fw-bold mb-3 d-block d-lg-none">Style a Video</h2>
              <div className="d-flex align-items-center">
                {!mediaToken && (
                  <div className="mb-2">
                    <div className="focus-point" />
                  </div>
                )}
                <Label label="Choose a Video" />
              </div>

              <div
                style={{
                  height: "calc(100vh - 250px - 65px - 240px)",
                  minHeight: "400px",
                }}
              >
                {enableSignUpBlock && !loggedIn ? (
                  signupCTA
                ) : (
                  <EntityInput
                    {...{
                      accept: ["video"],
                      aspectRatio: "landscape",
                      name: "mediaToken",
                      className: "h-100",
                      GApage: "/style-video",
                      value: mediaToken,
                      onPromptUpdate,
                      onChange: ({ target }: { target: any }) => {
                        mediaTokenSet(target.value);
                      },
                      type: "media",
                    }}
                  />
                )}
              </div>

              <div className="d-none d-lg-flex justify-content-center w-100 mt-3">
                {enableSignUpBlock && !loggedIn ? (
                  <Button
                    label="Sign up now to Generate Styled Video"
                    onClick={() => {
                      history.push("/signup?redirect=/style-video");
                    }}
                  />
                ) : (
                  <Button
                    {...{
                      disabled: !mediaToken,
                      label: "Generate Styled Video",
                      onClick,
                      variant: "primary",
                      className: "px-5 mt-2",
                    }}
                  />
                )}
              </div>
            </Panel>
          </div>
          <div className="col-12 col-lg-4 col-xl-3">
            <Panel
              padding={true}
              style={{ height: "100%", minHeight: "calc(100vh-500px)" }}
            >
              <div className="d-flex flex-column">
                <h2 className="fw-bold mb-3 d-none d-lg-block">
                  Style a Video
                </h2>
                <div>
                  <StyleSelectionButton
                    onClick={openStyleSelection}
                    className="mb-3"
                  />
                  <div>
                    <TextArea
                      {...{
                        label: "Text Prompt",
                        placeholder: "Describe your video here...",
                        rows: 2,
                        onChange: ({ target }: { target: any }) => {
                          promptSet(target.value);
                        },
                        value: prompt,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <DropdownOptions buttonPosition="top">
                    <div className="mt-3">
                      <TextArea
                        {...{
                          label: "Negative Prompt",
                          placeholder:
                            "Type what you don't want in your video...",
                          rows: 1,
                          onChange: ({ target }: { target: any }) => {
                            negativePromptSet(target.value);
                          },
                        }}
                      />
                    </div>

                    <div className="my-3">
                      <h6>Style Strength ({Math.round(strength * 100)}%)</h6>
                      <div className="w-100">
                        <Slider
                          min={0.0}
                          max={1.0}
                          step={0.01}
                          onChange={handleSliderChange}
                          value={strength}
                          className="w-100"
                        />
                      </div>
                    </div>

                    <div>
                      <h6 className="pb-2">Quality Options</h6>
                      <div>
                        <div className="form-check form-switch w-100">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="useFaceDetailer"
                            checked={useFaceDetailer}
                            onChange={() =>
                              setUseFaceDetailer(!useFaceDetailer)
                            }
                          />
                          <label
                            className="form-check-label"
                            htmlFor="useFaceDetailer"
                          >
                            Use Face Detailer
                          </label>
                        </div>
                      </div>
                      <div>
                        <div className="form-check form-switch w-100">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="useUpscaler"
                            checked={useUpscaler}
                            onChange={() => setUseUpscaler(!useUpscaler)}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="useUpscaler"
                          >
                            Use Upscaler
                          </label>
                        </div>
                      </div>
                      <div>
                        <div className="form-check form-switch w-100">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="useCinematic"
                            checked={useCinematic}
                            onChange={() => setUseCinematic(!useCinematic)}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="useCinematic"
                          >
                            Use Cinematic
                          </label>
                        </div>
                      </div>
                      <div>
                        <div className="form-check form-switch w-100">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="enableLipsync"
                            checked={enableLipsync}
                            onChange={() => setEnableLipsync(!enableLipsync)}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="enableLipsync"
                          >
                            Preserve Lip Movement
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="w-100 mt-3">
                      <EntityInput
                        {...{
                          accept: ["image"],
                          aspectRatio: "square",
                          className: "w-100",
                          GApage: "/style-video",
                          label: "Additional Style Reference Image (Optional)",
                          name: "IPAToken",
                          value: IPAToken,
                          onChange: ({ target }: { target: any }) => {
                            IPATokenSet(target.value);
                          },

                          type: "media",
                        }}
                      />
                    </div>
                  </DropdownOptions>
                </div>

                <div className="mt-3">
                  {sessionSubscriptions && (
                    <PremiumLock requiredPlan="pro" lockPosition="top">
                      <SegmentButtons
                        {...{
                          className: "fy-style-video-length",
                          label: "Video Duration",
                          onChange: ({ target }: { target: any }) => {
                            lengthSet(target.value);
                          },
                          options: lengthOptions,
                          value: length,
                          highlight: true,
                        }}
                      />
                    </PremiumLock>
                  )}

                  {!proOrElite && (
                    <Link
                      {...{
                        className: "d-flex fs-7 lh-1 pt-3",
                        to: "/pricing",
                      }}
                    >
                      Subscribe to Pro or Elite for 5 or 7 second videos
                    </Link>
                  )}
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </Container>

      <div
        className="d-flex d-lg-none justify-content-center w-100 mt-5 position-fixed bottom-0 p-3 bg-panel"
        style={{ zIndex: 3 }}
      >
        {enableSignUpBlock && !loggedIn ? (
          <Button
            label="Sign up now to Generate Styled Video"
            onClick={() => {
              history.push("/signup?redirect=/style-video");
            }}
          />
        ) : (
          <Button
            {...{
              disabled: !mediaToken,
              label: "Generate Styled Video",
              onClick,
              variant: "primary",
              className: "px-5 mt-2",
            }}
          />
        )}
      </div>

      <HowToUseSection
        title="How to Use AI Video Style Transfer"
        steps={howToUseSteps}
      />

      <FAQSection faqItems={faqItems} />

      <Container type="panel" className="pt-5 mt-5">
        <Panel clear={true}>
          <h2 className="fw-bold mb-3">Try other AI video tools</h2>
          <AITools />
        </Panel>
        {/* <MentionsSection /> */}
        {/* <StorytellerStudioCTA /> */}
      </Container>
    </>
  );
}
