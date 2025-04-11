import React, { useState } from "react";
import { MediaBrowser } from "components/modals";
import {
  Button,
  Checkbox,
  Container,
  Input,
  Label,
  Panel,
} from "components/common";
import {
  useDebounce,
  useInferenceJobs,
  useLocalize,
  useModal,
  useSession,
} from "hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophoneAlt,
  faSearch,
  faWaveformLines,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import "../AudioGen.scss";
import { FeaturedVoice } from "../FeaturedVoice";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import {
  EnqueueVoiceConversion,
  EnqueueVoiceConversionIsSuccess,
  EnqueueVoiceConversionRequest,
  EnqueueVoiceConversionResponse,
} from "@storyteller/components/src/api/voice_conversion/EnqueueVoiceConversion";
import { v4 as uuidv4 } from "uuid";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import { isMobile } from "react-device-detect";
import { useVcStore } from "hooks";
import ExploreVoices from "../ExploreVoices";
import { AITools } from "components/marketing";
import VoicePickerPreview from "../VoicePickerPreview";
import VCRecordComponent from "./VCRecordComponent";
import VCUploadComponent from "./VCUploadComponent";
import VCPitchShiftComponent from "./VCPitchShiftComponent";
import VCPitchEstimateMethodComponent from "./VCPitchEstimateMethodComponent";
import { SessionVoiceConversionResultsList } from "v2/view/_common/SessionVoiceConversionResultsList";
import { getLocalStorageItem, setLocalStorageItem } from "utils/localStorage";
// import { FeaturedVideos } from "components/marketing/AITools/FeaturedVideos";
import HowToUseSection from "components/common/HowToUseSection";
import FAQSection from "components/common/FAQSection";

