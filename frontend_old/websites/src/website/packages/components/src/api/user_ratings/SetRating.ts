import MakeRequest from "../MakeRequest";

export interface SetRatingRequest {
  entity_token: string,
  entity_type: string,
  rating_value: string
}

export interface SetRatingResponse {
  success: boolean
}

export const SetRating = MakeRequest<string, SetRatingRequest, SetRatingResponse,{}>({
  method: "POST",
  routingFunction: () => `/v1/user_rating/rate`,
});