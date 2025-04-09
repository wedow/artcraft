import MakeRequest from "../MakeRequest";
import { Weight } from "../weights/GetWeight";

export interface UserBookmarksListRequest {}

export interface UserBookmarksListResponse {
  // pagination: Pagination,
  success: boolean;
  results: Weight[];
}

export interface UserBookmarksListQueries {
  page_index?: number;
  page_size: number;
}

export const GetBookmarksByUser = MakeRequest<
  string,
  UserBookmarksListRequest,
  UserBookmarksListResponse,
  UserBookmarksListQueries
>({
  method: "GET",
  routingFunction: (userToken: string) =>
    `/v1/user_bookmarks/list/user/${userToken}`,
});
