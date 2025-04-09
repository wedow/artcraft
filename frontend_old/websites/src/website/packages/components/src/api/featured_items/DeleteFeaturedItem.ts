import MakeRequest from "../MakeRequest";

export interface DeleteFeaturedItemRequest {
  entity_token: string,
  entity_type: string,
}

export interface DeleteFeaturedItemResponse {
  success: boolean
}

export const DeleteFeaturedItem = MakeRequest<
  string, 
  DeleteFeaturedItemRequest, 
  DeleteFeaturedItemResponse,
  {}
>({
  method: "DELETE",
  routingFunction: () => "/v1/featured_item/delete",
});