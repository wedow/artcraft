import MakeRequest from "../MakeRequest";
import { MediaFile } from "./GetMedia";

export interface ListFeaturedMediaFilesRequest {}

export interface ListFeaturedMediaFilesResponse {
  success: boolean;
  results: MediaFile[];
}

export const ListFeaturedMediaFiles = MakeRequest<
  string,
  ListFeaturedMediaFilesRequest,
  ListFeaturedMediaFilesResponse,
  {}
>({
  method: "GET",
  routingFunction: () => `/v1/media_files/list_featured`,
});
