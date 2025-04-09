import MakeMultipartRequest from "../MakeMultipartRequest";

export interface UploadImageMediaRequest {
  file: any;
  is_intermediate_system_file?: boolean;
  maybe_title?: string;
  maybe_visibility?: "public" | "private";
  uuid_idempotency_token: string;
}

export interface UploadImageMediaResponse {
  media_file_token: string;
  success: boolean;
}

export const UploadImageMedia = (request: UploadImageMediaRequest) => {
  return MakeMultipartRequest("/v1/media_files/upload/image", request);
};
