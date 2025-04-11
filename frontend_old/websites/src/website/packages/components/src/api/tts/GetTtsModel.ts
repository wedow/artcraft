import { ApiConfig } from "../ApiConfig";

export interface TtsModel {
  model_token: string,
  title: string,
  tts_model_type: string,
  text_pipeline_type: string | null,
  text_pipeline_type_guess: string,
  maybe_custom_vocoder: CustomVocoderFields | null | undefined,
  maybe_default_pretrained_vocoder: string | null,
  text_preprocessing_algorithm: string,
  creator_user_token: string,
  creator_username: string,
  creator_display_name: string,
  creator_gravatar_hash: string,
  description_markdown: string,
  description_rendered_html: string,
  ietf_language_tag: string,
  ietf_primary_language_subtag: string,
  is_front_page_featured: boolean,
  is_twitch_featured: boolean,
  maybe_suggested_unique_bot_command: string | null,
  user_ratings: UserRatings,
  creator_set_visibility: string,
  updatable_slug: string,
  created_at: string,
  updated_at: string,
  maybe_moderator_fields: TtsModelModeratorFields | null | undefined,
}

export interface CustomVocoderFields {
  vocoder_token: string,
  vocoder_title: string,
  creator_user_token: string,
  creator_username: string,
  creator_display_name: string,
  creator_gravatar_hash: string,
}

export interface UserRatings {
  positive_count: number,
  negative_count: number,
  // Total count does not take into account "neutral" ratings.
  total_count: number,
}

export interface TtsModelModeratorFields {
  use_default_m_factor: boolean,
  maybe_custom_m_factor: number | undefined | null,
  creator_is_banned: boolean,
  creator_ip_address_creation: string,
  creator_ip_address_last_update: string,
  mod_deleted_at: string | undefined | null,
  user_deleted_at: string | undefined | null,
}

export enum TtsModelLookupError {
  NotFound,
  ServerError,
  FrontendError,
}

export type GetTtsModelResponse = TtsModel | TtsModelLookupError;

export function GetTtsModelIsOk(response: GetTtsModelResponse): response is TtsModel {
  return response.hasOwnProperty('model_token');
}

export function GetTtsModelIsErr(response: GetTtsModelResponse): response is TtsModelLookupError {
  return !response.hasOwnProperty('model_token');
}

interface TtsModelViewResponsePayload {
  success: boolean,
  error_reason?: string,
  model?: TtsModel,
}

export async function GetTtsModel(modelToken: string) : Promise<GetTtsModelResponse> {
  const endpoint = new ApiConfig().viewTtsModel(modelToken);
  
  return await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  })
  .then(res => res.json())
  .then(res => {
    const response : TtsModelViewResponsePayload = res;

    if (response?.success) {
      return response.model!;
    } 

    if (response?.success === false) {
      if (response.error_reason?.includes("not found")) {
        return TtsModelLookupError.NotFound;
      } else {
        return TtsModelLookupError.ServerError;
      }
    }

    return TtsModelLookupError.FrontendError;
  })
  .catch(e => {
    return TtsModelLookupError.FrontendError;
  });
}
