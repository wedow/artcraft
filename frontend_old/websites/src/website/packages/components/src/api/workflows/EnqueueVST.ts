import MakeRequest from "../MakeRequest";

export interface EnqueueVSTRequest {
  creator_set_visibility: string;
  enable_lipsync: boolean;
  input_file: string;
  negative_prompt: string;
  prompt: string;
  style: string;

  global_ipa_media_token?: string | null;

  trim_end_millis: number;
  trim_start_millis: number;

  // Use face detailer
  // Only for premium accounts
  use_face_detailer?: boolean;

  // Use video upscaler
  // Only for premium accounts
  use_upscaler?: boolean;

  // Use cinematic mode
  use_cinematic?: boolean;

  // Use Strength of the style transfer
  // Must be between 0.0 (match source) and 1.0 (maximum dreaming).
  // The default, if not sent, is 1.0.
  use_strength?: number;

  uuid_idempotency_token: string;
}

export interface EnqueueVSTResponse {
  inference_job_token?: string;
  success: boolean;
}

export const EnqueueVST = MakeRequest<
  string,
  EnqueueVSTRequest,
  EnqueueVSTResponse,
  {}
>({
  method: "POST",
  routingFunction: () => `/v1/workflows/enqueue_vst`,
});
