import React, { useCallback, useEffect, useState } from "react";
import Panel from "components/common/Panel/Panel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBarsStaggered,
  faRightLeft,
  faWaveformLines,
} from "@fortawesome/pro-solid-svg-icons";
import { SessionVoiceConversionResultsList } from "v2/view/_common/SessionVoiceConversionResultsList";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import UploadComponent from "./vc_model_list/components/UploadComponent";
import {
  EnqueueVoiceConversion,
  EnqueueVoiceConversionFrequencyMethod,
  EnqueueVoiceConversionIsSuccess,
  EnqueueVoiceConversionRequest,
} from "@storyteller/components/src/api/voice_conversion/EnqueueVoiceConversion";
import {
  VoiceConversionModelListItem,
  ListVoiceConversionModels,
} from "@storyteller/components/src/api/voice_conversion/ListVoiceConversionModels";
import { Analytics } from "common/Analytics";
import LoadingIcon from "components/common/FileActions/LoadingIcon";
import PitchEstimateMethodComponent from "./vc_model_list/components/PitchEstimateMethodComponent";
import PitchShiftComponent from "./vc_model_list/components/PitchShiftComponent";
import RecordComponent from "./vc_model_list/components/RecordComponent";
import { v4 as uuidv4 } from "uuid";
import { useInferenceJobs } from "hooks";

interface VcGenerateAudioPanelProps {
  voiceConversionModels: Array<VoiceConversionModelListItem>;
  setVoiceConversionModels: (
    ttsVoices: Array<VoiceConversionModelListItem>
  ) => void;

  maybeSelectedVoiceConversionModel?: VoiceConversionModelListItem;
  setMaybeSelectedVoiceConversionModel: (
    maybeSelectedVoiceConversionModel: VoiceConversionModelListItem
  ) => void;
}

