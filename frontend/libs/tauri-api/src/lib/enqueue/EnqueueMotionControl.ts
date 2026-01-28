import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

/**
 * Motion Control API
 * Uses Kling Video v2.6 Motion Control to transfer movements from a reference video to a character image.
 *
 * Fal.ai endpoint: fal-ai/kling-video/v2.6/standard/motion-control
 */

export enum EnqueueMotionControlErrorType {
  /// Model not specified
  ModelNotSpecified = "model_not_specified",
  /// Generic server error
  ServerError = "server_error",
  /// No Fal API key available
  NeedsFalApiKey = "needs_fal_api_key",
  /// Fal had an API error
  FalError = "fal_error",
  /// Missing required parameters
  MissingParameters = "missing_parameters",
}

export type CharacterOrientation = "image" | "video";

export interface EnqueueMotionControlRequest {
  /**
   * Required. Reference image media token.
   * The characters, backgrounds, and other elements in the generated video
   * are based on this reference image. Characters should have clear body
   * proportions, avoid occlusion, and occupy more than 5% of the image area.
   */
  image_media_token: string;

  /**
   * Required. Reference video media token.
   * The character actions in the generated video will be consistent with
   * this reference video. Should contain a realistic style character with
   * entire body or upper body visible, including head, without obstruction.
   * Duration limit depends on character_orientation: 10s max for 'image', 30s max for 'video'.
   */
  video_media_token: string;

  /**
   * Required. Controls whether the output character's orientation matches
   * the reference image or video.
   * - 'video': orientation matches reference video - better for complex motions (max 30s)
   * - 'image': orientation matches reference image - better for following camera movements (max 10s)
   */
  character_orientation: CharacterOrientation;

  /**
   * Optional. Text prompt to describe the scene.
   * Examples: "An african american woman dancing", "A corgi runs in", "Snowy park setting"
   */
  prompt?: string;

  /**
   * Optional. Whether to keep the original sound from the reference video.
   * Default: true
   */
  keep_original_sound?: boolean;

  /**
   * Optional frontend state to return later.
   */
  frontend_caller?: string;

  /**
   * Optional frontend state to return later.
   */
  frontend_subscriber_id?: string;
}

interface RawEnqueueMotionControlRequest {
  image_media_token: string;
  video_media_token: string;
  character_orientation: CharacterOrientation;
  prompt?: string;
  keep_original_sound?: boolean;
  frontend_caller?: string;
  frontend_subscriber_id?: string;
}

export interface EnqueueMotionControlError extends CommandResult {
  error_type: EnqueueMotionControlErrorType;
  error_message?: string;
}

export type EnqueueMotionControlPayload = Record<string, never>;

export interface EnqueueMotionControlSuccess extends CommandResult {
  payload: EnqueueMotionControlPayload;
}

export type EnqueueMotionControlResult =
  | EnqueueMotionControlSuccess
  | EnqueueMotionControlError;

/**
 * Enqueue a motion control generation request.
 * This transfers the motion from a reference video to a character image.
 *
 * @param request - The motion control request parameters
 * @returns Promise with the result of the enqueue operation
 */
export const EnqueueMotionControl = async (
  request: EnqueueMotionControlRequest,
): Promise<EnqueueMotionControlResult> => {
  const mutableRequest: RawEnqueueMotionControlRequest = {
    image_media_token: request.image_media_token,
    video_media_token: request.video_media_token,
    character_orientation: request.character_orientation,
  };

  if (request.prompt) {
    mutableRequest.prompt = request.prompt;
  }

  if (typeof request.keep_original_sound === "boolean") {
    mutableRequest.keep_original_sound = request.keep_original_sound;
  }

  if (request.frontend_caller) {
    mutableRequest.frontend_caller = request.frontend_caller;
  }

  if (request.frontend_subscriber_id) {
    mutableRequest.frontend_subscriber_id = request.frontend_subscriber_id;
  }

  // TODO: Implement the actual Tauri command when backend is ready
  // For now, this is a placeholder that will be connected to the Rust backend
  const result = await invoke("enqueue_motion_control_command", {
    request: mutableRequest,
  });

  return result as EnqueueMotionControlResult;
};
