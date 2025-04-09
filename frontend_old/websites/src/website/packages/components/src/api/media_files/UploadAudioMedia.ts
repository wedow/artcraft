import MakeMultipartRequest from "../MakeMultipartRequest";

export interface UploadAudioMediaRequest {
  file: any;
  maybe_title?: string;
  maybe_visibility?: "public" | "private";
  uuid_idempotency_token: string;
}

export interface UploadAudioMediaResponse {
  media_file_token: string;
  success: boolean;
}

export const UploadAudioMedia = (request: UploadAudioMediaRequest) => {
  return MakeMultipartRequest("/v1/media_files/upload/audio", request);
};
