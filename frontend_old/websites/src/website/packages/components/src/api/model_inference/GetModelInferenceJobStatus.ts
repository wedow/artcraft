import { ApiConfig } from "../ApiConfig";

export interface GetModelInferenceJobStatusSuccessResponse {
  success: boolean;
  state: ModelInferenceJobStatus;
}

export interface ModelInferenceJobStatus {
  // Job primary key
  job_token: string;

  request: RequestDetails;
  status: StatusDetails;
  maybe_result?: ResultDetails;

  created_at: Date;
  updated_at: Date;
}

export interface RequestDetails {
  inference_category: string;

  maybe_model_type?: string;
  maybe_model_token?: string;
  maybe_model_title?: string;

  maybe_raw_inference_text?: string;

  maybe_live_portrait_details?: LivePortraitDetails;
  maybe_lipsync_details?: LipsyncDetails;

  maybe_style_name?: string;
}

export interface StatusDetails {
  status: string;
  maybe_extra_status_description?: string;
  maybe_failure_category?: string;
  attempt_count: number;
  progress_percentage: number;
}

export interface ResultDetails {
  entity_type: string;
  entity_token: string;

  maybe_public_bucket_media_path?: string;
}

export type LivePortraitDetails = {
  source_media_file_token: string;
  face_driver_media_file_token: string;
};

export type LipsyncDetails = {
  audio_source_token: string;
  image_or_video_source_token: string;
};

export interface GetModelInferenceJobStatusErrorResponse {
  success: boolean;
}

export type GetModelInferenceJobStatusResponse =
  | GetModelInferenceJobStatusSuccessResponse
  | GetModelInferenceJobStatusErrorResponse;

export function GetModelInferenceJobStatusIsOk(
  response: GetModelInferenceJobStatusResponse
): response is GetModelInferenceJobStatusSuccessResponse {
  return response?.success === true;
}

export function GetModelInferenceJobStatusIsError(
  response: GetModelInferenceJobStatusResponse
): response is GetModelInferenceJobStatusErrorResponse {
  return response?.success === false;
}

export async function GetModelInferenceJobStatus(
  jobToken: string
): Promise<GetModelInferenceJobStatusResponse> {
  const endpoint = new ApiConfig().getModelInferenceJobStatus(jobToken);

  return fetch(endpoint, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  })
    .then(res => res.json())
    .then(res => {
      if (res && "success" in res) {
        return res;
      } else {
        return { success: false };
      }
    })
    .catch(e => {
      return { success: false };
    });
}
