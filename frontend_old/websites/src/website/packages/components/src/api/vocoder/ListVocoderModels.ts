
import { ApiConfig } from "../ApiConfig";

export interface ListVocoderModelsSuccessResponse {
  success: boolean,
  vocoders: Array<VocoderModel>
}

export interface VocoderModel {
  vocoder_token: string,
  vocoder_type: string,
  title: string,
  is_staff_recommended: boolean,
  creator_username: string,
  creator_display_name: string,
  creator_gravatar_hash: string,
  created_at: Date,
  updated_at: Date,
  moderator_fields: VocoderModelModeratorFields | undefined | null,
}

export interface VocoderModelModeratorFields {
  is_mod_disabled_from_public_use: boolean,
  is_mod_disabled_from_author_use: boolean,
  is_mod_author_editing_locked: boolean,
  mod_deleted_at: string | undefined | null,
  user_deleted_at: string | undefined | null,
}


export interface ListVocoderModelsErrorResponse {
  success: boolean,
}

type ListVocoderModelsResponse = ListVocoderModelsSuccessResponse | ListVocoderModelsErrorResponse;

export function ListVocoderModelsIsOk(response: ListVocoderModelsResponse): response is ListVocoderModelsSuccessResponse {
  return response?.success === true;
}

export function ListVocoderModelsIsError(response: ListVocoderModelsResponse): response is ListVocoderModelsErrorResponse {
  return response?.success === false;
}

export async function ListVocoderModels() : Promise<ListVocoderModelsResponse> 
{
  const endpoint = new ApiConfig().listVocoderModels();
  
  return await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  })
  .then(res => res.json())
  .then(res => {
    if (!res) {
      return { success : false }; // TODO: This loses error semantics and is deprecated
    }

    if (res && 'success' in res) {
      return res;
    } else {
      return { success : false };
    }
  })
  .catch(e => {
    return { success : false };
  });
}