export default function VcGenerateAudioPanel(props: VcGenerateAudioPanelProps) {
  const [convertLoading, setConvertLoading] = useState(false);
  const [canConvert, setCanConvert] = useState(false);

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

  const { enqueueInferenceJob } = useInferenceJobs();

  let {
    setVoiceConversionModels,
    voiceConversionModels,
    maybeSelectedVoiceConversionModel,
    setMaybeSelectedVoiceConversionModel,
  } = props;

  const vcModelsLoaded = voiceConversionModels.length > 0;

  const listModels = useCallback(async () => {
    if (vcModelsLoaded) {
      return; // Already queried.
    }
    const models = await ListVoiceConversionModels();
    if (models) {
      setVoiceConversionModels(models);
      if (!maybeSelectedVoiceConversionModel && models.length > 0) {
        let model = models[0];
        const featuredModels = models.filter(m => m.is_front_page_featured);
        if (featuredModels.length > 0) {
          // Random featured model
          model =
            featuredModels[Math.floor(Math.random() * featuredModels.length)];
        }
        setMaybeSelectedVoiceConversionModel(model);
      }
    }
  }, [
    setVoiceConversionModels,
    maybeSelectedVoiceConversionModel,
    setMaybeSelectedVoiceConversionModel,
    vcModelsLoaded,
  ]);

  useEffect(() => {
    listModels();
  }, [listModels]);

  const changeConvertIdempotencyToken = () => {
    setConvertIdempotencyToken(uuidv4());
  };

  const handleVoiceConversion = async () => {
    if (
      props.maybeSelectedVoiceConversionModel === undefined ||
      mediaUploadToken === undefined
    ) {
      return;
    }

    setConvertLoading(true);

    let request: EnqueueVoiceConversionRequest = {
      uuid_idempotency_token: convertIdempotencyToken,
      voice_conversion_model_token:
        props.maybeSelectedVoiceConversionModel.token,
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

    Analytics.voiceConversionGenerate(
      props.maybeSelectedVoiceConversionModel.token
    );

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
    ? "btn btn-primary w-100 disabled"
    : "btn btn-primary w-100";

  const enableConvertButton =
    canConvert &&
    mediaUploadToken !== undefined &&
    props.maybeSelectedVoiceConversionModel !== undefined;

  return (
    <Panel padding mb>
      <form onSubmit={handleFormSubmit}>
        <div className="row g-5">
          <div className="col-12 col-lg-6 d-flex flex-column gap-4">
            <h4>
              <FontAwesomeIcon icon={faWaveformLines} className="me-3" />
              Use Voice
            </h4>
            <ul className="nav nav-tabs nav-vc" id="myTab" role="tablist">
              <li className="nav-item w-100" role="presentation">
                <button
                  className="nav-link active w-100 pt-0"
                  id="prerecorded-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#prerecorded"
                  type="button"
                  role="tab"
                  aria-controls="prerecorded"
                  aria-selected="true"
                >
                  Upload
                </button>
              </li>
              <li className="nav-item w-100" role="presentation">
                <button
                  className="nav-link w-100 pt-0"
                  id="recordaudio-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#recordaudio"
                  type="button"
                  role="tab"
                  aria-controls="recordaudio"
                  aria-selected="false"
                >
                  Microphone
                </button>
              </li>
            </ul>
            <div className="tab-content" id="myTabContent">
              <div
                className="tab-pane fade show active"
                id="prerecorded"
                role="tabpanel"
                aria-labelledby="prerecorded-tab"
              >
                <div className="d-flex flex-column gap-4 h-100">
                  <div>
                    <label className="sub-title">Upload Input Audio</label>
                    <div className="d-flex flex-column gap-3 upload-component">
                      <UploadComponent
                        setMediaUploadToken={setMediaUploadToken}
                        formIsCleared={formIsCleared}
                        setFormIsCleared={setFormIsCleared}
                        setCanConvert={setCanConvert}
                        changeConvertIdempotencyToken={
                          changeConvertIdempotencyToken
                        }
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
                        <label
                          className="form-check-label"
                          htmlFor="autoF0Checkbox"
                        >
                          Auto F0 (off for singing, on for speech)
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="sub-title">Convert Audio</label>

                    <div className="d-flex gap-3">
                      <button
                        className={speakButtonClass}
                        onClick={handleVoiceConversion}
                        type="submit"
                        disabled={!enableConvertButton}
                      >
                        <FontAwesomeIcon icon={faRightLeft} className="me-2" />
                        Convert
                        {convertLoading && <LoadingIcon />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="tab-pane fade"
                id="recordaudio"
                role="tabpanel"
                aria-labelledby="recordaudio-tab"
              >
                <div className="d-flex flex-column gap-4 h-100">
                  <div>
                    <label className="sub-title">Record Audio</label>
                    <div className="d-flex flex-column gap-3 upload-component">
                      <RecordComponent
                        setMediaUploadToken={setMediaUploadToken}
                        formIsCleared={formIsCleared}
                        setFormIsCleared={setFormIsCleared}
                        setCanConvert={setCanConvert}
                        changeConvertIdempotencyToken={
                          changeConvertIdempotencyToken
                        }
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

                  <div>
                    <label className="sub-title">Convert Audio</label>

                    <div className="d-flex gap-3">
                      <button
                        className={speakButtonClass}
                        onClick={handleVoiceConversion}
                        type="submit"
                        disabled={!enableConvertButton}
                      >
                        <FontAwesomeIcon icon={faRightLeft} className="me-2" />
                        Convert
                        {convertLoading && <LoadingIcon />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-6">
            <h4 className="mb-4">
              <FontAwesomeIcon icon={faBarsStaggered} className="me-3" />
              Session V2V Results
            </h4>
            <div className="d-flex flex-column gap-3 session-tts-section session-vc-section">
              <SessionVoiceConversionResultsList />
            </div>
          </div>
        </div>
      </form>
    </Panel>
  );
}
