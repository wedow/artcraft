import MakeMultipartRequest from "../../MakeMultipartRequest";
import { FormEvent } from "react";

export interface UploadSampleRequest {
  uuid_idempotency_token?: string,
  file: any,
  dataset_token: string,
}

export interface UploadSampleResponse {
  success: boolean
}

export const UploadSample = (thing = "", request: UploadSampleRequest) => {
  return MakeMultipartRequest("/v1/voice_designer/sample/upload",request);
}