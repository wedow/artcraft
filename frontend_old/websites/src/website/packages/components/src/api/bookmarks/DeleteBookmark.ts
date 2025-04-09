import MakeRequest from "../MakeRequest";

export interface DeleteBookmarkRequest {
  as_mod: boolean,
}

export interface DeleteBookmarkResponse {
  success: boolean
}

export const DeleteBookmark = MakeRequest<string, DeleteBookmarkRequest, DeleteBookmarkResponse,{}>({
  method: "POST",
  routingFunction: (user_bookmark_token: string) => `/v1/user_bookmarks/delete/${ user_bookmark_token }`,
});