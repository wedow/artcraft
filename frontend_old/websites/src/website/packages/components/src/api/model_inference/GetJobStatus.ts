import MakeRequest from "../MakeRequest";
import { UserDetailsLight } from "../_common/UserDetailsLight";

export interface RequestDetails {
  inference_category: string;
  maybe_model_type?: string;
  maybe_model_token?: string;
  maybe_model_title?: string;
  maybe_raw_inference_text?: string;
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

export interface JobStatus {
  job_token: string;
  request: RequestDetails;
  status: StatusDetails;
  maybe_result?: ResultDetails;
  created_at: Date;
  updated_at: Date;
}

export interface GetJobStatusRequest {}

export interface GetJobStatusResponse {
  success: boolean;
  state: JobStatus;
}

export const GetJobStatus = MakeRequest<
  string,
  GetJobStatusRequest,
  GetJobStatusResponse,
  {}
>({
  method: "GET",
  routingFunction: (jobToken: string) =>
    `/v1/model_inference/job_status/${jobToken}`,
});
