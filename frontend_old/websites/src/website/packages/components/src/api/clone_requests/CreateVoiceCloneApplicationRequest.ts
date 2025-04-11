
import { ApiConfig } from "@storyteller/components";

export interface CreateVoiceCloneApplicationRequest {

  idempotency_token: string,

  // Contact
  email_address: string,
  discord_username: string,

  // TODO: Make enum.
  // Visibility
  is_for_private_use: boolean,
  is_for_public_use: boolean,

  // Use
  is_for_studio: boolean,
  is_for_twitch_tts: boolean,
  is_for_api_use: boolean,
  is_for_music: boolean,
  is_for_games: boolean,
  is_for_other: boolean,
  optional_notes_on_use?: string,

  // Subject/Ownership
  is_own_voice: boolean,
  is_third_party_voice: boolean,
  optional_notes_on_subject?: string,

  // Equipment
  has_clean_audio_recordings: boolean,
  has_good_microphone: boolean,

  // Comments
  optional_questions?: string,
  optional_extra_comments?: string,
}

export interface CreateVoiceCloneApplicationSuccessResponse {
  success: boolean,
}

export interface CreateVoiceCloneApplicationErrorResponse {
  success: boolean,
}

type CreateVoiceCloneApplicationResponse = CreateVoiceCloneApplicationSuccessResponse | CreateVoiceCloneApplicationErrorResponse;

export function CreateVoiceCloneApplicationIsSuccess(response: CreateVoiceCloneApplicationResponse): response is CreateVoiceCloneApplicationSuccessResponse {
  return response?.success === true;
}

export function CreateVoiceCloneApplicationIsError(response: CreateVoiceCloneApplicationResponse): response is CreateVoiceCloneApplicationErrorResponse {
  return response?.success === false;
}

export async function CreateVoiceCloneApplication(request: CreateVoiceCloneApplicationRequest) : Promise<CreateVoiceCloneApplicationResponse> 
{
  const endpoint = new ApiConfig().createVoiceCloneRequest();
  
  return await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(request),
  })
  .then(res => res.json())
  .then(res => {
    if (!res) {
      return { success : false };
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
