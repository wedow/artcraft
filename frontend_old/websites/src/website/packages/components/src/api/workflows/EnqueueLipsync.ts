import MakeRequest from "../MakeRequest";

export interface MediaFileCropArea {
  height: number;
  width: number;
  x: number;
  y: number;
}
export interface EnqueueLipsyncRequest {
  creator_set_visibility: "public" | "private";
  audio_media_file_token: string;
  image_or_video_media_file_token: string;
  maybe_crop?: MediaFileCropArea;
  remove_watermark: boolean;
  uuid_idempotency_token: string;
}

export interface EnqueueLipsyncResponse {
  inference_job_token?: string;
  success: boolean;
}

export const EnqueueLipsync = MakeRequest<
  string,
  EnqueueLipsyncRequest,
  EnqueueLipsyncResponse,
  {}
>({
  method: "POST",
  routingFunction: () => `/v1/workflows/enqueue_lipsync`,
});
