import { ApiConfig } from "../ApiConfig";

interface VoiceConversionModelListResponsePayload {
  success: boolean,
  models: Array<VoiceConversionModelListItem>,
}

export interface VoiceConversionModelListItem {
  token: string,
  model_type: string,
  title: string,

  creator: CreatorDetails,
  creator_set_visibility: string,

  ietf_language_tag: string,
  ietf_primary_language_subtag: string,
  is_front_page_featured: boolean,

  created_at: string,
  updated_at: string,
}

export interface CreatorDetails {
  user_token: string,
  username: string,
  display_name: string,
  gravatar_hash: string,
}

// TODO: user ratings
//export interface UserRatings {
//  positive_count: number,
//  negative_count: number,
//  // Total count does not take into account "neutral" ratings.
//  total_count: number,
//}

export async function ListVoiceConversionModels() : Promise<Array<VoiceConversionModelListItem>| undefined> {
  const endpoint = new ApiConfig().listVoiceConversionModels();
  
  return await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  })
  .then(res => res.json())
  .then(res => {
    const response : VoiceConversionModelListResponsePayload = res;
    if (!response.success) {
      return;
    }
    return response?.models;
  })
  .catch(e => {
    return undefined;
  });
}
