import MakeRequest from "../MakeRequest";

export interface Bookmark {
    entity_token: string,
    entity_type: string,
    is_bookmarked: boolean,
    maybe_bookmark_token?: string
}

export interface GetBookmarksRequest {}

export interface GetBookmarksResponse {
  success: boolean,
  bookmarks?: Bookmark[]
}

export interface GetBookmarksQueries {
  tokens: string[],
}

export const GetBookmarks = MakeRequest<string, GetBookmarksRequest, GetBookmarksResponse, GetBookmarksQueries>({
  method: "GET",
  routingFunction: () => `/v1/user_bookmarks/batch`,
});