import MakeRequest from "../../MakeRequest";

export interface EnqueueTtsRequest {
  uuid_idempotency_token: string,
  text: string,
  voice_token: string,
}

export interface EnqueueTtsResponse {
  success: boolean,
  inference_job_token: string,
}

export const EnqueueTts = MakeRequest<string, EnqueueTtsRequest, EnqueueTtsResponse,{}>({
    method: "POST", 
    routingFunction: () => "/v1/voice_designer/inference/enqueue_tts",
});
