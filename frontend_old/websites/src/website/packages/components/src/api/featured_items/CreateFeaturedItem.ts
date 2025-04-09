import MakeRequest from "../MakeRequest";

export interface CreateFeaturedItemRequest {
  entity_token: string,
  entity_type: string,
}

export interface CreateFeaturedItemResponse {
  success: boolean
}

export const CreateFeaturedItem = MakeRequest<
  string, 
  CreateFeaturedItemRequest, 
  CreateFeaturedItemResponse,
  {}
>({
  method: "POST",
  routingFunction: () => "/v1/featured_item/create",
});