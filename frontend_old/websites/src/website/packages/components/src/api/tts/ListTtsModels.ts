import { ApiConfig } from "../ApiConfig";

interface TtsModelListResponsePayload {
  success: boolean,
  models: Array<TtsModelListItem>,
}

export interface TtsModelListItem {
  model_token: string,
  tts_model_type: string,
  creator_user_token: string,
  creator_username: string,
  creator_display_name: string,
  creator_gravatar_hash: string,
  ietf_language_tag: string,
  ietf_primary_language_subtag: string,
  updatable_slug: string,
  title: string,
  is_front_page_featured: boolean,
  is_twitch_featured: boolean,
  user_ratings: UserRatings,
  category_tokens: string[],
  created_at: string,
  updated_at: string,
}

export interface UserRatings {
  positive_count: number,
  negative_count: number,
  // Total count does not take into account "neutral" ratings.
  total_count: number,
}

export async function ListTtsModels() : Promise<Array<TtsModelListItem>| undefined> {
  const endpoint = new ApiConfig().listTts();
  
  return await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  })
  .then(res => res.json())
  .then(res => {
    const response : TtsModelListResponsePayload = res;
    if (!response.success) {
      return;
    }
    return response?.models;
  })
  .catch(e => {
    return undefined;
  });
}
