import MakeRequest from "../MakeRequest";

export interface UploadLoraRequest {
  uuid_idempotency_token: String,
  //type_of_inference: String, // upload_lora / check_point / inference
  //maybe_upload_path?: String,
  maybe_lora_upload_path?: String,
  maybe_name: String,
  maybe_description: String,
  visibility: String,
  maybe_cover_image_media_file_token?: String,
}

export interface UploadLoraResponse {
  success: boolean,
  maybe_sd_model_token?: String,
  maybe_lora_model_token?: String,
}

export const UploadLora = MakeRequest<string, UploadLoraRequest, UploadLoraResponse,{}>({
    method: "POST", 
    routingFunction: () => "/v1/image_gen/upload/lora",
});