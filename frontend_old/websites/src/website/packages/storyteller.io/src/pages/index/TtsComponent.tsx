import React, { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  GenerateTtsAudio,
  GenerateTtsAudioRequest,
  GenerateTtsAudioIsError,
  GenerateTtsAudioIsOk,
} from "@storyteller/components/src/api/tts/GenerateTtsAudio";
import { jobStateCanChange } from "@storyteller/components/src/jobs/JobStates";
import {
  TtsInferenceJob,
  TtsInferenceJobStateResponsePayload,
} from "@storyteller/components/src/jobs/TtsInferenceJobs";
import { ApiConfig } from "@storyteller/components";
import { TtsResultsList } from "./TtsResultsList";

const DEFAULT_MODEL_TOKEN = "TM:7wbtjphx8h8v";

// We're only going to allow a limited selection of voices.
const DEMO_VOICES_TOKEN_TO_NAME = new Map<string, string>([
  [DEFAULT_MODEL_TOKEN, "Super Mario (impersonator)"],
  ["TM:4jhmevqnrqp5", "Queen Elizabeth II"],
  ["TM:70nmn1mmqfw8", "Frank Sinatra"],
  ["TM:fehfre1gpzaq", "Richard Nixon"],
  ["TM:cpwrmn5kwh97", "Morgan Freeman"],
  ["TM:kpjg712nen1k", "Betty White"],
  ["TM:7ryawppwcnkv", "Stan Lee"],
]);

interface Props {}

function TtsComponent(props: Props) {
  const [selectedModelToken, setSelectedModelToken] =
    useState(DEFAULT_MODEL_TOKEN);
  const [inferenceText, setInferenceText] = useState("");
  //const [maybeTtsError, setMaybeTtsError] = useState<GenerateTtsAudioErrorType|undefined>(undefined);
  const [jobs, setJobs] = useState<TtsInferenceJob[]>([]);

  const ttsInferenceJobs = useRef<TtsInferenceJob[]>([]);

  const enqueueTtsJob = (jobToken: string) => {
    const newJob = new TtsInferenceJob(jobToken);
    const newJobs = ttsInferenceJobs.current.concat([newJob]);
    console.log("new jobs", newJobs);
    //setTtsInferenceJobs(newJobs);
    ttsInferenceJobs.current = newJobs;
  };

  const checkTtsJob = (jobToken: string) => {
    const endpointUrl = new ApiConfig().getTtsInferenceJobState(jobToken);

    fetch(endpointUrl, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    })
      .then((res) => res.json())
      .then((response) => {
        const jobResponse: TtsInferenceJobStateResponsePayload = response;

        if (jobResponse === undefined || jobResponse.state === undefined) {
          return;
        }

        let updatedJobs: Array<TtsInferenceJob> = [];

        ttsInferenceJobs.current.forEach((existingJob) => {
          if (
            existingJob.jobToken !== jobResponse.state!.job_token ||
            !jobStateCanChange(existingJob.jobState)
          ) {
            updatedJobs.push(existingJob);
            return;
          }

          let updatedJob = TtsInferenceJob.fromResponse(jobResponse.state!);
          updatedJobs.push(updatedJob);
        });

        ttsInferenceJobs.current = updatedJobs;
        //setTtsInferenceJobs(updatedJobs);
        setJobs(updatedJobs);
      })
      .catch((e) => {
        /* Ignore. */
      });
  };

  const pollJobs = useCallback(() => {
    console.log("pollJob");
    ttsInferenceJobs.current.forEach((job) => {
      if (jobStateCanChange(job.jobState)) {
        checkTtsJob(job.jobToken);
      }
    });
  }, []);

  useEffect(() => {
    console.log("useEffect");
    setInterval(() => {
      pollJobs();
    }, 2000);
  }, [pollJobs]);

  const handleChangeText = (ev: React.FormEvent<HTMLTextAreaElement>) => {
    const textValue = (ev.target as HTMLTextAreaElement).value;
    setInferenceText(textValue);
  };

  const handleVoiceChange = (ev: React.FormEvent<HTMLSelectElement>) => {
    const token = (ev.target as HTMLSelectElement).value;
    setSelectedModelToken(token);
  };

  const handleFormSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    if (!selectedModelToken) {
      return false;
    }

    if (!inferenceText) {
      return false;
    }

    const request: GenerateTtsAudioRequest = {
      uuid_idempotency_token: uuidv4(),
      tts_model_token: selectedModelToken,
      inference_text: inferenceText,
      is_storyteller_demo: true, // TODO(2022-03): Temporary.
    };

    const response = await GenerateTtsAudio(request);

    if (GenerateTtsAudioIsOk(response)) {
      //setMaybeTtsError(undefined);
      enqueueTtsJob(response.inference_job_token);
    } else if (GenerateTtsAudioIsError(response)) {
      //setMaybeTtsError(response.error);
    }

    return false;
  };

  let voiceOptions: any = [];
  DEMO_VOICES_TOKEN_TO_NAME.forEach((name, token) => {
    voiceOptions.push(
      <option key={token} value={token}>
        {name}
      </option>
    );
  });

  return (
    <div className="w-100">
      <div className="card bg-dark-solid w-100 mb-5 p-3 p-lg-4">
        <form onSubmit={handleFormSubmit} className="w-100">
          <div className="d-flex flex-column gap-3">
            <div className="field">
              <div className="control">
                <div className="select">
                  <select className="form-select" onChange={handleVoiceChange}>
                    {voiceOptions}
                  </select>
                </div>
              </div>
            </div>

            <div className="field">
              <div className="control">
                <textarea
                  onChange={handleChangeText}
                  className="form-control"
                  value={inferenceText}
                  placeholder="Type something fun..."
                  rows={4}
                ></textarea>
              </div>
            </div>

            <div className="d-flex justify-content-center gap-3">
              <button className="btn btn-primary w-100" disabled={false}>
                Generate
              </button>
              <button
                className="btn btn-secondary w-100"
                onClick={() => setInferenceText("")}
              >
                Clear
              </button>
            </div>
          </div>
        </form>
      </div>
      <TtsResultsList ttsInferenceJobs={jobs} />
    </div>
  );
}

export { TtsComponent };
