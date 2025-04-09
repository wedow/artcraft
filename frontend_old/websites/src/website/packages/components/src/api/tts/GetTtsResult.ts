import { ApiConfig } from "@storyteller/components";

export interface TtsResult {
  tts_result_token: string,

  tts_model_token: string,
  tts_model_title: string,

  maybe_pretrained_vocoder_used: string | null,

  raw_inference_text: string,

  maybe_creator_user_token?: string,
  maybe_creator_username?: string,
  maybe_creator_display_name?: string,
  maybe_creator_gravatar_hash?: string,

  maybe_model_creator_user_token?: string,
  maybe_model_creator_username?: string,
  maybe_model_creator_display_name?: string,
  maybe_model_creator_gravatar_hash?: string,

  public_bucket_wav_audio_path: string,
  public_bucket_spectrogram_path: string,

  creator_set_visibility?: string,

  file_size_bytes: number,
  duration_millis: number,

  generated_by_worker: string,

  is_debug_request: boolean,

  created_at: string,
  updated_at: string,

  maybe_moderator_fields: TtsInferenceResultModeratorFields | null | undefined,
}

export interface TtsInferenceResultModeratorFields {
  model_creator_is_banned: boolean,
  result_creator_is_banned_if_user: boolean,
  result_creator_ip_address: string,
  result_creator_deleted_at: string | undefined | null,
  mod_deleted_at: string | undefined | null,
}

export enum TtsResultLookupError {
  NotFound,
  ServerError,
  FrontendError,
}

export type GetTtsResultResponse = TtsResult | TtsResultLookupError;

export function GetTtsResultIsOk(response: GetTtsResultResponse): response is TtsResult {
  return response.hasOwnProperty('tts_result_token');
}

export function GetTtsResultIsErr(response: GetTtsResultResponse): response is TtsResultLookupError {
  return !response.hasOwnProperty('tts_result_token');
}

interface TtsInferenceResultResponsePayload {
  success: boolean,
  error_reason?: string,
  result?: TtsResult,
}


export async function GetTtsResult(resultToken: string) : Promise<GetTtsResultResponse> {
  const endpoint = new ApiConfig().viewTtsInferenceResult(resultToken);
  
  return await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  })
  .then(res => res.json())
  .then(res => {
    const response : TtsInferenceResultResponsePayload = res;

    if (response?.success) {
      return response.result!;
    } 

    if (response?.success === false) {
      if (response.error_reason?.includes("not found")) {
        return TtsResultLookupError.NotFound;
      } else {
        return TtsResultLookupError.ServerError;
      }
    }

    return TtsResultLookupError.FrontendError;
  })
  .catch(e => {
    return TtsResultLookupError.FrontendError;
  });
}
