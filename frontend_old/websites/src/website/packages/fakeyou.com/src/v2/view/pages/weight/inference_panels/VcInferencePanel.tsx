import React, { useState } from "react";
import { faRightLeft } from "@fortawesome/pro-solid-svg-icons";
import { Button } from "components/common";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import { v4 as uuidv4 } from "uuid";
import Accordion from "components/common/Accordion";
import SplitPanel from "components/common/SplitPanel";
import NonRouteTabs from "components/common/Tabs/NonRouteTabs";
import { SessionVoiceConversionResultsList } from "v2/view/_common/SessionVoiceConversionResultsList";
import {
  EnqueueVoiceConversion,
  EnqueueVoiceConversionFrequencyMethod,
  EnqueueVoiceConversionIsSuccess,
  EnqueueVoiceConversionRequest,
} from "@storyteller/components/src/api/voice_conversion/EnqueueVoiceConversion";
import { Analytics } from "common/Analytics";
import UploadComponent from "../../vc/vc_model_list/components/UploadComponent";
import PitchEstimateMethodComponent from "../../vc/vc_model_list/components/PitchEstimateMethodComponent";
import PitchShiftComponent from "../../vc/vc_model_list/components/PitchShiftComponent";
import RecordComponent from "../../vc/vc_model_list/components/RecordComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useInferenceJobs } from "hooks";

interface VcInferencePanelProps {
  voiceToken: string;
}

