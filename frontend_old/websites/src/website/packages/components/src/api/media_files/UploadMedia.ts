import MakeMultipartRequest from "../MakeMultipartRequest";

export interface UploadMediaRequest {
  uuid_idempotency_token?: string,
  file: any,
  source: string
  // dataset_token: string,
}

export interface UploadMediaResponse {
  media_file_token: string,
  success: boolean
}

export const UploadMedia = (request: UploadMediaRequest) => {
  return MakeMultipartRequest("/v1/media_files/upload",request);
}