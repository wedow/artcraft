import MakeRequest from "../../MakeRequest";

export interface CreateVoiceRequest {
  uuid_idempotency_token: string,
  voice_dataset_token: string,
}

export interface CreateVoiceResponse {
  success: boolean,
  inference_job_token: string,
}

export const CreateVoice = MakeRequest<string, CreateVoiceRequest, CreateVoiceResponse,{}>({
    method: "POST", 
    routingFunction: () => "/v1/voice_designer/voice/create",
});
