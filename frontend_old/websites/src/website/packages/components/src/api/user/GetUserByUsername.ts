import { ApiConfig } from "@storyteller/components";

export interface User {
  user_token: string,
  username: string,
  display_name: string,
  email_gravatar_hash: string,
  default_avatar_index: number,
  default_avatar_color_index: number,
  profile_markdown: string,
  profile_rendered_html: string,
  user_role_slug: string,
  dark_mode: string,
  avatar_public_bucket_hash: string,
  disable_gravatar: boolean,
  hide_results_preference: boolean,
  website_url: string | undefined | null,
  discord_username: string | undefined | null,
  twitch_username: string | undefined | null,
  twitter_username: string | undefined | null,
  github_username: string | undefined | null,
  //patreon_username?: string,
  cashapp_username: string | undefined | null,
  created_at: string,
  badges: ProfileBadge[],
  maybe_moderator_fields: UserProfileModeratorFields | null | undefined,
}

export interface ProfileBadge {
  slug: string,
  title: string,
  description: string,
  image_url: string,
  granted_at: string,
}

export interface UserProfileModeratorFields {
  is_banned: boolean,
  maybe_mod_comments: string | null | undefined,
  maybe_mod_user_token: string | null | undefined,
  maybe_feature_flags: string[] | null | undefined,
}

export enum UserLookupError {
  NotFound,
  ServerError,
  FrontendError,
}

export type GetUserByUsernameResponse = User | UserLookupError;

export function GetUserByUsernameIsOk(response: GetUserByUsernameResponse): response is User {
  return response.hasOwnProperty('username');
}

export function GetUserByUsernameIsErr(response: GetUserByUsernameResponse): response is UserLookupError {
  return !response.hasOwnProperty('username');
}

interface ProfileResponsePayload {
  success: boolean,
  error_reason?: string,
  user?: User,
}

export async function GetUserByUsername(username: string) : Promise<GetUserByUsernameResponse> {
  const usernameLower = username.toLowerCase(); // NB: Until I standardize on display name vs username lookup.
  const endpoint = new ApiConfig().getProfile(usernameLower);
  
  return await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  })
  .then(res => res.json())
  .then(res => {
    const response : ProfileResponsePayload = res;

    if (response?.success) {
      return response.user!;
    } 

    if (response?.success === false) {
      if (response.error_reason?.includes("not found")) {
        return UserLookupError.NotFound;
      } else {
        return UserLookupError.ServerError;
      }
    }

    return UserLookupError.FrontendError;
  })
  .catch(e => {
    return UserLookupError.FrontendError;
  });
}
