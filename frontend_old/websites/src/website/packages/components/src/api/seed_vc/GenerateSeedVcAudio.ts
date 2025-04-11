import MakeRequest from "../MakeRequest";

export interface GenerateSeedVcAudioRequest {
  uuid_idempotency_token: string;
  source_media_file_token: string;
  reference_media_file_token: string;
  creator_set_visibility: string;
}

export interface GenerateSeedVcAudioResponse {
  success: boolean;
  inference_job_token: string;
}

export const GenerateSeedVcAudio = MakeRequest<
  string,
  GenerateSeedVcAudioRequest,
  GenerateSeedVcAudioResponse,
  {}
>({
  method: "POST",
  routingFunction: () => "/v1/voice_conversion/seed_vc_inference",
});
