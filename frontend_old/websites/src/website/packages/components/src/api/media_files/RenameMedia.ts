import MakeRequest from "../MakeRequest";

export interface RenameMediaRequest {
  name?: string,
}

export interface RenameMediaResponse {
  success: boolean
}

export const RenameMedia = MakeRequest<string, RenameMediaRequest, RenameMediaResponse,{}>({
  method: "POST",
  routingFunction: (media_token: string) => `/v1/media_files/rename/${ media_token }`,
});