import React, { useState } from "react";
import {
  faArrowDownToLine,
  faFlask,
  faMicrophoneAlt,
  faSparkles,
  faWaveform,
  faWaveformLines,
} from "@fortawesome/pro-solid-svg-icons";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import FAQSection from "components/common/FAQSection";
import HowToUseSection from "components/common/HowToUseSection";
import { Badge, Button, Container, Label, Panel } from "components/common";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SessionSeedVCResultsList } from "v2/view/_common/SessionSeedVCResultsList";
import useSeedVCStore from "hooks/useSeedVCStore";
import {
  GenerateSeedVcAudio,
  GenerateSeedVcAudioRequest,
  GenerateSeedVcAudioResponse,
} from "@storyteller/components/src/api/seed_vc/GenerateSeedVcAudio";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import { v4 as uuidv4 } from "uuid";
import { useInferenceJobs } from "hooks";
import UploadComponent from "components/common/UploadComponent";
import RecordComponent from "components/common/RecordComponent";
import "./SeedVC.scss";
import { AITools } from "components/marketing";

export default function SeedVC() {
  usePrefixedDocumentTitle("Seed-VC Zero-shot Voice Conversion");
  const { enqueueInferenceJob } = useInferenceJobs();
  const {
    mediaUploadTokenReference,
    setMediaUploadTokenReference,
    mediaUploadTokenSource,
    setMediaUploadTokenSource,
    setHasUploadedFileReference,
    hasUploadedFileSource,
    setHasUploadedFileSource,
    hasRecordedFileSource,
    setHasRecordedFileSource,
    recordingBlobStoreSource,
    setRecordingBlobStoreSource,
    isUploadDisabledSource,
    setIsUploadDisabledSource,
    isUploadDisabledReference,
    setIsUploadDisabledReference,
    fileSource,
    setFileSource,
    fileReference,
    setFileReference,
    audioLinkSource,
    setAudioLinkSource,
    audioLinkReference,
    setAudioLinkReference,
    formIsClearedSource,
    setFormIsClearedSource,
    formIsClearedReference,
    setFormIsClearedReference,
  } = useSeedVCStore();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleConvert = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    setIsGenerating(true);

    if (!mediaUploadTokenReference || !mediaUploadTokenSource) return;

    const request: GenerateSeedVcAudioRequest = {
      uuid_idempotency_token: uuidv4(),
      reference_media_file_token: mediaUploadTokenReference,
      source_media_file_token: mediaUploadTokenSource,
      creator_set_visibility: "public",
    };

    try {
      const response: GenerateSeedVcAudioResponse = await GenerateSeedVcAudio(
        "",
        request
      );
      if (response) {
        console.log(
          "Seed-VC queued successfully:",
          response.inference_job_token
        );
        enqueueInferenceJob(
          response.inference_job_token,
          FrontendInferenceJobType.SeedVc
        );
        setIsGenerating(false);
      } else {
        console.error("Error queuing TTS");
        setIsGenerating(false);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Container type="panel" className="mt-3 mt-lg-5">
        <Panel padding={true} className="p-lg-5">
          <form onSubmit={handleConvert}>
            <div className="d-flex flex-column flex-lg-row gap-3 align-items-center mb-3 text-center text-lg-start">
              <FontAwesomeIcon icon={faWaveform} className="seed-vc-icon" />
              <div>
                <div className="d-flex gap-2 gap-lg-3 align-items-center justify-content-center justify-content-lg-start flex-wrap mb-1">
                  <h1 className="fw-bold fs-1 mb-0">
                    Seed-VC Zero-shot Voice Conversion
                  </h1>
                  <Badge label="Beta" icon={faFlask} color="gray" />
                </div>
                <p
                  className="opacity-75 fw-medium"
                  style={{ fontSize: "18px" }}
                >
                  Convert your voice to any other voice with just a short audio
                  reference.
                </p>
              </div>
            </div>

            <div className="d-flex flex-column gap-3 pt-3 pt-lg-5">
              <div className="row g-5">
                <div className="d-flex flex-column gap-3 col-12 col-lg-6">
                  <div>
                    <Label label="Reference Audio (1~30 seconds)" />
                    <div className="d-flex flex-column gap-3">
                      <div>
                        <div className="upload-component">
                          <UploadComponent
                            setMediaUploadToken={setMediaUploadTokenReference}
                            formIsCleared={formIsClearedReference}
                            setFormIsCleared={setFormIsClearedReference}
                            setHasUploadedFile={setHasUploadedFileReference}
                            isUploadDisabled={isUploadDisabledReference}
                            setIsUploadDisabled={setIsUploadDisabledReference}
                            file={fileReference}
                            setFile={setFileReference}
                            audioLink={audioLinkReference}
                            setAudioLink={setAudioLinkReference}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label label="Source Audio" />
                    <div className="d-flex flex-column gap-3">
                      {!hasUploadedFileSource && (
                        <div>
                          <RecordComponent
                            setMediaUploadToken={setMediaUploadTokenSource}
                            formIsCleared={formIsClearedSource}
                            setFormIsCleared={setFormIsClearedSource}
                            setHasRecordedFile={setHasRecordedFileSource}
                            hasRecordedFile={hasRecordedFileSource}
                            setIsRecordingAudio={setIsRecordingAudio}
                            recordingBlobStore={recordingBlobStoreSource}
                            setRecordingBlobStore={setRecordingBlobStoreSource}
                            isUploadDisabled={isUploadDisabledSource}
                            setIsUploadDisabled={setIsUploadDisabledSource}
                          />
                        </div>
                      )}

                      {!hasUploadedFileSource && !hasRecordedFileSource && (
                        <div className="d-flex gap-3 align-items-center">
                          <hr className="w-100" />
                          <span className="opacity-75 fw-medium">or</span>
                          <hr className="w-100" />
                        </div>
                      )}
                      {!hasRecordedFileSource && (
                        <div>
                          <div className="upload-component">
                            <UploadComponent
                              setMediaUploadToken={setMediaUploadTokenSource}
                              formIsCleared={formIsClearedSource}
                              setFormIsCleared={setFormIsClearedSource}
                              setHasUploadedFile={setHasUploadedFileSource}
                              isUploadDisabled={isUploadDisabledSource}
                              setIsUploadDisabled={setIsUploadDisabledSource}
                              file={fileSource}
                              setFile={setFileSource}
                              audioLink={audioLinkSource}
                              setAudioLink={setAudioLinkSource}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="d-flex gap-2 justify-content-end mt-3">
                    <Button
                      icon={faSparkles}
                      label="Convert Speech"
                      type="submit"
                      isLoading={isGenerating}
                      disabled={
                        !mediaUploadTokenReference || !mediaUploadTokenSource
                      }
                    />
                  </div>
                </div>
                <div className="col-12 col-lg-6">
                  <div className="d-flex flex-column">
                    <Label label="Output" />
                    <div className="d-flex flex-column session-f5-section">
                      <SessionSeedVCResultsList />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </Panel>
      </Container>

      <HowToUseSection
        title="How to Use SeedVC Voice Conversion"
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

const faqItems = [
  {
    question: "What is Seed-VC Zero-shot Voice Conversion?",
    answer:
      "Seed-VC Zero-shot Voice Conversion is an advanced AI-powered tool designed for state-of-the-art voice conversion. It uses in-context learning to transform one voice into another without any prior training, making it an ideal choice for projects that require versatile voice modification.",
  },
  {
    question: "How does Seed-VC work?",
    answer:
      "Seed-VC leverages cutting-edge AI techniques, including zero-shot learning, to convert voices with just a short audio reference (1–30 seconds). It can adapt to different voices, creating natural-sounding results without the need for extensive data or training.",
  },
  {
    question: "What kind of voice quality can I expect from Seed-VC?",
    answer:
      "Seed-VC delivers high-quality, natural-sounding voice conversions, suitable for professional applications like dubbing and voice-overs. The AI is designed to retain the unique qualities of the target voice while maintaining clear and lifelike output.",
  },
  {
    question: "Can Seed-VC be used for voice-over and dubbing work?",
    answer:
      "Definitely! Seed-VC's zero-shot capabilities make it perfect for voice-over and dubbing. Whether you need to create different voices for various characters or adapt a voice to a new language, it can handle the task seamlessly.",
  },
];

const howToUseSteps = [
  {
    icon: faWaveformLines,
    title: "Step 1: Upload Reference Audio",
    description:
      "In the panel above, start by uploading a reference audio. This short audio clip (1-30 seconds) represents the target voice you want to convert to. For the best results, make sure that the audio is clear and of high quality.",
  },
  {
    icon: faMicrophoneAlt,
    title: "Step 2: Add Source Audio",
    description:
      "Next, add your source audio. You can either record your own voice directly or upload an audio file. This is the voice that will be transformed into the target voice from step 1. For both fields, don't forget to click 'Upload Audio' after you've added your audio!",
  },
  {
    icon: faArrowDownToLine,
    title: "Step 3: Convert and Download",
    description: (
      <>
        With both audio files prepared, click 'Convert Speech' to activate
        Seed-VC and transform your source audio into the target voice. Once the
        process is complete, you can listen to the converted audio directly in
        the output panel above. If you're happy with the result, click the
        download button to save the audio file and use it in your projects!
      </>
    ),
  },
];
