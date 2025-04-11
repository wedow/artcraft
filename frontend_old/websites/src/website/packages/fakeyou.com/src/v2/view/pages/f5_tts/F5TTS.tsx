import {
  faArrowDownToLine,
  faDeleteLeft,
  faFlask,
  faMicrophoneAlt,
  faSparkles,
  faTextSize,
  faWaveformLines,
} from "@fortawesome/pro-solid-svg-icons";
import {
  Badge,
  Button,
  Container,
  Label,
  Panel,
  TextArea,
} from "components/common";
import React, { useContext, useState } from "react";
import useF5Store from "hooks/useF5Store";
import RecordComponent from "components/common/RecordComponent";
import UploadComponent from "components/common/UploadComponent";
import { SessionF5TtsResultsList } from "v2/view/_common/SessionF5TtsResultsList";
import { useInferenceJobs } from "hooks";
import { v4 as uuidv4 } from "uuid";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import {
  GenerateF5TtsAudio,
  GenerateF5TtsAudioRequest,
  GenerateF5TtsAudioResponse,
} from "@storyteller/components/src/api/f5_tts/GenerateF5TtsAudio";
import "./F5TTS.scss";
import { AITools } from "components/marketing";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import { AppStateContext } from "components/providers/AppStateProvider";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";

export default function F5TTS() {
  const { sessionWrapper } = useContext(AppStateContext);
  const { enqueueInferenceJob } = useInferenceJobs();
  const {
    mediaUploadToken,
    setMediaUploadToken,
    hasUploadedFile,
    setHasUploadedFile,
    hasRecordedFile,
    setHasRecordedFile,
    formIsCleared,
    setFormIsCleared,
    setText,
    text,
    recordingBlobStore,
    setRecordingBlobStore,
    isUploadDisabled,
    setIsUploadDisabled,
    file,
    setFile,
    audioLink,
    setAudioLink,
  } = useF5Store();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  usePrefixedDocumentTitle("F5-TTS Zero-Shot Voice Cloning");

  const textChange = ({ target }: { target: any }) => {
    setText(target.value);
  };

  const handleConvert = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    setIsGenerating(true);

    if (!mediaUploadToken) return;

    const request: GenerateF5TtsAudioRequest = {
      uuid_idempotency_token: uuidv4(),
      source_media_file_token: mediaUploadToken,
      inference_text: text,
      creator_set_visibility: "public",
    };

    try {
      const response: GenerateF5TtsAudioResponse = await GenerateF5TtsAudio(
        "",
        request
      );
      if (response) {
        console.log("TTS queued successfully:", response.inference_job_token);
        enqueueInferenceJob(
          response.inference_job_token,
          FrontendInferenceJobType.F5Tts
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
              <FontAwesomeIcon icon={faMicrophoneAlt} className="icon" />
              <div>
                <div className="d-flex gap-2 gap-lg-3 align-items-center justify-content-center justify-content-lg-start flex-wrap mb-1">
                  <h1 className="fw-bold fs-1 mb-0">F5-TTS Voice Cloning</h1>
                  <Badge label="Beta" icon={faFlask} color="gray" />
                </div>
                <p
                  className="opacity-75 fw-medium"
                  style={{ fontSize: "18px" }}
                >
                  Instantly generate text-to-speech audio by uploading a short
                  audio clip of any voice you choose.
                </p>
              </div>
            </div>

            <div className="d-flex flex-column gap-3 pt-3 pt-lg-5">
              <div className="row g-5">
                <div className="d-flex flex-column gap-3 col-12 col-lg-6">
                  <div>
                    <Label label="Reference Audio" />
                    <div className="d-flex flex-column gap-3">
                      {!hasUploadedFile && (
                        <div>
                          <RecordComponent
                            setMediaUploadToken={setMediaUploadToken}
                            formIsCleared={formIsCleared}
                            setFormIsCleared={setFormIsCleared}
                            setHasRecordedFile={setHasRecordedFile}
                            hasRecordedFile={hasRecordedFile}
                            setIsRecordingAudio={setIsRecordingAudio}
                            recordingBlobStore={recordingBlobStore}
                            setRecordingBlobStore={setRecordingBlobStore}
                            isUploadDisabled={isUploadDisabled}
                            setIsUploadDisabled={setIsUploadDisabled}
                          />
                        </div>
                      )}

                      {!hasUploadedFile && !hasRecordedFile && (
                        <div className="d-flex gap-3 align-items-center">
                          <hr className="w-100" />
                          <span className="opacity-75 fw-medium">or</span>
                          <hr className="w-100" />
                        </div>
                      )}
                      {!hasRecordedFile && (
                        <div>
                          <div className="upload-component">
                            <UploadComponent
                              setMediaUploadToken={setMediaUploadToken}
                              formIsCleared={formIsCleared}
                              setFormIsCleared={setFormIsCleared}
                              setHasUploadedFile={setHasUploadedFile}
                              isUploadDisabled={isUploadDisabled}
                              setIsUploadDisabled={setIsUploadDisabled}
                              file={file}
                              setFile={setFile}
                              audioLink={audioLink}
                              setAudioLink={setAudioLink}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-2">
                    <TextArea
                      label="Enter Text"
                      onChange={textChange}
                      value={text}
                      rows={10}
                      placeholder="Type what you want the voice to say..."
                      resize={false}
                    />
                  </div>

                  <div className="d-flex gap-2 justify-content-end">
                    <Button
                      icon={faDeleteLeft}
                      variant="secondary"
                      label="Clear Text"
                      onClick={() => setText("")}
                      type="button"
                      disabled={!text}
                    />
                    <Button
                      icon={faSparkles}
                      label="Generate Speech"
                      type="submit"
                      isLoading={isGenerating}
                      disabled={!mediaUploadToken || !text}
                    />
                  </div>
                </div>
                <div className="col-12 col-lg-6">
                  <div className="d-flex flex-column">
                    <Label label="Output" />
                    <div className="d-flex flex-column session-f5-section">
                      <SessionF5TtsResultsList />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </Panel>
      </Container>

      <Container type="panel">
        <div className="how-to-use-section p-4">
          <h2 className="fw-bold mb-5">How to Use F5-TTS</h2>
          <div className="row g-5">
            <div className="col-md-4 how-to-use-item">
              <FontAwesomeIcon
                icon={faWaveformLines}
                className="how-to-use-icon"
              />
              <h3>Step 1: Upload Your Audio</h3>
              <p>
                In the panel above, start by adding a reference audio, either
                record your own voice or upload an audio file. This audio will
                be used by F5-TTS to clone the voice, enabling the generation of
                speech that closely resembles the reference voice. For optimal
                results, ensure the audio is clear and of high quality.
              </p>
            </div>
            <div className="col-md-4 how-to-use-item">
              <FontAwesomeIcon icon={faTextSize} className="how-to-use-icon" />
              <h3>Step 2: Enter Your Text</h3>
              <p>
                Next, input the text you wish to convert into speech. This text
                will be synthesized using the voice from your reference audio,
                allowing you to create personalized audio content. Ensure your
                text is clear and concise for the best results.
              </p>
            </div>
            <div className="col-md-4 how-to-use-item">
              <FontAwesomeIcon
                icon={faArrowDownToLine}
                className="how-to-use-icon"
              />
              <h3>Step 3: Generate and Save</h3>
              <p>
                With your audio and text prepared, click 'Generate Speech' to
                activate F5-TTS and transform your text into lifelike speech.
                Once the process is complete, you can listen to the synthesized
                audio directly in the output panel above. If you're happy with
                the result, click the download button to save the audio file and
                use it in your projects!
                {!sessionWrapper.isLoggedIn() && (
                  <span>
                    {" "}
                    If you want your results to be kept,{" "}
                    <Link
                      to="/signup?redirect=/f5-tts"
                      className="fw-medium text-red text-decoration-underline"
                    >
                      sign up
                    </Link>{" "}
                    and they will be saved to your account!
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </Container>

      <Container type="panel">
        <Panel padding={true} className="p-4 faq-section">
          <h2 className="fw-bold mb-5">Frequently Asked Questions</h2>
          <div className="row g-5">
            <div className="faq-item">
              <h3>What is F5-TTS?</h3>
              <p>
                F5-TTS is an AI-driven text-to-speech tool that transforms
                written text into lifelike speech. With real-time processing,
                it's great for generating dynamic audio content, whether it's
                for voice-overs, digital storytelling, or any other project that
                requires high-quality spoken output.
              </p>
            </div>
            <hr className="my-3" />
            <div className="faq-item">
              <h3>How does F5-TTS work?</h3>
              <p>
                F5-TTS leverages advanced AI techniques, like Flow Matching and
                Diffusion Transformers, to turn text into speech. It skips some
                of the traditional steps like phoneme alignment and duration
                prediction, producing more natural-sounding audio directly from
                your input text.
              </p>
            </div>
            <hr className="my-3" />
            <div className="faq-item">
              <h3>What kind of audio quality can I expect from F5-TTS?</h3>
              <p>
                F5-TTS delivers high-quality audio with clear, natural
                intonation, making it a perfect fit for professional projects
                like podcasts, audiobooks, and educational content. The speech
                it generates is crisp and lifelike, designed to meet the
                standards of any polished audio production.
              </p>
            </div>
            <hr className="my-3" />
            <div className="faq-item">
              <h3>Can F5-TTS be used for voice-over work?</h3>
              <p>
                Absolutely! F5-TTS is a fantastic tool for voice-over
                production. Its zero-shot voice cloning feature allows you to
                create different voices for various characters or narrators, and
                it even supports emotional expression to add extra nuance and
                depth to your audio content.
              </p>
            </div>
          </div>
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
