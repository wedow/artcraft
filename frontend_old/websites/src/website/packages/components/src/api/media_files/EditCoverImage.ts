import MakeRequest from "../MakeRequest";

export interface EditCoverImageRequest {
  cover_image_media_file_token: string
}

export interface EditCoverImageResponse {
  success: boolean
}

export const EditCoverImage = MakeRequest<string, EditCoverImageRequest, EditCoverImageResponse,{}>({
  method: "POST",
  routingFunction: (media_token: string) => `/v1/media_files/cover_image/${ media_token }`,
});