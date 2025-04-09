import MakeRequest from "../MakeRequest";

export interface DeleteWeightRequest {
  as_mod: boolean,
  set_delete: boolean
}

export interface DeleteWeightResponse {
  success: boolean
}

export const DeleteWeight = MakeRequest<string, DeleteWeightRequest, DeleteWeightResponse,{}>({
  method: "DELETE",
  routingFunction: (weight_token: string) => `/v1/weights/weight/${ weight_token }`,
});