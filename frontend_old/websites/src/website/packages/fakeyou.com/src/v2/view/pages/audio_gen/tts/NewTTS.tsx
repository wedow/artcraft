import React, { useState } from "react";
import { MediaBrowser } from "components/modals";
import {
  Button,
  Container,
  Input,
  Label,
  Panel,
  TextArea,
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
  faDeleteLeft,
  faSearch,
  faSparkles,
  faTextSize,
  faWaveformLines,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import "../AudioGen.scss";
import { FeaturedVoice } from "../FeaturedVoice";
import { SessionTtsInferenceResultList } from "v2/view/_common/SessionTtsInferenceResultsList";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import {
  GenerateTtsAudio,
  GenerateTtsAudioRequest,
  GenerateTtsAudioResponse,
  GenerateTtsAudioIsOk,
} from "@storyteller/components/src/api/tts/GenerateTtsAudio";
import { v4 as uuidv4 } from "uuid";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import { isMobile } from "react-device-detect";
import { useTtsStore } from "hooks";
import { AITools } from "components/marketing";
import VoicePickerPreview from "../VoicePickerPreview";
import { getLocalStorageItem, setLocalStorageItem } from "utils/localStorage";
import ExploreVoices from "../ExploreVoices";
import { featuredTtsVoiceTokens } from "./FeaturedTTSVoiceTokens";
// import { FeaturedVideos } from "components/marketing/AITools/FeaturedVideos";
import HowToUseSection from "components/common/HowToUseSection";
import FAQSection from "components/common/FAQSection";

export default function NewTTS() {
  const { enqueueInferenceJob } = useInferenceJobs();
  const { modalState, open, close } = useModal();
  const { loggedIn, loggedInOrModal } = useSession();
  const [search, searchSet] = useState("");
  const [updated, updatedSet] = useState(false);
  const { selectedVoice, setSelectedVoice, text, setText } = useTtsStore();
  const textChange = ({ target }: { target: any }) => {
    setText(target.value);
  };
  const [isGenerating, setIsGenerating] = useState(false);
  usePrefixedDocumentTitle("FakeYou. Deep Fake Text to Speech.");

  const { t } = useLocalize("NewTTS");

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
        filterCategory="text_to_speech"
      />
    ),
    showFilters: true,
    showPagination: false,
    searchFilter: "text_to_speech",
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

  const handleSpeak = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    const generationCountKey = "generationCountTTS";
    const promptShownKey = "promptShownTTS";
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

    if (!selectedVoice || !text) return;

    setIsGenerating(true);

    const request: GenerateTtsAudioRequest = {
      uuid_idempotency_token: uuidv4(),
      tts_model_token: selectedVoice.weight_token,
      inference_text: text,
    };

    try {
      const response: GenerateTtsAudioResponse =
        await GenerateTtsAudio(request);
      if (GenerateTtsAudioIsOk(response)) {
        console.log("TTS queued successfully:", response.inference_job_token);
        enqueueInferenceJob(
          response.inference_job_token,
          FrontendInferenceJobType.TextToSpeech
        );
        setIsGenerating(false);
      } else {
        console.error("Error queuing TTS:", response.error);
        setIsGenerating(false);
      }
    } catch (error) {
      // @ts-ignore
      window.dataLayer.push({
        event: "enqueue_failure",
        page: "/tts",
        user_id: "$user_id",
      });
      console.error("Unexpected error:", error);
      setIsGenerating(false);
    }

    generationCount += 1;
    setLocalStorageItem(generationCountKey, generationCount.toString(), ttl);
  };

  const faqItems = [
    {
      question: "What is FakeYou's Text to Speech?",
      answer:
        "FakeYou's Text to Speech is a community-powered AI platform that lets you convert text into speech using over 3,500 character voices. Our vibrant community of voice creators regularly contributes new voices, making it one of the largest collections of AI voices available. Whether you need voices for content creation, gaming, or creative projects, you'll find voices ranging from popular characters to original creations.",
    },
    {
      question: "Where do all these voices come from?",
      answer:
        "The majority of our voices are created and contributed by our amazing community members. Voice creators from around the world train and share AI voice models, resulting in our diverse library of over 3,500 voices. This community-driven approach means you'll find both popular character voices and unique, original creations that you won't find anywhere else.",
    },
    {
      question: "How good is the voice quality?",
      answer:
        "Voice quality can vary since our models come from different community creators, but we maintain high standards. Many of our popular voices deliver remarkably natural-sounding speech with proper intonation and character accuracy. Our rating system can help you find the highest-quality voices that best suit your needs, or pick from our featured voices list.",
    },
    {
      question: "Can I create and share my own AI voices?",
      answer:
        "Absolutely! FakeYou is built on community contributions. You can join our growing community of voice creators, train your own AI voice models, upload and share them with others. Whether you're interested in creating character voices or original content, our platform provides the tools and community support to help you get started.",
    },
  ];

  const howToUseSteps = [
    {
      icon: faSearch,
      title: "Step 1: Find Your Perfect Voice",
      description:
        "Browse our collection of 3,500+ community-created voices. Check out our featured voices for popular options, or use the search bar to find specific characters. You can filter by language, and community ratings to find exactly what you need.",
    },
    {
      icon: faTextSize,
      title: "Step 2: Write Your Message",
      description:
        "Enter the text you want your chosen voice to speak. For best results, use clear punctuation and consider the character's speaking style. Pro tip: Many community members share tips in our Discord about getting the best performance from specific voices!",
    },
    {
      icon: faWaveformLines,
      title: "Step 3: Generate and Share",
      description: (
        <>
          Click 'Speak' to generate your audio. Once complete, you can play it
          back, download it, or share it with our community.{" "}
          {!loggedIn && (
            <span>
              {" "}
              Create a free account to save your history and join our community
              of voice enthusiasts!
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
          <form onSubmit={handleSpeak}>
            <h1 className="fw-bold fs-1 mb-0">{t("title.tts")}</h1>
            <p className="mb-4 opacity-75 fw-medium">{t("subtitle.tts")}</p>

            <div className="d-flex flex-column gap-3">
              <div className="fy-featured-voices-section">
                <h5 className="fw-bold">{t("title.featuredVoices")}</h5>
                <div className="fy-featured-voices-scroll-container">
                  {featuredTtsVoiceTokens.map(token => (
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
                    <Button
                      label={t("link.exploreNewVoices")}
                      variant="link"
                      className="mb-2"
                      icon={faSparkles}
                      to="/explore/weights?page_size=24&weight_category=text_to_speech"
                    />
                  </div>
                </div>

                <VoicePickerPreview
                  selectedVoice={selectedVoice}
                  openModal={openModal}
                />
              </div>

              <div className="row">
                <div className="d-flex flex-column gap-3 col-12 col-lg-6">
                  <TextArea
                    autoFocus={selectedVoice ? true : false}
                    label={t("label.enterText")}
                    onChange={textChange}
                    value={text}
                    rows={isMobile ? 5 : 13}
                    placeholder={t("input.textPlaceholder", {
                      character: selectedVoice ? selectedVoice.title : "",
                    })}
                    resize={false}
                  />
                  <div className="d-flex justify-content-end gap-2">
                    <Button
                      icon={faDeleteLeft}
                      label={t("button.clear")}
                      disabled={!text}
                      variant="secondary"
                      onClick={() => setText("")}
                    />
                    <Button
                      icon={faWaveformLines}
                      label={t("button.speak")}
                      type="submit"
                      disabled={!selectedVoice || !text}
                      isLoading={isGenerating}
                    />
                  </div>
                </div>
                <div className="col-12 col-lg-6">
                  <div className="d-flex flex-column">
                    <Label label={t("label.output")} />
                    <div className="d-flex flex-column session-tts-section">
                      <SessionTtsInferenceResultList />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </Panel>
      </Container>

      <HowToUseSection title="How to Use FakeYou TTS" steps={howToUseSteps} />

      <FAQSection faqItems={faqItems} />

      <Container type="panel" className="pt-5 mt-5">
        {/* <Panel clear={true}>
          <FeaturedVideos />
        </Panel> */}
        <Panel clear={true}>
          <AITools />
        </Panel>
        {/* <MentionsSection /> */}
        {/* <StorytellerStudioCTA /> */}
      </Container>
    </>
  );
}
