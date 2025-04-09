import React, { useState } from "react";
import { Button, Container, Label, Panel, TextArea } from "components/common";
import { useInferenceJobs, useLocalize, useSession } from "hooks";
import {
  faVolumeHigh,
  faDeleteLeft,
  faWaveformLines,
} from "@fortawesome/pro-solid-svg-icons";
import "../AudioGen.scss";
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
import { getLocalStorageItem, setLocalStorageItem } from "utils/localStorage";
import PageHeaderWithImage from "components/layout/PageHeaderWithImage";
import TrumpSelect, { TrumpOption } from "./TrumpSelect";
// import { FeaturedVideos } from "components/marketing/AITools/FeaturedVideos";

export default function NewTTS() {
  const { enqueueInferenceJob } = useInferenceJobs();
  const { loggedIn, loggedInOrModal, sessionSubscriptions } = useSession();
  const [trumpOption, trumpOptionSet] = useState<TrumpOption>({
    trump: "angry",
    token: "weight_x6r5w2tsxgcrrsgweva6dkrqj",
  });
  const { text, setText } = useTtsStore();
  const textChange = ({ target }: { target: any }) => {
    setText(target.value);
  };
  const [isGenerating, setIsGenerating] = useState(false);
  usePrefixedDocumentTitle("FakeYou. Deep Fake Text to Speech.");

  const { t } = useLocalize("NewTTS");

  const cap = (string: string) =>
    string.charAt(0).toUpperCase() + string.slice(1);

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

    if (!text) return;

    setIsGenerating(true);

    const request: GenerateTtsAudioRequest = {
      uuid_idempotency_token: uuidv4(),
      tts_model_token: trumpOption.token,
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

  return (
    <>
      <Container type="panel" className="mt-3 mt-lg-5">
        <PageHeaderWithImage
          headerImage="/mascot/trump.webp"
          titleIcon={faVolumeHigh}
          title="Donald Trump TTS"
          subText="FakeYou has the very best Donald Trump AI voice on the internet. Use deep
        fake Donald Trump to say your favorite memes."
          yOffset="60%"
        />
        <Panel padding={true}>
          <Label {...{ label: "Select a trump voice" }} />
          <TrumpSelect {...{ cap, t, trumpOptionSet, value: trumpOption }} />
          <form onSubmit={handleSpeak}>
            <div className="d-flex flex-column gap-3">
              <div className="row">
                <div className="d-flex flex-column gap-3 col-12 col-lg-6">
                  <TextArea
                    autoFocus={true}
                    label={t("label.enterText")}
                    onChange={textChange}
                    value={text}
                    rows={isMobile ? 5 : 13}
                    placeholder={t("input.textPlaceholder", {
                      character: `${t(
                        "label.trump" + cap(trumpOption.trump)
                      )} Trump`,
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
                      disabled={!text}
                      isLoading={isGenerating}
                    />
                  </div>
                </div>
                <div className="col-12 col-lg-6">
                  <div className="d-flex flex-column">
                    <Label label={t("label.output")} />
                    <div className="d-flex flex-column session-tts-section">
                      {sessionSubscriptions ? (
                        <SessionTtsInferenceResultList />
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </Panel>
      </Container>

      <Container type="panel" className="pt-5 mt-5">
        <Panel clear={true}>
          <AITools />
        </Panel>
      </Container>
    </>
  );
}
