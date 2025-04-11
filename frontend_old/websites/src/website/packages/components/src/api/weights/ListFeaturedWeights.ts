import MakeRequest from "../MakeRequest";
import { Weight } from "./GetWeight";
import { LazyPagination } from "../_common/SharedFetchTypes";

export interface ListFeaturedWeightsRequest {}

export interface ListFeaturedWeightsResponse {
  pagination: LazyPagination;
  success: boolean;
  results: Weight[];
}

export interface ListFeaturedWeightsParams {
  page_index: number;
}

export const ListFeaturedWeights = MakeRequest<
  string,
  ListFeaturedWeightsRequest,
  ListFeaturedWeightsResponse,
  ListFeaturedWeightsParams
>({
  method: "GET",
  routingFunction: () => `/v1/weights/list_featured`,
});
