import { ApiConfig, GetUserRatingArgs } from "../ApiConfig";

export interface GetUserRatingSuccessResponse {
  success: boolean,

  // Possible values: 
  //  - null | undefined: never rated
  //  - "neutral": rating was removed
  //  - "positive"
  //  - "negative"
  maybe_rating_value: string | undefined | null,
}

export interface RetrievalJobStatus {
  // Job primary key
  job_token: string,

  // Job state machine (enum) and retry count
  status: string,
  attempt_count: number,

  // Optional unstructured extra details during the inference process
  maybe_extra_status_description?: string,

  // Job completion: foreign key to entity
  maybe_downloaded_entity_type?: string,
  maybe_downloaded_entity_token?: string,
  
  created_at: Date,
  updated_at: Date,
}

export interface GetUserRatingErrorResponse {
  success: boolean,
}

type GetUserRatingResponse = GetUserRatingSuccessResponse | GetUserRatingErrorResponse;

export function GetUserRatingIsOk(response: GetUserRatingResponse): response is GetUserRatingSuccessResponse {
  return response?.success === true;
}

export function GetUserRatingIsError(response: GetUserRatingResponse): response is GetUserRatingErrorResponse {
  return response?.success === false;
}

export async function GetUserRating(args: GetUserRatingArgs) : Promise<GetUserRatingResponse> 
{
  const endpoint = new ApiConfig().getUserRating(args);
  
  return fetch(endpoint, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
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
