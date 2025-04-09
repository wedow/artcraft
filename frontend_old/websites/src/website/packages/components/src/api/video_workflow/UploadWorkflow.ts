import MakeRequest from "../MakeRequest";

export interface UploadWorkflowRequest {
  uuid_idempotency_token: String,

  google_drive_link: String,
  title: String,
  description: String,
  commit_hash?: String
  creator_set_visibility: String

  // maybe_lora_upload_path?: String,
  // maybe_name: String,
  // maybe_description: String,
  // visibility: String,
  // maybe_cover_image_media_file_token?: String,
}

export interface UploadWorkflowResponse {
  success: boolean,
  // maybe_sd_model_token?: String,
  // maybe_lora_model_token?: String,
}

export const UploadWorkflow = MakeRequest<string, UploadWorkflowRequest, UploadWorkflowResponse,{}>({
    method: "POST", 
    routingFunction: () => "/v1/workflow/upload/prompt",
});
