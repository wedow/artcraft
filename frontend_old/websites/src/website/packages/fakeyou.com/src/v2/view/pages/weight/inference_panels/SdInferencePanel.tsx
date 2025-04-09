import React, { useRef, useState, memo, useEffect } from "react";
import {
  Accordion,
  Button,
  Input,
  Label,
  NumberSlider,
  Panel,
  SegmentButtons,
  SelectModal,
  SplitPanel,
  TempSelect,
  TempTextArea,
} from "components/common";
import { onChanger } from "resources";
import {
  faList,
  faRectangleLandscape,
  faRectanglePortrait,
  faSquare,
} from "@fortawesome/pro-solid-svg-icons";
import { v4 as uuidv4 } from "uuid";
import {
  EnqueueImageGen,
  EnqueueImageGenIsSuccess,
  EnqueueImageGenIsError,
} from "@storyteller/components/src/api/image_generation/EnqueueImageGen";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import PremiumLock from "components/PremiumLock";
import { useInferenceJobs } from "hooks";
import InferenceJobsList from "components/layout/InferenceJobsList";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import { useSession } from "hooks";

interface SdInferencePanelProps {
  weight_token?: string;
  isStandalone?: boolean;
  weightPageType?: "lora" | "sd";
}

function SdInferencePanel({
  weight_token,
  isStandalone = false,
  weightPageType = "sd",
}: SdInferencePanelProps) {
  const { sessionSubscriptions } = useSession();
  const { enqueueInferenceJob, inferenceJobs } = useInferenceJobs();
  const [loraToken, setLoraToken] = useState<string | null>(null);
  const [sdToken, setSdToken] = useState<string | null>(null);

  useEffect(() => {
    if (weightPageType === "sd") {
      setSdToken(weight_token || null);
      setLoraToken(null);
    } else if (weightPageType === "lora") {
      setLoraToken(weight_token || null);
      setSdToken(null);
    }
  }, [weightPageType, weight_token]);

  const handleOnWeightSelect = (data: { token: string; title: string }) => {
    setSdToken(data.token);
  };
  const handleOnSelect = (data: { token: string; title: string }) => {
    setLoraToken(data.token);
  };

  const [isEnqueuing, setIsEnqueuing] = useState(false);
  const [seed, setSeed] = useState("random");
  const [seedNumber, setSeedNumber] = useState("");
  const [sampler, samplerSet] = useState("DPM++ 2M Karras");
  const [aspectRatio, aspectRatioSet] = useState("square");
  const [cfgScale, cfgScaleSet] = useState(7);
  const [samples, samplesSet] = useState(8);
  const [batchCount, batchCountSet] = useState(3);
  const [prompt, prompSet] = useState("");
  const [negativePrompt, negativePromptSet] = useState("");
  const onChange = onChanger({
    batchCountSet,
    cfgScaleSet,
    samplerSet,
    aspectRatioSet,
    prompSet,
    negativePromptSet,
    samplesSet,
  });

  const initialState = {
    prompt: "",
    negativePrompt: "",
    aspectRatio: "square",
    seed: "random",
    seedNumber: "",
    sampler: "DPM++ 2M Karras",
    cfgScale: 7,
    samples: 25,
    batchCount: 3,
    loraToken: null,
  };

  const resetToInitialState = () => {
    prompSet(initialState.prompt);
    negativePromptSet(initialState.negativePrompt);
    aspectRatioSet(initialState.aspectRatio);
    setSeed(initialState.seed);
    setSeedNumber(initialState.seedNumber);
    samplerSet(initialState.sampler);
    cfgScaleSet(initialState.cfgScale);
    samplesSet(initialState.samples);
    batchCountSet(initialState.batchCount);
  };

  const samplerOpts = [
    { label: "DPM++ 2M Karras", value: "DPM++ 2M Karras" },
    { label: "DPM++ SDE Karras", value: "DPM++ SDE Karras" },
    { label: "DPM++ 2M SDE Exponential", value: "DPM++ 2M SDE Exponential" },
    { label: "DPM++ 2M SDE Karras", value: "DPM++ 2M SDE Karras" },
    { label: "Euler a", value: "Euler a" },
    { label: "Euler", value: "Euler" },
    { label: "LMS", value: "LMS" },
    { label: "Heun", value: "Heun" },
    { label: "DPM2", value: "DPM2" },
    { label: "DPM2 a", value: "DPM2 a" },
    { label: "DPM++ 2S a", value: "DPM++ 2S a" },
    { label: "DPM++ 2M", value: "DPM++ 2M" },
    { label: "DPM++ SDE", value: "DPM++ SDE" },
    { label: "DPM++ 2M SDE", value: "DPM++ 2M SDE" },
    { label: "DPM++ 2M SDE Heun", value: "DPM++ 2M SDE Heun" },
    { label: "DPM++ 2M SDE Heun Karras", value: "DPM++ 2M SDE Heun Karras" },
    {
      label: "DPM++ 2M SDE Heun Exponential",
      value: "DPM++ 2M SDE Heun Exponential",
    },
    { label: "DPM++ 3M SDE", value: "DPM++ 3M SDE" },
    { label: "DPM++ 3M SDE Karras", value: "DPM++ 3M SDE Karras" },
    { label: "DPM++ 3M SDE Exponential", value: "DPM++ 3M SDE Exponential" },
    { label: "DPM fast", value: "DPM fast" },
    { label: "DPM adaptive", value: "DPM adaptive" },
    { label: "LMS Karras", value: "LMS Karras" },
    { label: "DPM2 Karras", value: "DPM2 Karras" },
    { label: "DPM2 a Karras", value: "DPM2 a Karras" },
    { label: "DPM++ 2S a Karras", value: "DPM++ 2S a Karras" },
  ];

  const dimensionOpts = [
    { label: "Square", value: "square", icon: faSquare, subLabel: "512x512" },
    {
      label: "Landscape",
      value: "landscape",
      icon: faRectangleLandscape,
      subLabel: "768x512",
    },
    {
      label: "Portrait",
      value: "portrait",
      icon: faRectanglePortrait,
      subLabel: "512x768",
    },
  ];

  const batchCountOpts = [
    { label: "1", value: 1 },
    { label: "2", value: 2 },
    { label: "3", value: 3 },
    { label: "4", value: 4 },
    { label: "5", value: 5 },
    { label: "6", value: 6 },
    { label: "7", value: 7 },
    { label: "8", value: 8 },
  ];

  const seedOpts = [
    { label: "Random", value: "random" },
    { label: "Custom", value: "custom" },
  ];

  let imageWidth: number;
  let imageHeight: number;

  switch (aspectRatio) {
    case "square":
      imageWidth = 512;
      imageHeight = 512;
      break;
    case "landscape":
      imageWidth = 768;
      imageHeight = 512;
      break;
    case "portrait":
      imageWidth = 512;
      imageHeight = 768;
      break;
    default:
      throw new Error("Invalid aspect ratio");
  }

  const handlePromptChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    prompSet(event.target.value);
  };

  const handleNegativePromptChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    negativePromptSet(event.target.value);
  };

  const generateRandomSeed = () => Math.floor(Math.random() * Math.pow(2, 32));
  const internalSeed = useRef(generateRandomSeed()); // useRef to hold the internal seed

  const handleSeedChange = (option: any) => {
    const { value } = option.target;

    if (value === "custom") {
      if (seedNumber === "") {
        const randomSeed = generateRandomSeed();
        internalSeed.current = randomSeed;
        setSeedNumber(randomSeed.toString());
      }
      setSeed(value);
    } else {
      setSeed(value);
      setSeedNumber("");
      internalSeed.current = generateRandomSeed(); // Generate a new random seed when switching back to "Random"
    }
  };

  const handleSeedNumberChange = (event: any) => {
    const customSeed = event.target.value;
    setSeedNumber(customSeed);
    internalSeed.current =
      customSeed !== "" ? parseInt(customSeed, 10) : generateRandomSeed();
    setSeed("custom");
  };

  const handleBlur = () => {
    if (seedNumber === "") {
      setSeed("random");
    }
  };

  const handleEnqueueImageGen = async (
    ev: React.FormEvent<HTMLButtonElement>
  ) => {
    ev.preventDefault();

    if (!prompt || sdToken === undefined) {
      return false;
    }

    if (!sessionSubscriptions?.hasPaidFeatures()) {
      return false;
    }

    if (!sessionSubscriptions?.hasActiveProSubscription()) {
      batchCountSet(1);
    }

    setIsEnqueuing(true);

    //make sure seed is random on generation if random is selected
    if (seed === "random") {
      internalSeed.current = generateRandomSeed();
    }

    const request = {
      uuid_idempotency_token: uuidv4(),
      maybe_sd_model_token: sdToken || null,
      maybe_lora_model_token: loraToken || null,
      maybe_prompt: prompt,
      maybe_n_prompt: negativePrompt,
      maybe_seed: internalSeed.current,
      maybe_width: imageWidth,
      maybe_height: imageHeight,
      maybe_sampler: sampler,
      maybe_cfg_scale: cfgScale,
      maybe_number_of_samples: samples,
      maybe_batch_count: batchCount,
    };

    const response = await EnqueueImageGen(request);

    if (EnqueueImageGenIsSuccess(response)) {
      if (response.inference_job_token) {
        enqueueInferenceJob(
          response.inference_job_token,
          FrontendInferenceJobType.ImageGeneration
        );
      }
    } else if (EnqueueImageGenIsError(response)) {
      console.log("error", response);
    }
    setIsEnqueuing(false);

    return false;
  };

  const failures = (fail = "") => {
    switch (fail) {
      default:
        return "Uknown failure";
    }
  };

  return (
    <PremiumLock requiredPlan="any" showCtaButton={true} large={true}>
      <div>
        <SplitPanel dividerHeader={true}>
          <SplitPanel.Header padding={true}>
            <h4 className="fw-semibold mb-0 flex-grow-1">Generate an Image</h4>
          </SplitPanel.Header>

          <SplitPanel.Body padding={true}>
            <div className="d-flex flex-column gap-3 mb-4">
              {(isStandalone || weightPageType === "lora") && (
                <SelectModal
                  required={true}
                  modalTitle="Select Stable Diffusion Weight"
                  label="Select a Stable Diffusion Weight"
                  onSelect={handleOnWeightSelect}
                  tabs={[
                    {
                      label: "All Weights",
                      tabKey: "allWeights",
                      typeFilter: "sd_1.5",
                      searcher: true,
                      type: "weights",
                    },
                    {
                      label: "Bookmarked",
                      tabKey: "bookmarkedWeights",
                      typeFilter: "sd_1.5",
                      searcher: false,
                      type: "weights",
                      onlyBookmarked: true,
                    },
                  ]}
                />
              )}

              <TempTextArea
                {...{
                  label: "Prompt",
                  placeholder: "Enter a prompt",
                  onChange: handlePromptChange,
                  value: prompt,
                  required: true,
                }}
              />
              <TempTextArea
                {...{
                  label: "Negative Prompt",
                  name: "negativePrompt",
                  placeholder: "Enter a negative prompt",
                  onChange: handleNegativePromptChange,
                  value: negativePrompt,
                }}
              />
              <SegmentButtons
                {...{
                  label: "Aspect Ratio",
                  name: "aspectRatio",
                  onChange,
                  options: dimensionOpts,
                  value: aspectRatio,
                }}
              />
              <div>
                <Label label="Number of Generations" />
                <PremiumLock requiredPlan="pro">
                  <SegmentButtons
                    {...{
                      name: "batchCount",
                      onChange,
                      options: batchCountOpts,
                      value: batchCount,
                    }}
                  />
                </PremiumLock>
              </div>
            </div>

            <Accordion>
              <Accordion.Item title="Advanced">
                <div className="p-3 d-flex flex-column gap-3">
                  <TempSelect
                    {...{
                      label: "Sampler",
                      name: "sampler",
                      onChange,
                      options: samplerOpts,
                      value: sampler,
                    }}
                  />
                  <div>
                    <label className="sub-title">Seed</label>
                    <div className="d-flex gap-2 align-items-center">
                      <SegmentButtons
                        {...{
                          name: "seed",
                          onChange: handleSeedChange,
                          options: seedOpts,
                          value: seed,
                        }}
                      />
                      <Input
                        placeholder="Random"
                        value={seedNumber}
                        onChange={handleSeedNumberChange}
                        type="number"
                        onBlur={handleBlur}
                      />
                    </div>
                  </div>
                  <NumberSlider
                    {...{
                      min: 1,
                      max: 30,
                      name: "cfgScale",
                      label: "CFG Scale",
                      onChange,
                      thumbTip: "CFG Scale",
                      value: cfgScale,
                      step: 0.5,
                    }}
                  />
                  <NumberSlider
                    {...{
                      min: 8,
                      max: 64,
                      name: "samples",
                      label: "Samples",
                      onChange,
                      thumbTip: "Samples",
                      value: samples,
                    }}
                  />
                  {weightPageType === "sd" && (
                    <SelectModal
                      modalTitle="Select LoRA Weight"
                      label="Additional LoRA Weight"
                      onSelect={handleOnSelect}
                      tabs={[
                        {
                          label: "All LoRA Weights",
                          tabKey: "allLoraWeights",
                          typeFilter: "loRA",
                          searcher: true,
                          type: "weights",
                        },
                        {
                          label: "Bookmarked",
                          tabKey: "bookmarkedLoraWeights",
                          typeFilter: "loRA",
                          searcher: false,
                          type: "weights",
                          onlyBookmarked: true,
                        },
                      ]}
                    />
                  )}
                </div>
              </Accordion.Item>
            </Accordion>
            <div className="d-flex mt-4 align-items-center flex-wrap gap-4">
              {isStandalone && (
                <div className="flex-grow-1">
                  <p className="fs-7">
                    <span className="opacity-75">
                      Can't find the model weights you're looking for?
                    </span>{" "}
                    <Link to="/upload/sd">Upload your own!</Link>
                  </p>
                </div>
              )}

              <div className="d-flex gap-2 justify-content-end flex-grow-1">
                <Button
                  {...{
                    label: "Clear/Reset ",
                    variant: "secondary",
                    onClick: resetToInitialState,
                  }}
                />
                <Button
                  {...{
                    label: "Generate Image",
                    disabled: prompt === "" || sdToken === "",
                    onClick: handleEnqueueImageGen,
                    isLoading: isEnqueuing,
                  }}
                />
              </div>
            </div>
          </SplitPanel.Body>

          <InferenceJobsList
            {...{
              failures,
              jobType: FrontendInferenceJobType.ImageGeneration,
            }}
          />
        </SplitPanel>

        {inferenceJobs && inferenceJobs.length ? (
          <div className={isStandalone ? "mt-4" : "mt-3"}>
            <InferenceJobsList
              {...{
                failures,
                value: 0,
                jobType: FrontendInferenceJobType.ImageGeneration,
              }}
            />
          </div>
        ) : (
          <>
            {isStandalone && (
              <Panel padding={true} className="mt-4">
                <div className="d-flex flex-column align-items-center justify-content-center gap-2 py-5 opacity-75">
                  <h4 className="fw-semibold mb-0">
                    <FontAwesomeIcon icon={faList} className="me-2 fs-5" />
                    No jobs queued
                  </h4>

                  <p>Your queued image jobs will appear here.</p>
                </div>
              </Panel>
            )}
          </>
        )}
      </div>
    </PremiumLock>
  );
}

export default memo(SdInferencePanel);
