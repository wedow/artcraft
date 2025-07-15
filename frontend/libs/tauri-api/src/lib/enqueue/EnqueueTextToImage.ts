import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";
import { ModelInfo } from "@storyteller/model-list";

export enum EnqueueTextToImageErrorType {
  /// Caller didn't specify a model
  ModelNotSpecified = "model_not_specified",
  /// Generic server error
  ServerError = "server_error",
  /// No Fal API key available
  NeedsFalApiKey = "needs_fal_api_key",
  /// Fal had an API error
  FalError = "fal_error",
}

export interface EnqueueTextToImageRequest {
  prompt?: string;
  model?: ModelInfo | EnqueueTextToImageModel;
  aspect_ratio?: EnqueueTextToImageSize;
}

interface EnqueueTextToImageRawRequest {
  prompt?: string;
  model?: EnqueueTextToImageModel | string; // TODO: Shouldn't allow string
  aspect_ratio?: EnqueueTextToImageSize;
}

export enum EnqueueTextToImageModel {
  FluxProUltra = "flux_pro_ultra",
  GptImage1 = "gpt_image_1",
  Recraft3 = "recraft_3",
}

export enum EnqueueTextToImageSize {
  Auto = "auto",
  Square = "square",
  Wide = "wide",
  Tall = "tall",
}

export interface EnqueueTextToImageError extends CommandResult {
  error_type: EnqueueTextToImageErrorType;
  error_message?: string;
}

export interface EnqueueTextToImagePayload {
  media_token: string;
  cdn_url: string;
  base64_bytes: string;
}

export interface EnqueueTextToImageSuccess extends CommandResult {
  payload: EnqueueTextToImagePayload;
}

export type EnqueueTextToImageResult = EnqueueTextToImageSuccess | EnqueueTextToImageError;

export const EnqueueTextToImage = async (request: EnqueueTextToImageRequest) : Promise<EnqueueTextToImageResult> => {
  let modelName = undefined;

  if (!!request.model) {
    if (typeof request.model === "string") {
      modelName = request.model;
    } else {
      modelName = request.model.tauri_id;
    }
  }

  let mutableRequest : EnqueueTextToImageRawRequest = {
    prompt: request.prompt,
    model: modelName,
  };

  if (!!request.aspect_ratio) {
    mutableRequest.aspect_ratio = request.aspect_ratio;
  }

  const result = await invoke("enqueue_text_to_image_command", { 
    request: mutableRequest,
  });

  return (result as EnqueueTextToImageResult);
}
