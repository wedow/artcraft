import { ApiConfig } from "../ApiConfig";

export interface SetUserRatingRequest {
  entity_token: string,
  entity_type: string,
  rating_value: string,
}

export interface SetUserRatingSuccessResponse {
  success: boolean,
}

export interface SetUserRatingErrorResponse {
  success: boolean,
}

type SetUserRatingResponse = SetUserRatingSuccessResponse | SetUserRatingErrorResponse;

export function SetUserRatingIsOk(response: SetUserRatingResponse): response is SetUserRatingSuccessResponse {
  return response?.success === true;
}

export function SetUserRatingIsError(response: SetUserRatingResponse): response is SetUserRatingErrorResponse {
  return response?.success === false;
}

export async function SetUserRating(request: SetUserRatingRequest) : Promise<SetUserRatingResponse> 
{
  const endpoint = new ApiConfig().setUserRating();
  
  return fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  .then(res => res.json())
  .then(res => {
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
