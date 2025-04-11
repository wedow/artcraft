import MakeRequest from "../MakeRequest";

export interface Rating {
  entity_token: string,
  entity_type: string,
  rating_value: string
}

export interface GetRatingsRequest {}

export interface GetRatingsResponse {
  success: boolean,
  ratings?: Rating[]
}

export interface GetRatingsQueries {
  tokens: string[],
}

export const GetRatings = MakeRequest<string, GetRatingsRequest, GetRatingsResponse, GetRatingsQueries>({
  method: "GET",
  routingFunction: () => `/v1/user_rating/batch`,
});