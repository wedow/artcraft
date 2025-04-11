import { ApiConfig } from "@storyteller/components";

export interface W2lResult {
  w2l_result_token: string,
  maybe_w2l_template_token?: string,
  maybe_tts_inference_result_token?: string,
  public_bucket_video_path: string,
  template_type: string,
  template_title: string,

  maybe_creator_user_token?: string,
  maybe_creator_username?: string,
  maybe_creator_display_name?: string,
  maybe_creator_gravatar_hash?: string,

  maybe_template_creator_user_token?: string,
  maybe_template_creator_username?: string,
  maybe_template_creator_display_name?: string,
  maybe_template_creator_gravatar_hash?: string,

  creator_set_visibility?: string,

  file_size_bytes: number,
  frame_width: number,
  frame_height: number,
  duration_millis: number,
  created_at: string,
  updated_at: string,

  maybe_moderator_fields: W2lInferenceResultModeratorFields | null | undefined,
}

export interface W2lInferenceResultModeratorFields {
  template_creator_is_banned: boolean,
  result_creator_is_banned_if_user: boolean,
  result_creator_ip_address: string,
  result_creator_deleted_at: string | undefined | null,
  mod_deleted_at: string | undefined | null,
}

export enum W2lResultLookupError {
  NotFound,
  ServerError,
  FrontendError,
}

export type GetW2lResultResponse = W2lResult | W2lResultLookupError;

export function GetW2lResultIsOk(response: GetW2lResultResponse): response is W2lResult {
  return response.hasOwnProperty('w2l_result_token');
}

export function GetW2lResultIsErr(response: GetW2lResultResponse): response is W2lResultLookupError {
  return !response.hasOwnProperty('w2l_result_token');
}

interface W2lInferenceResultResponsePayload {
  success: boolean,
  error_reason?: string,
  result?: W2lResult,
}

export async function GetW2lResult(resultToken: string) : Promise<GetW2lResultResponse> {
  const endpoint = new ApiConfig().viewW2lInferenceResult(resultToken);
  
  return await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  })
  .then(res => res.json())
  .then(res => {
    const response : W2lInferenceResultResponsePayload = res;

    if (response?.success) {
      return response.result!;
    } 

    if (response?.success === false) {
      if (response.error_reason?.includes("not found")) {
        return W2lResultLookupError.NotFound;
      } else {
        return W2lResultLookupError.ServerError;
      }
    }

    return W2lResultLookupError.FrontendError;
  })
  .catch(e => {
    return W2lResultLookupError.FrontendError;
  });
}
