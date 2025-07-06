import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export interface EnqueueContextualEditImageRequest {

  /// The model to use.
  model?: EnqueueContextualEditImageModel;

  /// Images to use for the image edit.
  /// The first image is typically a 2D canvas or 3D stage, but doesn't have to be.
  /// There must be at least one image.
  image_media_tokens?: string[];

  /// The user's image generation prompt.
  prompt?: string;

  /// Turn off the system prompt.
  disable_system_prompt?: boolean;

  /// Number of images to generate.
  image_count?: number;

  aspect_ratio?: EnqueueContextualEditImageSize;

  image_quality?: EnqueueContextualEditImageQuality;
}

export enum EnqueueContextualEditImageErrorType {
  ModelNotSpecified = "model_not_specified",
  NoProviderAvailable = "no_provider_available",
  BadRequest = "bad_request",
  ServerError = "server_error",
  TooManyConcurrentTasks = "too_many_concurrent_tasks",
  SoraLoginRequired = "sora_login_required",
  SoraUsernameNotYetCreated = "sora_username_not_yet_created",
  SoraIsHavingProblems = "sora_is_having_problems",
}

export enum EnqueueContextualEditImageModel {
  GptImage1 = "gpt_image_1",
}

export enum EnqueueContextualEditImageSize {
  Auto = "auto",
  Square = "square",
  Wide = "wide",
  Tall = "tall",
}

export enum EnqueueContextualEditImageQuality {
  Auto = "auto",
  High = "high",
  Medium = "medium",
  Low = "low",
}

export interface EnqueueContextualEditImageError extends CommandResult {
  error_type: EnqueueContextualEditImageErrorType;
  error_message?: string;
}

export interface EnqueueContextualEditImagePayload {
}

export interface EnqueueContextualEditImageSuccess extends CommandResult {
  payload: EnqueueContextualEditImagePayload;
}

export type EnqueueContextualEditImageResult = EnqueueContextualEditImageSuccess | EnqueueContextualEditImageError;

export const EnqueueContextualEditImage = async (request: EnqueueContextualEditImageRequest) : Promise<EnqueueContextualEditImageResult> => {
  const result = await invoke("enqueue_contextual_edit_image_command", { 
    request: request,
  });
  return (result as EnqueueContextualEditImageResult);
}
