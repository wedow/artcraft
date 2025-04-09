import MakeRequest from "../MakeRequest";
import { Pagination } from "../_common/SharedFetchTypes";

export interface UserWeightListRequest {}

export interface UserWeightListResponse {
  // pagination: Pagination,
  success: boolean;
  results: any;
}

export interface UserWeightListQueries {
  page_index: number;
}

export const GetWeightsByUser = MakeRequest<
  string,
  UserWeightListRequest,
  UserWeightListResponse,
  UserWeightListQueries
>({
  method: "GET",
  routingFunction: (userToken: string) => `/v1/weights/by_user/${userToken}`,
});
