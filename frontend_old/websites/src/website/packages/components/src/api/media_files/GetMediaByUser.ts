import MakeRequest from "../MakeRequest";
import { MediaFile } from "./GetMedia";
import { Pagination } from "../_common/SharedFetchTypes";

export interface GetMediaRequest {}

export interface GetMediaListResponse {
  pagination: Pagination;
  success: boolean;
  results: MediaFile[];
}

export interface GetMediaParams {
  page_index: number;
}

export const GetMediaByUser = MakeRequest<
  string,
  GetMediaRequest,
  GetMediaListResponse,
  GetMediaParams
>({
  method: "GET",
  routingFunction: (userToken: string) =>
    `/v1/media_files/list/user/${userToken}`,
});
