import MakeRequest from "../MakeRequest";

export interface ListTagsRequest {}

export interface ListTagsResponse {
  success: boolean;
  tags: [
    {
      token: string;
      value: string;
    },
  ];
}

export const ListTags = MakeRequest<
  string,
  ListTagsRequest,
  ListTagsResponse,
  {}
>({
  method: "GET",
  routingFunction: (weight_token: string) =>
    `/v1/tags/list/model_weight/${weight_token}`,
});
