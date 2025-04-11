import MakeRequest from "../MakeRequest";

export interface GetPromptsRequest {}

export interface Prompt {
  created_at: Date;
  maybe_global_ipa_image_token?: string;
  maybe_positive_prompt?: string;
  maybe_negative_prompt?: string;
  maybe_style_name?: string;
  maybe_strength?: number;
  maybe_inference_duration_millis?: number;
  prompt_type: string;
  used_face_detailer: boolean;
  used_upscaler: boolean;
  lipsync_enabled: boolean;
  lcm_disabled: boolean;
  use_cinematic: boolean;
  maybe_moderator_fields?: PromptModeratorFields;
}

export interface PromptModeratorFields {
  maybe_inference_duration_millis?: number;
  main_ipa_workflow?: string;
  face_detailer_workflow?: string;
  upscaler_workflow?: string;
}

export interface GetPromptsResponse {
  prompt: Prompt;
  success: boolean;
}

export const GetPrompts = MakeRequest<
  string,
  GetPromptsRequest,
  GetPromptsResponse,
  {}
>({
  method: "GET",
  routingFunction: (token: string) => `/v1/prompts/${token}`,
});