export default function NewVC() {
  const { enqueueInferenceJob } = useInferenceJobs();
  const { modalState, open, close } = useModal();
  const { loggedIn, loggedInOrModal } = useSession();
  const [search, searchSet] = useState("");
  const [updated, updatedSet] = useState(false);
  const {
    selectedVoice,
    setSelectedVoice,
    mediaUploadToken,
    setMediaUploadToken,
    semitones,
    setSemitones,
    autoConvertF0,
    setAutoConvertF0,
    maybeF0MethodOverride,
    setMaybeF0MethodOverride,
    hasUploadedFile,
    setHasUploadedFile,
    hasRecordedFile,
    setHasRecordedFile,
    formIsCleared,
    setFormIsCleared,
  } = useVcStore();
  const [isGenerating, setIsGenerating] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  usePrefixedDocumentTitle("AI Voice Conversion");

  const { t } = useLocalize("NewVC");

  const searchChange =
    (setUpdate = true) =>
    ({ target }: { target: any }) => {
      if (setUpdate) updatedSet(true);
      searchSet(target.value);
    };

  const handleResultSelect = (data: any) => {
    setSelectedVoice(data);
    close();
  };

  const mediaBrowserProps = {
    onSelect: (weight: any) => setSelectedVoice(weight),
    inputMode: 3,
    onSearchChange: searchChange(false),
    search,
    emptyContent: (
      <ExploreVoices
        onResultSelect={handleResultSelect}
        filterCategory="voice_conversion"
      />
    ),
    showFilters: true,
    showPagination: false,
    searchFilter: "voice_conversion",
    showUserUploadCheckbox: false,
    showTypeFilter: false,
    showSearchFilters: true,
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

  const openModal = () => {
    open({
      component: MediaBrowser,
      props: mediaBrowserProps,
    });
  };

  const featuredVoiceTokens = [
    "weight_aaq74t6as5wgqvgqwheesv191",
    "weight_ycxe10b37a04wn5gen9srm86q",
    "weight_r0f26jm0g4bsbawhdh3zk7d04",
    "weight_x0c5a09bmndmyq05asj69k2nn",
    "weight_cspd7e4wpjnrv1ygsa19b0gff",
    "weight_a232w8k710gr4vgsptxy8bj3b",
    "weight_zmrhs5j5d8qm4kantkmc6w945",
    "weight_z7j14hz7dcvsg9n26dq9ft9eg",
  ];

  const handlePitchMethodChange = (value: any) => {
    setMaybeF0MethodOverride(value);
  };

  const handlePitchChange = (value: any) => {
    setSemitones(value);
  };

  const handleAutoF0Change = (ev: React.FormEvent<HTMLInputElement>) => {
    const value = (ev.target as HTMLInputElement).checked;
    setAutoConvertF0(value);
  };

  const handleConvert = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    const generationCountKey = "generationCountVC";
    const promptShownKey = "promptShownVC";
    const ttl = 2 * 60 * 1000; // 2 minutes in milliseconds
    let generationCount = parseInt(
      getLocalStorageItem(generationCountKey) || "0"
    );
    const promptShown = getLocalStorageItem(promptShownKey);

    // Show sign up prompt after 2 generations, and dont show again until local storage expires
    if (!loggedIn && generationCount >= 2 && !promptShown) {
      loggedInOrModal({
        loginMessage: "Login to keep your generated audio history",
        signupMessage: "Sign up to keep your generated audio history",
      });
      setLocalStorageItem(promptShownKey, "true", ttl);
    }

    if (!selectedVoice || !mediaUploadToken) return;

    setIsGenerating(true);

    const request: EnqueueVoiceConversionRequest = {
      uuid_idempotency_token: uuidv4(),
      voice_conversion_model_token: selectedVoice.weight_token,
      source_media_upload_token: mediaUploadToken,
    };

    if (semitones !== 0) {
      request.transpose = semitones;
    }

    if (maybeF0MethodOverride !== undefined) {
      request.override_f0_method = maybeF0MethodOverride;
    }

    if (autoConvertF0) {
      request.auto_predict_f0 = true;
    }

    try {
      const response: EnqueueVoiceConversionResponse =
        await EnqueueVoiceConversion(request);
      if (EnqueueVoiceConversionIsSuccess(response)) {
        console.log("VC queued successfully:", response.inference_job_token);
        enqueueInferenceJob(
          response.inference_job_token,
          FrontendInferenceJobType.VoiceConversion
        );
        setIsGenerating(false);
      } else {
        // @ts-ignore
        window.dataLayer.push({
          event: "enqueue_failure",
          page: "/voice-conversion",
          user_id: "$user_id",
        });
        console.error("Error queuing VC:", "failed to enqueue");
        setIsGenerating(false);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setIsGenerating(false);
    }

    generationCount += 1;
    setLocalStorageItem(generationCountKey, generationCount.toString(), ttl);
  };

  const faqItems = [
    {
      question: "What is FakeYou Voice Conversion?",
      answer:
        "FakeYou Voice Conversion is a community-powered AI voice changer that transforms your voice into any voice from our extensive library of user-created voice models. Our advanced voice conversion technology lets you convert both speaking and singing voices in real-time, while maintaining natural-sounding results. Join thousands of creators who use our voice conversion tool for content creation, music covers, and creative projects.",
    },
    {
      question: "Where do the voice conversion models come from?",
      answer:
        "Our voice models are created and shared by our vibrant community of voice enthusiasts. Community members train AI models for voice conversion, resulting in a diverse collection of voices. This collaborative approach means you'll find both popular character voices and unique creations that aren't available anywhere else. Anyone can contribute to our growing library of voice conversion models!",
    },
    {
      question: "How does AI Voice Conversion work?",
      answer:
        "Our AI voice changer works in three simple steps: First, upload or record your audio. Then, select a target voice from our community-created collection. Finally, our advanced AI analyzes your input and transforms it to match your chosen voice. Fine-tune the results using pitch control and other settings for the perfect voice conversion. The entire process happens in real-time, making it perfect for both quick conversions and professional projects.",
    },
    {
      question: "What can I use Voice Conversion for?",
      answer:
        "FakeYou's Voice Conversion is incredibly versatile! Use it for content creation, voice acting, music covers, and creative projects. The pitch control features are especially popular for singing voice conversion, letting you match specific musical keys or vocal ranges. Our community regularly uses it for YouTube videos, TikTok content, music covers, and voice acting practice. Whether you're a content creator, musician, or voice enthusiast, our AI voice changer has you covered.",
    },
    {
      question: "How good is the voice conversion quality?",
      answer:
        "Our AI voice converter delivers high-quality transformations that preserve the natural flow and emotion of your original audio while adopting the characteristics of the target voice. The quality can vary based on factors like input audio clarity, chosen voice model, and pitch settings. Since our models are community-trained, you can preview any voice before converting and use our rating system to find the highest-quality voice models for your needs.",
    },
  ];

  const howToUseSteps = [
    {
      icon: faSearch,
      title: "Step 1: Choose Your Target Voice",
      description:
        "Browse our collection of community-created voice conversion models. Check out featured voices for popular options, or use our search to find specific voices. Each model is trained and shared by our community members, giving you access to a unique library of voices. Preview voices before converting to ensure they match your needs.",
    },
    {
      icon: faMicrophoneAlt,
      title: "Step 2: Prepare Your Audio",
      description:
        "Record your voice directly through our interface or upload an existing audio file. For optimal voice conversion results, ensure your recording is clear and free from background noise. Our community recommends using a good microphone and recording in a quiet environment for the best voice transformations.",
    },
    {
      icon: faWaveformLines,
      title: "Step 3: Adjust and Convert",
      description: (
        <>
          Fine-tune your voice conversion using our advanced settings. Adjust
          the pitch shift (up to 36 semitones), choose pitch estimation methods,
          and toggle automatic F0 conversion for precise control. Once
          satisfied, click 'Convert' to transform your audio using our AI voice
          changer.{" "}
          {!loggedIn && (
            <span>
              {" "}
              Create a free account to save your conversion history and join our
              growing community of voice creators!
            </span>
          )}
        </>
      ),
    },
  ];

  return (
    <>
      <Container type="panel" className="mt-3 mt-lg-5">
        <Panel padding={true}>
          <form onSubmit={handleConvert}>
            <h1 className="fw-bold fs-1 mb-0">{t("title.vc")}</h1>
            <p className="mb-4 opacity-75 fw-medium">{t("subtitle.vc")}</p>

            <div className="d-flex flex-column gap-3">
              <div className="fy-featured-voices-section">
                <h5 className="fw-bold">{t("title.featuredVoices")}</h5>
                <div className="fy-featured-voices-scroll-container">
                  {featuredVoiceTokens.map(token => (
                    <FeaturedVoice
                      key={token}
                      token={token}
                      onClick={setSelectedVoice}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label label={t("label.search")} />
                <div className="position-relative">
                  <Input
                    autoFocus={isMobile ? false : selectedVoice ? false : true}
                    icon={faSearch}
                    placeholder={t("input.searchPlaceholder")}
                    onChange={searchChange()}
                    value={search}
                  />
                  {search && (
                    <FontAwesomeIcon
                      icon={faXmark}
                      className="position-absolute opacity-75 fs-5"
                      style={{
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                      }}
                      onClick={() => searchSet("")}
                    />
                  )}
                </div>
              </div>

              <div>
                <div className="d-flex align-items-center">
                  {!selectedVoice && (
                    <div className="mb-2">
                      <div className="focus-point" />
                    </div>
                  )}

                  <div className="d-flex gap-2 align-items-center w-100">
                    <div className="flex-grow-1">
                      <Label
                        label={`${
                          selectedVoice
                            ? t("label.selected")
                            : t("label.select")
                        }`}
                      />
                    </div>

                    {/* Commented out notify voice improvement for now */}
                    {/* <div className="d-flex gap-2">
                    {selectedVoice && (
                      <Button
                        icon={faBell}
                        variant="link"
                        label="Notify me when this voice improves"
                        className="fs-7"
                      />
                    )}
                  </div> */}
                  </div>
                </div>

                <VoicePickerPreview
                  selectedVoice={selectedVoice}
                  openModal={openModal}
                />
              </div>

              <div className="row">
                <div className="d-flex flex-column gap-3 col-12 col-lg-6">
                  <div>
                    <Label label={t("label.audioInput")} />
                    <div className="d-flex flex-column gap-3">
                      {!hasUploadedFile && (
                        <div>
                          <VCRecordComponent
                            setMediaUploadToken={setMediaUploadToken}
                            formIsCleared={formIsCleared}
                            setFormIsCleared={setFormIsCleared}
                            setHasRecordedFile={setHasRecordedFile}
                            hasRecordedFile={hasRecordedFile}
                            setIsRecordingAudio={setIsRecordingAudio}
                          />
                        </div>
                      )}

                      {!hasUploadedFile && !hasRecordedFile && (
                        <div className="d-flex gap-3 align-items-center">
                          <hr className="w-100" />
                          <span className="opacity-75 fw-medium">
                            {t("divider.or")}
                          </span>
                          <hr className="w-100" />
                        </div>
                      )}
                      {!hasRecordedFile && (
                        <div>
                          <div className="upload-component">
                            <VCUploadComponent
                              setMediaUploadToken={setMediaUploadToken}
                              formIsCleared={formIsCleared}
                              setFormIsCleared={setFormIsCleared}
                              setHasUploadedFile={setHasUploadedFile}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {(hasUploadedFile || hasRecordedFile) && (
                    <div>
                      <Label label={t("label.pitchControl")} />
                      <div className="d-flex flex-column gap-3">
                        <VCPitchEstimateMethodComponent
                          pitchMethod={maybeF0MethodOverride}
                          onMethodChange={handlePitchMethodChange}
                        />
                        <VCPitchShiftComponent
                          min={-36}
                          max={36}
                          step={1}
                          value={semitones}
                          onPitchChange={handlePitchChange}
                        />
                        <Checkbox
                          label={t("label.autoF0")}
                          className="mb-0 fs-7"
                          onChange={handleAutoF0Change}
                          checked={autoConvertF0}
                        />
                      </div>
                    </div>
                  )}

                  <div className="d-flex justify-content-end">
                    <Button
                      icon={faWaveformLines}
                      label={t("button.convert")}
                      type="submit"
                      disabled={!selectedVoice || !mediaUploadToken}
                      isLoading={isGenerating}
                    />
                  </div>
                </div>
                <div className="col-12 col-lg-6">
                  <div className="d-flex flex-column">
                    <Label label={t("label.output")} />
                    <div className="d-flex flex-column session-vc-section">
                      <SessionVoiceConversionResultsList />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </Panel>
      </Container>

      <HowToUseSection
        title="How to Use FakeYou Voice Conversion"
        steps={howToUseSteps}
      />

      <FAQSection faqItems={faqItems} />

      <Container type="panel" className="pt-5 mt-5">
        <Panel clear={true}>
          <AITools />
        </Panel>
      </Container>
    </>
  );
}
