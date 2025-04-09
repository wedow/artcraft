import MakeRequest from "../MakeRequest";
import { UserDetailsLight } from "../_common/UserDetailsLight";
import { MediaFileType } from "../_common/enums/MediaFileType";
import { WeightType } from "../_common/enums/WeightType";
import { MediaFileClass } from "../enums/MediaFileClass";
import { MediaFileSubtype } from "../enums/MediaFileSubtype";
import {
  AnimationType,
  EngineCategory,
  WeightCategory,
} from "@storyteller/components/src/api/_common/enums";

export interface MediaVideoPreviews {
  animated: string;
  animated_thumbnail_template: string;
  still: string;
  still_thumbnail_template: string;
}

// export type MediaThumbFn = (width: number) => string;

export interface ResponseMediaLinks {
  cdn_url: string;
  // path for image media thumbnails
  maybe_thumbnail_template: string | null;
  // previews for video media
  maybe_video_previews: MediaVideoPreviews | null;
}

export interface MediaFile {
  token: string;
  media_type: MediaFileType;
  media_class: MediaFileClass | null;
  media_links: ResponseMediaLinks;
  maybe_engine_category: EngineCategory | null;
  maybe_animation_type: AnimationType | null;
  maybe_media_subtype: MediaFileSubtype | null;
  public_bucket_path: string;
  maybe_engine_extension: string | null;
  maybe_batch_token: string;
  maybe_title: string | null;
  maybe_style_name: string | null;
  maybe_original_filename: string | null;
  maybe_creator_user: UserDetailsLight | null;
  maybe_prompt_token: string | null;
  creator_set_visibility: string;
  is_featured: boolean;
  maybe_model_weight_info: {
    title: string;
    weight_token: string;
    weight_category: WeightCategory;
    weight_type: WeightType;
    maybe_weight_creator: UserDetailsLight;
    maybe_cover_image_public_bucket_path: string;
  };
  maybe_scene_source_media_file_token: string | null;
  cover_image: {
    default_cover: {
      color_index: number;
      image_index: number;
    };
    maybe_cover_image_public_bucket_path: string | null;
  };
  maybe_moderator_fields?: MediaFileModeratorFields;
  created_at: Date;
  updated_at: Date;
  maybe_text_transcript?: string | undefined;
}

// export interface MediaFile extends ResponseMediaFile {
//   frontendURLs: {
//     imageThumb: MediaThumbFn;
//     main: string;
//     videoStill: MediaThumbFn;
//     videoAnimated: MediaThumbFn;
//   };
// }

export interface MediaFileModeratorFields {
  maybe_style_transfer_source_media_file_token?: string;
}

export interface GetMediaRequest {}

export interface GetMediaResponse {
  success: boolean;
  media_file?: MediaFile;
}

export const GetMedia = MakeRequest<
  string,
  GetMediaRequest,
  GetMediaResponse,
  {}
>({
  method: "GET",
  routingFunction: (mediaFileToken: string) =>
    `/v1/media_files/file/${mediaFileToken}`,
});
