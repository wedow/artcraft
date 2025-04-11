import MakeRequest from "../MakeRequest";

export interface CancelJobRequest {}

export interface CancelJobResponse {
  success: boolean
}

export const CancelJob = MakeRequest<string, CancelJobRequest, CancelJobResponse,{}>({
  method: "DELETE",
  routingFunction: (jobToken: string) => `/v1/model_inference/job/${ jobToken }`,
});