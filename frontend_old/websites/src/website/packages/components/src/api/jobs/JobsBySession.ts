import MakeRequest from "../MakeRequest";
import { InferenceJob } from "@storyteller/components/src/jobs/InferenceJob";
import { ModelInferenceJobStatus } from "@storyteller/components/src/api/model_inference/GetModelInferenceJobStatus";

export interface JobsBySessionRequest {}

export interface JobsBySessionResponse {
  success: boolean;
  jobs?: ModelInferenceJobStatus[];
}

export const JobsBySession = MakeRequest<
  string,
  JobsBySessionRequest,
  JobsBySessionResponse,
  {}
>({
  method: "GET",
  routingFunction: (jobToken: string) => `/v1/jobs/session`,
});
