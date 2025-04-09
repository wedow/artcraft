import { ApiConfig } from "../ApiConfig";

// Responses from the `/session` endpoint.
export interface SessionInfoSuccessResponse {
  // API call was successful
  success: boolean,

  // Whether the user is logged in
  logged_in: boolean,

  // Extended user details (only if logged in)
  user: UserInfo | undefined | null,
}

export interface UserInfo {
  user_token: string,
  username: string,
  display_name: string,
  email_gravatar_hash: string,

  // Rollout feature flags
  can_access_studio: boolean,
  maybe_feature_flags: string[],

  // Usage
  can_use_tts: boolean,
  can_use_w2l: boolean,
  can_delete_own_tts_results: boolean,
  can_delete_own_w2l_results: boolean,
  can_delete_own_account: boolean,

  // Contribution
  can_upload_tts_models: boolean,
  can_upload_w2l_templates: boolean,
  can_delete_own_tts_models: boolean,
  can_delete_own_w2l_templates: boolean,

  // Moderation
  can_approve_w2l_templates: boolean,
  can_edit_other_users_profiles: boolean,
  can_edit_other_users_tts_models: boolean,
  can_edit_other_users_w2l_templates: boolean,
  can_delete_other_users_tts_models: boolean,
  can_delete_other_users_tts_results: boolean,
  can_delete_other_users_w2l_templates: boolean,
  can_delete_other_users_w2l_results: boolean,
  can_ban_users: boolean,
  can_delete_users: boolean,
}

export interface SessionInfoErrorResponse {
  success: boolean,
  error_reason: string,
}

export type GetSessionInfoResponse = SessionInfoSuccessResponse | SessionInfoErrorResponse;

export function GetSessionInfoIsOk(response: GetSessionInfoResponse): response is SessionInfoSuccessResponse {
  return response.hasOwnProperty('logged_in');
}

export function GetSessionInfoIsErr(response: GetSessionInfoResponse): response is SessionInfoErrorResponse {
  return !response.hasOwnProperty('error_reason');
}

export async function GetSessionInfo() : Promise<GetSessionInfoResponse> {
  const endpoint = new ApiConfig().sessionDetails();
  
  return await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  })
  .then(res => res.json())
  .then(res => {
    const response : GetSessionInfoResponse = res;
    return response;
  })
  .catch(e => {
    return {
      success: false,
      error_reason: "frontend_error",
    };
  });
}
