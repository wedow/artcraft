import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";
import { ModelInfo } from "@storyteller/model-list";

export enum EnqueueImageToVideoErrorType {
  /// Caller didn't specify a model
  ModelNotSpecified = "model_not_specified",
  /// Generic server error
  ServerError = "server_error",
  /// No Fal API key available
  NeedsFalApiKey = "needs_fal_api_key",
  /// Fal had an API error
  FalError = "fal_error",
}

export interface EnqueueImageToVideoRequest {
  image_media_token?: string;
  model?: ModelInfo;
}

export interface EnqueueImageToVideoError extends CommandResult {
  error_type: EnqueueImageToVideoErrorType;
  error_message?: string;
}

export interface EnqueueImageToVideoPayload {
  media_token: string;
  cdn_url: string;
  base64_bytes: string;
}

export interface EnqueueImageToVideoSuccess extends CommandResult {
  payload: EnqueueImageToVideoPayload;
}

export type EnqueueImageToVideoResult = EnqueueImageToVideoSuccess | EnqueueImageToVideoError;

export const EnqueueImageToVideo = async (request: EnqueueImageToVideoRequest) : Promise<EnqueueImageToVideoResult> => {
  const modelName = request.model?.tauri_id;

  const result = await invoke("enqueue_image_to_video_command", { 
    request: {
      image_media_token: request.image_media_token,
      model: modelName,
    }
  });

  return (result as EnqueueImageToVideoResult);
}
