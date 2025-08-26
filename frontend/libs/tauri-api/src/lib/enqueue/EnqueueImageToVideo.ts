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
  // Required. The model to use.
  model?: ModelInfo;

  // Required. Starting frame.
  image_media_token?: string;

  // Optional. Ending frame.
  end_frame_image_media_token?: string;

  // Optional. Text prompt to direct the video.
  prompt?: string;
}

interface RawEnqueueImageToVideoRequest {
  model?: string;
  image_media_token?: string;
  end_frame_image_media_token?: string;
  prompt?: string;
}

export interface EnqueueImageToVideoError extends CommandResult {
  error_type: EnqueueImageToVideoErrorType;
  error_message?: string;
}

export interface EnqueueImageToVideoPayload {
}

export interface EnqueueImageToVideoSuccess extends CommandResult {
  payload: EnqueueImageToVideoPayload;
}

export type EnqueueImageToVideoResult = EnqueueImageToVideoSuccess | EnqueueImageToVideoError;

export const EnqueueImageToVideo = async (request: EnqueueImageToVideoRequest) : Promise<EnqueueImageToVideoResult> => {
  const modelName = request.model?.tauri_id;

  let mutableRequest : RawEnqueueImageToVideoRequest = {
    model: modelName,
    image_media_token: request.image_media_token,
  };

  if (!!request.prompt) {
    mutableRequest.prompt = request.prompt;
  }

  if (!!request.end_frame_image_media_token) {
    mutableRequest.end_frame_image_media_token = request.end_frame_image_media_token;
  }

  const result = await invoke("enqueue_image_to_video_command", { 
    request: mutableRequest,
  });

  return (result as EnqueueImageToVideoResult);
}
