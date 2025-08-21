use std::collections::HashSet;
use std::fmt;
use std::sync::Arc;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_file_cover_image_details_builder::MediaFileCoverImageDetailsBuilder;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::common_responses::user_details_lite_builder::UserDetailsLightBuilder;
use crate::http_server::endpoints::media_files::get::get_media_file_handler::GetMediaFilePathInfo;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::web_utils::bucket_urls::bucket_url_string_from_media_path::bucket_url_string_from_media_path;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest, HttpResponse};
use actix_web_lab::extract::Query;
use artcraft_api_defs::common::responses::media_links::MediaLinks;
use artcraft_api_defs::common::responses::simple_entity_stats::SimpleEntityStats;
use artcraft_api_defs::media_file::list_batch_generated_media_files::{BatchGeneratedMediaFileInfo, ListBatchGeneratedMediaFilesPathInfo, ListBatchGeneratedMediaFilesSuccessResponse};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use chrono::{DateTime, Utc};
use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_subtype::MediaFileSubtype;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::by_table::model_weights::weights_types::WeightsType;
use enums::common::visibility::Visibility;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use enums_public::by_table::model_weights::public_weights_types::PublicWeightsType;
use log::warn;
use mysql_queries::queries::media_files::get::batch_get_media_files::batch_get_media_files;
use mysql_queries::queries::media_files::list::list_batch_generated_media_files::list_batch_generated_media_files_with_connection;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::prompts::PromptToken;
use utoipa::{IntoParams, ToSchema};

