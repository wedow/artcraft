import MakeMultipartRequest from "../MakeMultipartRequest";

export interface UploadPmxRequest {
  uuid_idempotency_token?: string,
  file: any,

  engine_category: string,

  maybe_title?: string,
  maybe_visibility?: string,
  maybe_animation_type?: string,
}

export interface UploadPmxResponse {
  media_file_token: string,
  success: boolean
}

export const UploadPmx = (request: UploadPmxRequest) => {
  return MakeMultipartRequest("/v1/media_files/upload/pmx", request);
}
