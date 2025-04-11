import MakeRequest from "../MakeRequest";

export interface CreateBookmarkRequest {
  entity_token: string,
  entity_type: string
}

export interface CreateBookmarkResponse {
  success: boolean,
  user_bookmark_token: string
}

export const CreateBookmark = MakeRequest<string, CreateBookmarkRequest, CreateBookmarkResponse,{}>({
  method: "POST",
  routingFunction: () => `/v1/user_bookmarks/create`,
});