export default function VcInferencePanel({
  voiceToken,
}: VcInferencePanelProps) {
  const [convertLoading, setConvertLoading] = useState(false);
  const [canConvert, setCanConvert] = useState(false);

  const { enqueueInferenceJob, inferenceJobs } = useInferenceJobs();

  const [mediaUploadToken, setMediaUploadToken] = useState<string | undefined>(
    undefined
  );

  const [convertIdempotencyToken, setConvertIdempotencyToken] =
    useState(uuidv4());

  const [autoConvertF0, setAutoConvertF0] = useState(false);

  const [maybeF0MethodOverride, setMaybeF0MethodOverride] = useState<
    EnqueueVoiceConversionFrequencyMethod | undefined
  >(undefined);

  const [semitones, setSemitones] = useState(0);

  // NB: Something of a UI hack here.
  // The 3rd party microphone component doesn't let you clear it, so we emulate form clearing
  // with this variable.
  const [formIsCleared, setFormIsCleared] = useState(false);

  const changeConvertIdempotencyToken = () => {
    setConvertIdempotencyToken(uuidv4());
  };

  const handleVoiceConversion = async () => {
    if (mediaUploadToken === undefined) {
      return;
    }

    setConvertLoading(true);

    let request: EnqueueVoiceConversionRequest = {
      uuid_idempotency_token: convertIdempotencyToken,
      voice_conversion_model_token: voiceToken,
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

    Analytics.voiceConversionGenerate(voiceToken);

    let result = await EnqueueVoiceConversion(request);

    if (EnqueueVoiceConversionIsSuccess(result)) {
      enqueueInferenceJob(
        result.inference_job_token,
        FrontendInferenceJobType.VoiceConversion
      );
    }

    setConvertLoading(false);
  };

  const handleFormSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
  };

  const handlePitchChange = (value: any) => {
    setSemitones(value);
    changeConvertIdempotencyToken();
  };

  const handlePitchMethodChange = (value: any) => {
    setMaybeF0MethodOverride(value);
    changeConvertIdempotencyToken();
  };

  const handleAutoF0Change = (ev: React.FormEvent<HTMLInputElement>) => {
    const value = (ev.target as HTMLInputElement).checked;
    setAutoConvertF0(value);
    changeConvertIdempotencyToken();
  };

  const speakButtonClass = convertLoading
    ? "btn btn-primary disabled"
    : "btn btn-primary";

  const enableConvertButton = canConvert && mediaUploadToken !== undefined;

  const vcTabs = [
    {
      label: "Upload",
      content: (
        <div>
          <div className="d-flex flex-column gap-4 h-100">
            <div>
              <label className="sub-title">Upload Audio File</label>
              <div className="d-flex flex-column gap-3 upload-component">
                <UploadComponent
                  setMediaUploadToken={setMediaUploadToken}
                  formIsCleared={formIsCleared}
                  setFormIsCleared={setFormIsCleared}
                  setCanConvert={setCanConvert}
                  changeConvertIdempotencyToken={changeConvertIdempotencyToken}
                />
              </div>
            </div>

            <div>
              <label className="sub-title">Pitch Control</label>
              <div className="d-flex flex-column gap-3">
                <div>
                  <PitchEstimateMethodComponent
                    pitchMethod={maybeF0MethodOverride}
                    onMethodChange={handlePitchMethodChange}
                  />
                </div>
                <div>
                  <PitchShiftComponent
                    min={-36}
                    max={36}
                    step={1}
                    value={semitones}
                    onPitchChange={handlePitchChange}
                  />
                </div>
                <div className="form-check">
                  <input
                    id="autoF0Checkbox"
                    className="form-check-input"
                    type="checkbox"
                    checked={autoConvertF0}
                    onChange={handleAutoF0Change}
                  />
                  <label className="form-check-label" htmlFor="autoF0Checkbox">
                    Auto F0 (off for singing, on for speech)
                  </label>
                </div>
              </div>
            </div>

            <div className="d-flex gap-3 justify-content-end">
              <Button
                className={speakButtonClass}
                onClick={handleVoiceConversion}
                type="submit"
                disabled={!enableConvertButton}
                isLoading={convertLoading}
                icon={faRightLeft}
                label="Convert Audio"
              ></Button>
            </div>
          </div>
        </div>
      ),
      padding: true,
    },
    {
      label: "Record",
      content: (
        <div>
          <div className="d-flex flex-column gap-4 h-100">
            <div>
              <label className="sub-title">Record Audio</label>
              <div className="d-flex flex-column gap-3 upload-component">
                <RecordComponent
                  setMediaUploadToken={setMediaUploadToken}
                  formIsCleared={formIsCleared}
                  setFormIsCleared={setFormIsCleared}
                  setCanConvert={setCanConvert}
                  changeConvertIdempotencyToken={changeConvertIdempotencyToken}
                />
              </div>
            </div>

            <div>
              <label className="sub-title">Pitch Control</label>
              <div className="d-flex flex-column gap-3">
                <div>
                  <PitchEstimateMethodComponent
                    pitchMethod={maybeF0MethodOverride}
                    onMethodChange={handlePitchMethodChange}
                  />
                </div>
                <div>
                  <PitchShiftComponent
                    min={-36}
                    max={36}
                    step={1}
                    value={semitones}
                    onPitchChange={handlePitchChange}
                  />
                </div>
                <div className="form-check">
                  <input
                    id="autoF0CheckboxMic"
                    className="form-check-input"
                    type="checkbox"
                    checked={autoConvertF0}
                    onChange={handleAutoF0Change}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="autoF0CheckboxMic"
                  >
                    Auto F0 (off for singing, on for speech)
                  </label>
                </div>
              </div>
            </div>

            <div className="d-flex gap-3 justify-content-end">
              <Button
                className={speakButtonClass}
                onClick={handleVoiceConversion}
                type="submit"
                disabled={!enableConvertButton}
                isLoading={convertLoading}
                icon={faRightLeft}
                label="Convert Audio"
              ></Button>
            </div>
          </div>
        </div>
      ),
      padding: true,
    },
  ];

  return (
    <SplitPanel>
      <SplitPanel.Header padding={true}>
        <h4 className="fw-semibold mb-0">
          <FontAwesomeIcon icon={faRightLeft} className="me-3" />
          Generate Voice Conversion
        </h4>
      </SplitPanel.Header>

      <SplitPanel.Body>
        <form onSubmit={handleFormSubmit}>
          <NonRouteTabs tabs={vcTabs} />
        </form>
      </SplitPanel.Body>
      {inferenceJobs && inferenceJobs.length ? (
        <SplitPanel.Footer padding={true}>
          <Accordion>
            <Accordion.Item title="Session V2V Results" defaultOpen={true}>
              <div className="p-3">
                <SessionVoiceConversionResultsList />
              </div>
            </Accordion.Item>
          </Accordion>
        </SplitPanel.Footer>
      ) : null}
    </SplitPanel>
  );
}
