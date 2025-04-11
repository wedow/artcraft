import { MediaFileSubtype } from "../enums/MediaFileSubtype";
import MakeMultipartRequest from "../MakeMultipartRequest";

export interface UploadEngineAssetRequest {
  uuid_idempotency_token?: string,
  file: any,
  media_file_subtype?: MediaFileSubtype;
}

export interface UploadEngineAssetResponse {
  media_file_token: string,
  success: boolean
}

export const UploadEngineAsset = (request: UploadEngineAssetRequest) => {
  return MakeMultipartRequest("/v1/media_files/upload/engine_asset", request);
}