/// List media files generated as part of the same batch
#[utoipa::path(
  get,
  tag = "Media Files",
  path = "/v1/media_files/batch_generated/{token}",
  responses(
    (status = 200, description = "Success", body = ListBatchGeneratedMediaFilesSuccessResponse),
  ),
  params(
    ("request" = ListBatchGeneratedMediaFilesPathInfo, description = "Payload for Request"),
  )
)]
pub async fn list_batch_generated_media_files_handler(
  http_request: HttpRequest,
  path: Path<ListBatchGeneratedMediaFilesPathInfo>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<ListBatchGeneratedMediaFilesSuccessResponse>, CommonWebError> {
  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::ServerError
      })?;

  let mut show_deleted_results = false;
  let mut is_moderator = false;

  if let Some(user_session) = maybe_user_session {
    // NB: Moderators can see deleted results.
    // Original creators cannot see them (unless they're moderators!)
    show_deleted_results = user_session.can_delete_other_users_tts_results;
    // Moderators get to see all the fields.
    is_moderator = user_session.can_delete_other_users_tts_results
        || user_session.can_edit_other_users_tts_models;
  }

  // NB(bt,2024-03-24): I'm sorry, this is gross. We're not respecting sorting, input ordering,
  // de-duplication, (if we swap types), etc. Gotta go fast.
  let result = list_batch_generated_media_files_with_connection(
    &path.token,
    show_deleted_results,
    &mut mysql_connection,
  ).await;

  let media_files = match result {
    Ok(batch) => batch.media_files,
    Err(e) => {
      warn!("query error: {:?}", e);
      return Err(CommonWebError::ServerError);
    }
  };

  let media_domain = get_media_domain(&http_request);

  let media_files = media_files.into_iter()
      .map(|result| {
        let public_bucket_path = MediaFileBucketPath::from_object_hash(
          &result.public_bucket_directory_hash,
          result.maybe_public_bucket_prefix.as_deref(),
          result.maybe_public_bucket_extension.as_deref());

        // let maybe_cover_image_public_bucket_path = match result.maybe_model_cover_image_public_bucket_hash
        //     .as_deref()
        // {
        //   None => None,
        //   Some(hash) => Some(MediaFileBucketPath::from_object_hash(
        //     &hash,
        //     result.maybe_model_cover_image_public_bucket_prefix.as_deref(),
        //     result.maybe_model_cover_image_public_bucket_extension.as_deref())
        //       .get_full_object_path_str()
        //       .to_string()
        //   )
        // };

        // // NB: Some engine pages will need to know the engine extension to load the file.
        // let maybe_engine_extension = match result.media_type {
        //   MediaFileType::Bvh => Some(".bvh".to_string()),
        //   MediaFileType::Glb => Some(".glb".to_string()),
        //   MediaFileType::Gltf => Some(".gltf".to_string()),
        //   MediaFileType::SceneRon => Some(".scn.ron".to_string()),
        //   _ => None,
        // };

        BatchGeneratedMediaFileInfo {
          token: result.token.clone(),
          media_class: result.media_class,
          media_type: result.media_type,
          maybe_batch_token: result.maybe_batch_token,
          media_links: MediaLinksBuilder::from_media_path(media_domain, &public_bucket_path),
          cover_image: MediaFileCoverImageDetailsBuilder::from_optional_db_fields(
            &result.token,
            media_domain,
            result.maybe_file_cover_image_public_bucket_hash.as_deref(),
            result.maybe_file_cover_image_public_bucket_prefix.as_deref(),
            result.maybe_file_cover_image_public_bucket_extension.as_deref(),
          ),
          maybe_title: result.maybe_title,
          maybe_creator_user: UserDetailsLightBuilder::from_optional_db_fields_owned(
            result.maybe_creator_user_token,
            result.maybe_creator_username,
            result.maybe_creator_display_name,
            result.maybe_creator_gravatar_hash,
          ),
          creator_set_visibility: result.creator_set_visibility,
          maybe_prompt_token: result.maybe_prompt_token,
          maybe_original_filename: result.maybe_origin_filename,
          maybe_duration_millis: result.maybe_duration_millis,
          created_at: result.created_at,
          updated_at: result.updated_at,
          // maybe_text_transcript: result.maybe_text_transcript,
          // maybe_live_portrait_details: result.extra_media_file_info
          //     .as_ref()
          //     .map(|info| MediaFileLivePortraitDetails::maybe_from_extra_info(&info))
          //     .flatten(),
          // maybe_style_name: result.maybe_prompt_args
          //     .as_ref()
          //     .and_then(|args| args.style_name.as_ref())
          //     .and_then(|style| style.to_style_name()),
          // public_bucket_path: public_bucket_path
          //     .get_full_object_path_str()
          //     .to_string(),
          // public_bucket_url: bucket_url_string_from_media_path(&public_bucket_path),
          // maybe_engine_category: result.maybe_engine_category,
          // maybe_animation_type: result.maybe_animation_type,
          // maybe_media_subtype: result.maybe_media_subtype,
          // maybe_engine_extension,
          // maybe_model_weight_info: match result.maybe_model_weights_token {
          //   None => None,
          //   Some(weight_token) => Some(ListBatchGeneratedMediaFilesModelInfo {
          //     weight_token,
          //     // TODO(bt,2023-12-28): Instead of giving bogus defaults on None, make these optional or return
          //     //  None for *everything* on any field being absent.
          //     weight_type: PublicWeightsType::from_enum(result.maybe_model_weights_type.unwrap_or(WeightsType::Tacotron2)),
          //     weight_category: result.maybe_model_weights_category.unwrap_or(WeightsCategory::TextToSpeech),
          //     title: result.maybe_model_weights_title.unwrap_or_else(|| "model".to_string()),
          //     maybe_cover_image_public_bucket_path,
          //     maybe_weight_creator: UserDetailsLightBuilder::from_optional_db_fields_owned(
          //       result.maybe_model_weight_creator_user_token,
          //       result.maybe_model_weight_creator_username,
          //       result.maybe_model_weight_creator_display_name,
          //       result.maybe_model_weight_creator_gravatar_hash,
          //     ),
          //   })
          // },
          // is_user_upload: result.is_user_upload,
          // is_intermediate_system_file: result.is_intermediate_system_file,
          // is_emulated_media_file: false,
          // stats: SimpleEntityStats {
          //   positive_rating_count: result.maybe_ratings_positive_count.unwrap_or(0),
          //   bookmark_count: result.maybe_bookmark_count.unwrap_or(0),
          // },
        }
      })
      .collect();

  Ok(Json(ListBatchGeneratedMediaFilesSuccessResponse {
    success: true,
    media_files,
  }))
}
