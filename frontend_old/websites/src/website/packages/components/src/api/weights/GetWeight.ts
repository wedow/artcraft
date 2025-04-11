import MakeRequest from "../MakeRequest";
import { UserDetailsLight } from "../_common/UserDetailsLight";
import { WeightCategory } from "../_common/enums/WeightCategory";
import { WeightType } from "../_common/enums/WeightType";
import { LanguageTag } from "../Languages";

export interface Weight {
  weight_token: string;
  weight_type: WeightType;
  weight_category: WeightCategory;
  title: string;
  maybe_url_slug: string;
  public_bucket_path: string;
  creator_set_visibility: string;
  created_at: Date;
  updated_at: Date;
  creator: UserDetailsLight;
  description_markdown: string;
  description_rendered_html: string;
  file_checksum_sha2: string;
  file_size_bytes: number;
  maybe_cached_user_ratings_ratio: number | null;
  cover_image: {
    maybe_cover_image_public_bucket_path: string | null;
    default_cover: {
      image_index: number;
    };
  };
  version: number;
  is_featured: boolean;
  stats: {
    bookmark_count: number;
    positive_rating_count: number;
  };
  usage_count: number;
  maybe_ietf_primary_language_subtag?: LanguageTag | null;
}

export interface GetWeightRequest {}

export interface GetWeightResponse extends Weight {
  success: boolean;
}

export const GetWeight = MakeRequest<
  string,
  GetWeightRequest,
  GetWeightResponse,
  {}
>({
  method: "GET",
  routingFunction: (weightToken: string) => `/v1/weights/weight/${weightToken}`,
});
