import MakeMultipartRequest from "../MakeMultipartRequest";

export interface UploadAudioRequest {
  uuid_idempotency_token?: string,
  file: any,
  // dataset_token: string,
}

export interface UploadAudioResponse {
  success: boolean
}

export const UploadAudio = (thing = "", request: UploadAudioRequest) => {
  return MakeMultipartRequest("/v1/media_uploads/upload",request);
}