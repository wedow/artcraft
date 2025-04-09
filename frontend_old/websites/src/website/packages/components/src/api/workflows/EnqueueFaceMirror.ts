import MakeRequest from "../MakeRequest";

// this type is eqivelent to react-easy-crops Area type

export interface MediaFileCropArea {
  height: number;
  width: number;
  x: number;
  y: number;
}
export interface EnqueueFaceMirrorRequest {
  creator_set_visibility: "public" | "private";
  face_driver_media_file_token: string;
  maybe_crop: MediaFileCropArea;
  remove_watermark: boolean;
  source_media_file_token: string;
  used_webcam?: boolean;
  uuid_idempotency_token: string;
}

export interface EnqueueFaceMirrorResponse {
  inference_job_token?: string;
  success: boolean;
}

export const EnqueueFaceMirror = MakeRequest<
  string,
  EnqueueFaceMirrorRequest,
  EnqueueFaceMirrorResponse,
  {}
>({
  method: "POST",
  routingFunction: () => `/v1/workflows/enqueue_face_mirror`,
});
