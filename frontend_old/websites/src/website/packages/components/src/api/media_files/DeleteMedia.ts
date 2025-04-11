import MakeRequest from "../MakeRequest";

export interface DeleteMediaRequest {
  as_mod: boolean,
  set_delete: boolean
}

export interface DeleteMediaResponse {
  success: boolean
}

export const DeleteMedia = MakeRequest<string, DeleteMediaRequest, DeleteMediaResponse,{}>({
  method: "DELETE",
  routingFunction: (media_token: string) => `/v1/media_files/file/${ media_token }`,
});