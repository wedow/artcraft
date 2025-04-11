
import MakeRequest from "../MakeRequest";

export interface EnqueueGsvModelDownloadRequest {
  uuid_idempotency_token: string;

  download_url: string;

  maybe_title?: string;
  maybe_description?: string;
  maybe_cover_image_media_file_token?:	string;

  creator_set_visibility?:	string;
}

export interface EnqueueGsvModelDownloadResponse {
  success: boolean;
}

export const EnqueueGsvModelDownload = MakeRequest<
  string,
  EnqueueGsvModelDownloadRequest,
  EnqueueGsvModelDownloadResponse,
  {}
>({
  method: "POST",
  routingFunction: () =>
    `/v1/model_download/gsv`,
});
