import MakeRequest from "../MakeRequest";

export interface GenerateF5TtsAudioRequest {
  uuid_idempotency_token: string;
  source_media_file_token: string;
  inference_text: string;
  creator_set_visibility: string;
}

export interface GenerateF5TtsAudioResponse {
  success: boolean;
  inference_job_token: string;
}

export const GenerateF5TtsAudio = MakeRequest<
  string,
  GenerateF5TtsAudioRequest,
  GenerateF5TtsAudioResponse,
  {}
>({
  method: "POST",
  routingFunction: () => "/v1/tts/f5_inference",
});
