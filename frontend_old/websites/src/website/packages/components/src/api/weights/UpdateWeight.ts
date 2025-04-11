import MakeRequest from "../MakeRequest";
import { LanguageTag } from "../Languages";

export interface UpdateWeightRequest {
  cover_image_media_file_token?: string;
  description_markdown: string;
  description_rendered_html: string;
  title: string;
  visibility: string;
  weight_category: string;
  weight_type: string;
  language_tag: LanguageTag;
}

export interface UpdateWeightResponse {
  success: boolean;
}

export const UpdateWeight = MakeRequest<
  string,
  UpdateWeightRequest,
  UpdateWeightResponse,
  {}
>({
  method: "POST",
  routingFunction: (weight_token: string) =>
    `/v1/weights/weight/${weight_token}`,
});
