import { ApiConfig } from "@storyteller/components";

export interface GetUserListSuccessResponse {
  success: boolean,
  users: Array<UserForList>
}

export interface UserForList {
  user_id: number,
  user_token: string,

  username: string,
  display_name: string,
  gravatar_hash: string,

  is_banned: boolean,
  user_role_slug: string,

  created_at: Date,
  updated_at: Date,
}

export interface GetUserListErrorResponse {
  success: boolean,
  error_type: string,
  error_message: string,
}

type GetUserListResponse = GetUserListSuccessResponse | GetUserListErrorResponse;

export function GetUserListIsOk(response: GetUserListResponse): response is GetUserListSuccessResponse {
  return response?.success === true;
}

export function GetUserListIsError(response: GetUserListResponse): response is GetUserListErrorResponse {
  return response?.success === false;
}

export async function GetUserList() : Promise<GetUserListResponse> 
{
  const endpoint = new ApiConfig().getModerationUserList();
  
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
