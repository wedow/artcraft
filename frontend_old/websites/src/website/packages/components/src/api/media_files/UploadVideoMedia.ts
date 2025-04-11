import MakeMultipartRequest, {
  OnUploadProgress,
} from "../MakeMultipartRequest";

export interface UploadVideoMediaRequest {
  file: any;
  is_intermediate_system_file?: boolean;
  maybe_scene_source_media_file_token?: string;
  maybe_style_name?: string;
  maybe_title?: string;
  maybe_visibility?: "public" | "private";
  uuid_idempotency_token: string;
}

export interface UploadVideoMediaResponse {
  media_file_token: string;
  success: boolean;
}

export const UploadVideoMedia = (
  request: UploadVideoMediaRequest,
  onUploadProgress?: OnUploadProgress
) => {
  return MakeMultipartRequest(
    "/v1/media_files/upload/new_video",
    request,
    onUploadProgress
  );
};
