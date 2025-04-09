import MakeRequest from "../MakeRequest";
import { Weight } from "./GetWeight";
import { LazyPagination } from "../_common/SharedFetchTypes";

export interface ListWeightsRequest {}

export interface ListWeightsResponse {
  pagination: LazyPagination;
  success: boolean;
  results: Weight[];
}

export interface ListWeightsParams {
  page_index: number;
}

export const ListWeights = MakeRequest<
  string,
  ListWeightsRequest,
  ListWeightsResponse,
  ListWeightsParams
>({
  method: "GET",
  routingFunction: () => `/v1/weights/list`,
});
