import MakeRequest from "../MakeRequest";

export interface EditTagsRequest {
  tags: string;
}

export interface EditTagsResponse {
  success: boolean;
  tag_tokens: string[];
}

export const EditTags = MakeRequest<
  string,
  EditTagsRequest,
  EditTagsResponse,
  {}
>({
  method: "POST",
  routingFunction: (weight_token: string) =>
    `/v1/tags/edit/model_weight/${weight_token}`,
});
