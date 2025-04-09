import MakeRequest from "../MakeRequest";
import { MediaFile } from "./GetMedia";

export interface GetMediaBatchImagesRequest {}

export interface GetMediaBatchImagesResponse {
  success: boolean;
  results: MediaFile[];
}

export interface GetMediaBatchImagesParams {}

export const GetMediaBatchImages = MakeRequest<
  string,
  GetMediaBatchImagesRequest,
  GetMediaBatchImagesResponse,
  GetMediaBatchImagesParams
>({
  method: "GET",
  routingFunction: (batchToken: string) =>
    `/v1/media_files/batch/${batchToken}`,
});
