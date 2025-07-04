use utoipa::OpenApi;

use artcraft_api_defs::generate::image::edit::gpt_image_1_edit_image::*;
use artcraft_api_defs::generate::image::generate_flux_1_dev_text_to_image::GenerateFlux1DevTextToImageAspectRatio;
use artcraft_api_defs::generate::image::generate_flux_1_dev_text_to_image::GenerateFlux1DevTextToImageNumImages;
use artcraft_api_defs::generate::image::generate_flux_1_dev_text_to_image::GenerateFlux1DevTextToImageRequest;
use artcraft_api_defs::generate::image::generate_flux_1_dev_text_to_image::GenerateFlux1DevTextToImageResponse;
use artcraft_api_defs::generate::image::generate_flux_1_schnell_text_to_image::GenerateFlux1SchnellTextToImageAspectRatio;
use artcraft_api_defs::generate::image::generate_flux_1_schnell_text_to_image::GenerateFlux1SchnellTextToImageNumImages;
use artcraft_api_defs::generate::image::generate_flux_1_schnell_text_to_image::GenerateFlux1SchnellTextToImageRequest;
use artcraft_api_defs::generate::image::generate_flux_1_schnell_text_to_image::GenerateFlux1SchnellTextToImageResponse;
use artcraft_api_defs::generate::image::generate_flux_pro_11_text_to_image::GenerateFluxPro11TextToImageAspectRatio;
use artcraft_api_defs::generate::image::generate_flux_pro_11_text_to_image::GenerateFluxPro11TextToImageNumImages;
use artcraft_api_defs::generate::image::generate_flux_pro_11_text_to_image::GenerateFluxPro11TextToImageRequest;
use artcraft_api_defs::generate::image::generate_flux_pro_11_text_to_image::GenerateFluxPro11TextToImageResponse;
use artcraft_api_defs::generate::image::generate_flux_pro_11_ultra_text_to_image::GenerateFluxPro11UltraTextToImageAspectRatio;
use artcraft_api_defs::generate::image::generate_flux_pro_11_ultra_text_to_image::GenerateFluxPro11UltraTextToImageNumImages;
use artcraft_api_defs::generate::image::generate_flux_pro_11_ultra_text_to_image::GenerateFluxPro11UltraTextToImageRequest;
use artcraft_api_defs::generate::image::generate_flux_pro_11_ultra_text_to_image::GenerateFluxPro11UltraTextToImageResponse;
use artcraft_api_defs::generate::image::remove_image_background::RemoveImageBackgroundRequest;
use artcraft_api_defs::generate::image::remove_image_background::RemoveImageBackgroundResponse;
use artcraft_api_defs::generate::object::generate_hunyuan_2_0_image_to_3d::GenerateHunyuan20ImageTo3dRequest;
use artcraft_api_defs::generate::object::generate_hunyuan_2_0_image_to_3d::GenerateHunyuan20ImageTo3dResponse;
use artcraft_api_defs::generate::object::generate_hunyuan_2_1_image_to_3d::GenerateHunyuan21ImageTo3dRequest;
use artcraft_api_defs::generate::object::generate_hunyuan_2_1_image_to_3d::GenerateHunyuan21ImageTo3dResponse;
use artcraft_api_defs::generate::video::generate_kling_1_6_pro_image_to_video::GenerateKling16ProAspectRatio;
use artcraft_api_defs::generate::video::generate_kling_1_6_pro_image_to_video::GenerateKling16ProDuration;
use artcraft_api_defs::generate::video::generate_kling_1_6_pro_image_to_video::GenerateKling16ProImageToVideoRequest;
use artcraft_api_defs::generate::video::generate_kling_1_6_pro_image_to_video::GenerateKling16ProImageToVideoResponse;
use artcraft_api_defs::generate::video::generate_kling_2_1_master_image_to_video::GenerateKling21MasterAspectRatio;
use artcraft_api_defs::generate::video::generate_kling_2_1_master_image_to_video::GenerateKling21MasterDuration;
use artcraft_api_defs::generate::video::generate_kling_2_1_master_image_to_video::GenerateKling21MasterImageToVideoRequest;
use artcraft_api_defs::generate::video::generate_kling_2_1_master_image_to_video::GenerateKling21MasterImageToVideoResponse;
use artcraft_api_defs::generate::video::generate_kling_2_1_pro_image_to_video::GenerateKling21ProAspectRatio;
use artcraft_api_defs::generate::video::generate_kling_2_1_pro_image_to_video::GenerateKling21ProDuration;
use artcraft_api_defs::generate::video::generate_kling_2_1_pro_image_to_video::GenerateKling21ProImageToVideoRequest;
use artcraft_api_defs::generate::video::generate_kling_2_1_pro_image_to_video::GenerateKling21ProImageToVideoResponse;
use artcraft_api_defs::generate::video::generate_seedance_1_0_lite_image_to_video::GenerateSeedance10LiteDuration;
use artcraft_api_defs::generate::video::generate_seedance_1_0_lite_image_to_video::GenerateSeedance10LiteImageToVideoRequest;
use artcraft_api_defs::generate::video::generate_seedance_1_0_lite_image_to_video::GenerateSeedance10LiteImageToVideoResponse;
use artcraft_api_defs::generate::video::generate_seedance_1_0_lite_image_to_video::GenerateSeedance10LiteResolution;
use artcraft_api_defs::generate::video::generate_veo_2_image_to_video::GenerateVeo2AspectRatio;
use artcraft_api_defs::generate::video::generate_veo_2_image_to_video::GenerateVeo2Duration;
use artcraft_api_defs::generate::video::generate_veo_2_image_to_video::GenerateVeo2ImageToVideoRequest;
use artcraft_api_defs::generate::video::generate_veo_2_image_to_video::GenerateVeo2ImageToVideoResponse;
use billing_component::stripe::http_endpoints::checkout::create::stripe_create_checkout_session_error::CreateCheckoutSessionError;
use billing_component::stripe::http_endpoints::checkout::create::stripe_create_checkout_session_json_handler::*;
use billing_component::users::http_endpoints::list_active_user_subscriptions_handler::*;
use enums::by_table::beta_keys::beta_key_product::BetaKeyProduct;
use enums::by_table::comments::comment_entity_type::CommentEntityType;
use enums::by_table::featured_items::featured_item_entity_type::FeaturedItemEntityType;
use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_subtype::MediaFileSubtype;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::by_table::model_weights::{weights_category::WeightsCategory, weights_types::WeightsType};
use enums::by_table::prompts::prompt_type::PromptType;
use enums::by_table::user_bookmarks::user_bookmark_entity_type::UserBookmarkEntityType;
use enums::by_table::user_ratings::entity_type::UserRatingEntityType;
use enums::by_table::user_ratings::rating_value::UserRatingValue;
use enums::by_table::users::user_feature_flag::UserFeatureFlag;
use enums::common::job_status_plus::JobStatusPlus;
use enums::common::visibility::Visibility;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use enums_public::by_table::media_files::public_media_file_model_type::PublicMediaFileModelType;
use enums_public::by_table::model_weights::public_weights_types::PublicWeightsType;
use tokens::tokens::batch_generations::*;
use tokens::tokens::beta_keys::*;
use tokens::tokens::browser_session_logs::*;
use tokens::tokens::comments::*;
use tokens::tokens::generic_inference_jobs::*;
use tokens::tokens::media_files::*;
use tokens::tokens::model_weights::*;
use tokens::tokens::prompts::*;
use tokens::tokens::user_bookmarks::*;
use tokens::tokens::users::*;
use tokens::tokens::zs_voice_datasets::*;

use crate::http_server::common_requests::auto_product_category::AutoProductCategory;
use crate::http_server::common_requests::media_file_token_path_info::MediaFileTokenPathInfo;
use crate::http_server::common_responses::media::cover_image_links::CoverImageLinks;
use crate::http_server::common_responses::media::media_file_cover_image_details::MediaFileCoverImageDetails;
use crate::http_server::common_responses::media::media_file_cover_image_details::MediaFileDefaultCover;
use crate::http_server::common_responses::media::media_links::*;
use crate::http_server::common_responses::media::weights_cover_image_details::*;
use crate::http_server::common_responses::media_file_origin_details::*;
use crate::http_server::common_responses::media_file_social_meta_lite::MediaFileSocialMetaLight;
use crate::http_server::common_responses::pagination_cursors::PaginationCursors;
use crate::http_server::common_responses::pagination_page::PaginationPage;
use crate::http_server::common_responses::simple_entity_stats::SimpleEntityStats;
use crate::http_server::common_responses::simple_response::SimpleResponse;
use crate::http_server::common_responses::tag_info::TagInfo;
use crate::http_server::common_responses::user_details_lite::{UserDefaultAvatarInfo, UserDetailsLight};
use crate::http_server::deprecated_endpoints::conversion::enqueue_fbx_to_gltf_handler::*;
use crate::http_server::deprecated_endpoints::engine::create_scene_handler::*;
use crate::http_server::deprecated_endpoints::workflows::enqueue::enqueue_face_fusion_workflow_handler::*;
use crate::http_server::deprecated_endpoints::workflows::enqueue::enqueue_live_portrait_workflow_handler::*;
use crate::http_server::deprecated_endpoints::workflows::enqueue::vst_common::vst_error::*;
use crate::http_server::deprecated_endpoints::workflows::enqueue::vst_common::vst_request::*;
use crate::http_server::deprecated_endpoints::workflows::enqueue::vst_common::vst_response::*;
use crate::http_server::deprecated_endpoints::workflows::enqueue_video_style_transfer_handler::*;
use crate::http_server::endpoints::analytics::log_browser_session_handler::*;
use crate::http_server::endpoints::app_state::components::get_permissions::AppStateLegacyPermissionFlags;
use crate::http_server::endpoints::app_state::components::get_permissions::AppStatePermissions;
use crate::http_server::endpoints::app_state::components::get_premium_info::AppStatePremiumInfo;
use crate::http_server::endpoints::app_state::components::get_premium_info::AppStateSubscriptionProductKey;
use crate::http_server::endpoints::app_state::components::get_server_info::AppStateServerInfo;
use crate::http_server::endpoints::app_state::components::get_status_alert::AppStateStatusAlertCategory;
use crate::http_server::endpoints::app_state::components::get_status_alert::AppStateStatusAlertInfo;
use crate::http_server::endpoints::app_state::components::get_user_info::AppStateUserInfo;
use crate::http_server::endpoints::app_state::components::get_user_locale::AppStateUserLocale;
use crate::http_server::endpoints::app_state::get_app_state_handler::*;
use crate::http_server::endpoints::beta_keys::create_beta_keys_handler::*;
use crate::http_server::endpoints::beta_keys::edit_beta_key_distributed_flag_handler::*;
use crate::http_server::endpoints::beta_keys::edit_beta_key_note_handler::*;
use crate::http_server::endpoints::beta_keys::list_beta_keys_handler::*;
use crate::http_server::endpoints::beta_keys::redeem_beta_key_handler::*;
use crate::http_server::endpoints::comments::create_comment_handler::*;
use crate::http_server::endpoints::comments::delete_comment_handler::*;
use crate::http_server::endpoints::comments::list_comments_handler::*;
use crate::http_server::endpoints::featured_items::create_featured_item_handler::*;
use crate::http_server::endpoints::featured_items::delete_featured_item_handler::*;
use crate::http_server::endpoints::featured_items::get_is_featured_item_handler::*;
use crate::http_server::endpoints::image_studio::prompt::enqueue_studio_image_generation_handler::*;
use crate::http_server::endpoints::image_studio::upload::upload_snapshot_media_file_handler::*;
use crate::http_server::endpoints::inference_job::common_responses::live_portrait::JobDetailsLivePortraitRequest;
use crate::http_server::endpoints::inference_job::delete::dismiss_finished_session_jobs_handler::*;
use crate::http_server::endpoints::inference_job::delete::terminate_inference_job_handler::*;
use crate::http_server::endpoints::inference_job::get::batch_get_inference_job_status_handler::*;
use crate::http_server::endpoints::inference_job::get::get_inference_job_status_handler::*;
use crate::http_server::endpoints::inference_job::list::list_session_jobs_handler::*;
use crate::http_server::endpoints::media_files::common_responses::live_portrait::MediaFileLivePortraitDetails;
use crate::http_server::endpoints::media_files::delete::delete_media_file_handler::*;
use crate::http_server::endpoints::media_files::edit::change_media_file_animation_type_handler::*;
use crate::http_server::endpoints::media_files::edit::change_media_file_engine_category_handler::*;
use crate::http_server::endpoints::media_files::edit::change_media_file_visibility_handler::*;
use crate::http_server::endpoints::media_files::edit::rename_media_file_handler::*;
use crate::http_server::endpoints::media_files::edit::set_media_file_cover_image_handler::*;
use crate::http_server::endpoints::media_files::get::batch_get_media_files_handler::*;
use crate::http_server::endpoints::media_files::get::get_media_file_handler::*;
use crate::http_server::endpoints::media_files::list::list_featured_media_files_handler::*;
use crate::http_server::endpoints::media_files::list::list_media_files_by_batch_token_handler::*;
use crate::http_server::endpoints::media_files::list::list_media_files_for_user_handler::*;
use crate::http_server::endpoints::media_files::list::list_media_files_handler::*;
use crate::http_server::endpoints::media_files::list::list_pinned_media_files_handler::*;
use crate::http_server::endpoints::media_files::search::search_featured_media_files_handler::*;
use crate::http_server::endpoints::media_files::search::search_session_media_files_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_audio_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_engine_asset::upload_engine_asset_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_error::MediaFileUploadError;
use crate::http_server::endpoints::media_files::upload::upload_generic::upload_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_image_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_new_engine_asset_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_new_scene_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_pmx::upload_pmx_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_saved_scene_media_file_handler::*;
use crate::http_server::endpoints::generate::image::edit::gpt_image_1_edit_image_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_scene_snapshot_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_studio_shot::upload_studio_shot_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_video_new::upload_new_video_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_video_old::upload_video_media_file_handler::*;
use crate::http_server::endpoints::media_files::upsert_upload::write_engine_asset::write_engine_asset_media_file_handler::*;
use crate::http_server::endpoints::media_files::upsert_upload::write_error::MediaFileWriteError;
use crate::http_server::endpoints::media_files::upsert_upload::write_scene_file::write_scene_file_media_file_handler::*;
use crate::http_server::endpoints::model_download::enqueue_gptsovits_model_download_handler::*;
use crate::http_server::endpoints::moderation::user_feature_flags::edit_user_feature_flags_handler::*;
use crate::http_server::endpoints::prompts::get_prompt_handler::*;
use crate::http_server::endpoints::service::status_alert_handler::*;
use crate::http_server::endpoints::stats::get_unified_queue_stats_handler::*;
use crate::http_server::endpoints::studio_gen2::enqueue_studio_gen2_handler::*;
use crate::http_server::endpoints::tags::list_tags_for_entity_handler::*;
use crate::http_server::endpoints::tags::set_tags_for_entity_handler::*;
use crate::http_server::endpoints::tts::enqueue_infer_tts_handler::enqueue_infer_tts_handler::*;
use crate::http_server::endpoints::user_bookmarks::batch_get_user_bookmarks_handler::*;
use crate::http_server::endpoints::user_bookmarks::create_user_bookmark_handler::*;
use crate::http_server::endpoints::user_bookmarks::delete_user_bookmark_handler::*;
use crate::http_server::endpoints::user_bookmarks::list_user_bookmarks_for_entity_handler::*;
use crate::http_server::endpoints::user_bookmarks::list_user_bookmarks_for_user_handler::*;
use crate::http_server::endpoints::user_ratings::batch_get_user_rating_handler::*;
use crate::http_server::endpoints::user_ratings::get_user_rating_handler::*;
use crate::http_server::endpoints::user_ratings::set_user_rating_handler::*;
use crate::http_server::endpoints::users::create_account_handler::*;
use crate::http_server::endpoints::users::edit_username_handler::*;
use crate::http_server::endpoints::users::get_profile_handler::*;
use crate::http_server::endpoints::users::google_sso::google_sso_handler::*;
use crate::http_server::endpoints::users::login_handler::*;
use crate::http_server::endpoints::users::logout_handler::*;
use crate::http_server::endpoints::users::session_info_handler::*;
use crate::http_server::endpoints::users::session_token_info_handler::*;
use crate::http_server::endpoints::voice_conversion::enqueue_voice_conversion_inference_handler::*;
use crate::http_server::endpoints::voice_designer::inference::enqueue_tts_request::*;
use crate::http_server::endpoints::voice_designer::voice_datasets::list_datasets_by_user::*;
use crate::http_server::endpoints::weights::delete::delete_weight_handler::*;
use crate::http_server::endpoints::weights::get::get_weight_handler::*;
use crate::http_server::endpoints::weights::list::list_available_weights_handler::*;
use crate::http_server::endpoints::weights::list::list_featured_weights_handler::*;
use crate::http_server::endpoints::weights::list::list_pinned_weights_handler::*;
use crate::http_server::endpoints::weights::list::list_weights_by_user_handler::*;
use crate::http_server::endpoints::weights::search::search_model_weights_impl::*;
use crate::http_server::endpoints::weights::update::set_model_weight_cover_image_handler::*;
use crate::http_server::endpoints::weights::update::update_weight_handler::*;
use crate::http_server::web_utils::response_success_helpers::*;

#[derive(OpenApi)]
#[openapi(
  paths(
    billing_component::stripe::http_endpoints::checkout::create::stripe_create_checkout_session_json_handler::stripe_create_checkout_session_json_handler,
    billing_component::users::http_endpoints::list_active_user_subscriptions_handler::list_active_user_subscriptions_handler,
    crate::http_server::deprecated_endpoints::conversion::enqueue_fbx_to_gltf_handler::enqueue_fbx_to_gltf_handler,
    crate::http_server::deprecated_endpoints::engine::create_scene_handler::create_scene_handler,
    crate::http_server::deprecated_endpoints::workflows::enqueue::enqueue_face_fusion_workflow_handler::enqueue_face_fusion_workflow_handler,
    crate::http_server::deprecated_endpoints::workflows::enqueue::enqueue_live_portrait_workflow_handler::enqueue_live_portrait_workflow_handler,
    crate::http_server::deprecated_endpoints::workflows::enqueue::enqueue_studio_workflow_handler::enqueue_studio_workflow_handler,
    crate::http_server::deprecated_endpoints::workflows::enqueue::enqueue_video_style_transfer_workflow_handler::enqueue_video_style_transfer_workflow_handler,
    crate::http_server::deprecated_endpoints::workflows::enqueue_video_style_transfer_handler::enqueue_video_style_transfer_handler,
    crate::http_server::endpoints::analytics::log_browser_session_handler::log_browser_session_handler,
    crate::http_server::endpoints::app_state::get_app_state_handler::get_app_state_handler,
    crate::http_server::endpoints::beta_keys::create_beta_keys_handler::create_beta_keys_handler,
    crate::http_server::endpoints::beta_keys::edit_beta_key_distributed_flag_handler::edit_beta_key_distributed_flag_handler,
    crate::http_server::endpoints::beta_keys::edit_beta_key_note_handler::edit_beta_key_note_handler,
    crate::http_server::endpoints::beta_keys::list_beta_keys_handler::list_beta_keys_handler,
    crate::http_server::endpoints::beta_keys::redeem_beta_key_handler::redeem_beta_key_handler,
    crate::http_server::endpoints::comments::create_comment_handler::create_comment_handler,
    crate::http_server::endpoints::comments::delete_comment_handler::delete_comment_handler,
    crate::http_server::endpoints::comments::list_comments_handler::list_comments_handler,
    crate::http_server::endpoints::featured_items::create_featured_item_handler::create_featured_item_handler,
    crate::http_server::endpoints::featured_items::delete_featured_item_handler::delete_featured_item_handler,
    crate::http_server::endpoints::featured_items::get_is_featured_item_handler::get_is_featured_item_handler,
    crate::http_server::endpoints::generate::image::generate_flux_1_dev_text_to_image_handler::generate_flux_1_dev_text_to_image_handler,
    crate::http_server::endpoints::generate::image::generate_flux_1_schnell_text_to_image_handler::generate_flux_1_schnell_text_to_image_handler,
    crate::http_server::endpoints::generate::image::generate_flux_pro_11_text_to_image_handler::generate_flux_pro_11_text_to_image_handler,
    crate::http_server::endpoints::generate::image::generate_flux_pro_11_ultra_text_to_image_handler::generate_flux_pro_11_ultra_text_to_image_handler,
    crate::http_server::endpoints::generate::image::remove_image_background_handler::remove_image_background_handler,
    crate::http_server::endpoints::generate::image::edit::gpt_image_1_edit_image_handler::gpt_image_1_edit_image_handler,
    crate::http_server::endpoints::generate::object::generate_hunyuan_2_1_image_to_3d_handler::generate_hunyuan_2_1_image_to_3d_handler,
    crate::http_server::endpoints::generate::object::generate_hunyuan_2_0_image_to_3d_handler::generate_hunyuan_2_0_image_to_3d_handler,
    crate::http_server::endpoints::generate::video::generate_kling_1_6_pro_video_handler::generate_kling_1_6_pro_video_handler,
    crate::http_server::endpoints::generate::video::generate_kling_2_1_master_video_handler::generate_kling_2_1_master_video_handler,
    crate::http_server::endpoints::generate::video::generate_kling_2_1_pro_video_handler::generate_kling_2_1_pro_video_handler,
    crate::http_server::endpoints::generate::video::generate_seedance_1_0_lite_image_to_video_handler::generate_seedance_1_0_lite_image_to_video_handler,
    crate::http_server::endpoints::generate::video::generate_veo_2_image_to_video_handler::generate_veo_2_image_to_video_handler,
    crate::http_server::endpoints::image_studio::prompt::enqueue_studio_image_generation_handler::enqueue_studio_image_generation_handler,
    crate::http_server::endpoints::image_studio::upload::upload_snapshot_media_file_handler::upload_snapshot_media_file_handler,
    crate::http_server::endpoints::inference_job::delete::dismiss_finished_session_jobs_handler::dismiss_finished_session_jobs_handler,
    crate::http_server::endpoints::inference_job::delete::terminate_inference_job_handler::terminate_inference_job_handler,
    crate::http_server::endpoints::inference_job::get::batch_get_inference_job_status_handler::batch_get_inference_job_status_handler,
    crate::http_server::endpoints::inference_job::get::get_inference_job_status_handler::get_inference_job_status_handler,
    crate::http_server::endpoints::inference_job::list::list_session_jobs_handler::list_session_jobs_handler,
    crate::http_server::endpoints::media_files::delete::delete_media_file_handler::delete_media_file_handler,
    crate::http_server::endpoints::media_files::edit::change_media_file_animation_type_handler::change_media_file_animation_type_handler,
    crate::http_server::endpoints::media_files::edit::change_media_file_engine_category_handler::change_media_file_engine_category_handler,
    crate::http_server::endpoints::media_files::edit::change_media_file_visibility_handler::change_media_file_visibility_handler,
    crate::http_server::endpoints::media_files::edit::rename_media_file_handler::rename_media_file_handler,
    crate::http_server::endpoints::media_files::edit::set_media_file_cover_image_handler::set_media_file_cover_image_handler,
    crate::http_server::endpoints::media_files::get::batch_get_media_files_handler::batch_get_media_files_handler,
    crate::http_server::endpoints::media_files::get::get_media_file_handler::get_media_file_handler,
    crate::http_server::endpoints::media_files::list::list_featured_media_files_handler::list_featured_media_files_handler,
    crate::http_server::endpoints::media_files::list::list_media_files_by_batch_token_handler::list_media_files_by_batch_token_handler,
    crate::http_server::endpoints::media_files::list::list_media_files_for_user_handler::list_media_files_for_user_handler,
    crate::http_server::endpoints::media_files::list::list_media_files_handler::list_media_files_handler,
    crate::http_server::endpoints::media_files::list::list_pinned_media_files_handler::list_pinned_media_files_handler,
    crate::http_server::endpoints::media_files::search::search_featured_media_files_handler::search_featured_media_files_handler,
    crate::http_server::endpoints::media_files::search::search_session_media_files_handler::search_session_media_files_handler,
    crate::http_server::endpoints::media_files::upload::upload_audio_media_file_handler::upload_audio_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_engine_asset::upload_engine_asset_media_file_handler::upload_engine_asset_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_generic::upload_media_file_handler::upload_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_image_media_file_handler::upload_image_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_new_engine_asset_media_file_handler::upload_new_engine_asset_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_new_scene_media_file_handler::upload_new_scene_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_pmx::upload_pmx_media_file_handler::upload_pmx_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_saved_scene_media_file_handler::upload_saved_scene_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_scene_snapshot_media_file_handler::upload_scene_snapshot_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_studio_shot::upload_studio_shot_media_file_handler::upload_studio_shot_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_video_new::upload_new_video_media_file_handler::upload_new_video_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_video_old::upload_video_media_file_handler::upload_video_media_file_handler,
    crate::http_server::endpoints::media_files::upsert_upload::write_engine_asset::write_engine_asset_media_file_handler::write_engine_asset_media_file_handler,
    crate::http_server::endpoints::media_files::upsert_upload::write_scene_file::write_scene_file_media_file_handler::write_scene_file_media_file_handler,
    crate::http_server::endpoints::model_download::enqueue_gptsovits_model_download_handler::enqueue_gptsovits_model_download_handler,
    crate::http_server::endpoints::moderation::user_feature_flags::edit_user_feature_flags_handler::edit_user_feature_flags_handler,
    crate::http_server::endpoints::prompts::get_prompt_handler::get_prompt_handler,
    crate::http_server::endpoints::service::status_alert_handler::status_alert_handler,
    crate::http_server::endpoints::stats::get_unified_queue_stats_handler::get_unified_queue_stats_handler,
    crate::http_server::endpoints::studio_gen2::enqueue_studio_gen2_handler::enqueue_studio_gen2_handler,
    crate::http_server::endpoints::tags::list_tags_for_entity_handler::list_tags_for_entity_handler,
    crate::http_server::endpoints::tags::set_tags_for_entity_handler::set_tags_for_entity_handler,
    crate::http_server::endpoints::tts::enqueue_infer_tts_handler::enqueue_infer_tts_handler::enqueue_infer_tts_handler,
    crate::http_server::endpoints::user_bookmarks::batch_get_user_bookmarks_handler::batch_get_user_bookmarks_handler,
    crate::http_server::endpoints::user_bookmarks::create_user_bookmark_handler::create_user_bookmark_handler,
    crate::http_server::endpoints::user_bookmarks::delete_user_bookmark_handler::delete_user_bookmark_handler,
    crate::http_server::endpoints::user_bookmarks::list_user_bookmarks_for_entity_handler::list_user_bookmarks_for_entity_handler,
    crate::http_server::endpoints::user_bookmarks::list_user_bookmarks_for_user_handler::list_user_bookmarks_for_user_handler,
    crate::http_server::endpoints::user_ratings::batch_get_user_rating_handler::batch_get_user_rating_handler,
    crate::http_server::endpoints::user_ratings::get_user_rating_handler::get_user_rating_handler,
    crate::http_server::endpoints::user_ratings::set_user_rating_handler::set_user_rating_handler,
    crate::http_server::endpoints::users::create_account_handler::create_account_handler,
    crate::http_server::endpoints::users::edit_username_handler::edit_username_handler,
    crate::http_server::endpoints::users::get_profile_handler::get_profile_handler,
    crate::http_server::endpoints::users::google_sso::google_sso_handler::google_sso_handler,
    crate::http_server::endpoints::users::login_handler::login_handler,
    crate::http_server::endpoints::users::logout_handler::logout_handler,
    crate::http_server::endpoints::users::session_info_handler::session_info_handler,
    crate::http_server::endpoints::users::session_token_info_handler::session_token_info_handler,
    crate::http_server::endpoints::voice_conversion::enqueue_voice_conversion_inference_handler::enqueue_voice_conversion_inference_handler,
    crate::http_server::endpoints::voice_designer::inference::enqueue_tts_request::enqueue_tts_request,
    crate::http_server::endpoints::voice_designer::voice_datasets::list_datasets_by_user::list_datasets_by_user_handler,
    crate::http_server::endpoints::weights::delete::delete_weight_handler::delete_weight_handler,
    crate::http_server::endpoints::weights::get::get_weight_handler::get_weight_handler,
    crate::http_server::endpoints::weights::list::list_available_weights_handler::list_available_weights_handler,
    crate::http_server::endpoints::weights::list::list_featured_weights_handler::list_featured_weights_handler,
    crate::http_server::endpoints::weights::list::list_pinned_weights_handler::list_pinned_weights_handler,
    crate::http_server::endpoints::weights::list::list_weights_by_user_handler::list_weights_by_user_handler,
    crate::http_server::endpoints::weights::search::search_model_weights_http_get_handler::search_model_weights_http_get_handler,
    crate::http_server::endpoints::weights::search::search_model_weights_http_post_handler::search_model_weights_http_post_handler,
    crate::http_server::endpoints::weights::update::set_model_weight_cover_image_handler::set_model_weight_cover_image_handler,
    crate::http_server::endpoints::weights::update::update_weight_handler::update_weight_handler,
  ),
  components(schemas(
    // Tokens
    BatchGenerationToken,
    BetaKeyToken,
    BrowserSessionLogToken,
    CommentToken,
    InferenceJobToken,
    MediaFileToken,
    ModelWeightToken,
    PromptToken,
    UserBookmarkToken,
    UserToken,
    ZsVoiceDatasetToken,

    // Enums
    BetaKeyProduct,
    CommentEntityType,
    FeaturedItemEntityType,
    FrontendFailureCategory,
    InferenceCategory,
    JobStatusPlus,
    MediaFileAnimationType,
    MediaFileClass,
    MediaFileEngineCategory,
    MediaFileOriginCategory,
    MediaFileOriginProductCategory,
    MediaFileSubtype,
    MediaFileType,
    PromptType,
    PublicMediaFileModelType,
    PublicWeightsType,
    StyleTransferName,
    UserFeatureFlag,
    WeightsCategory,
    WeightsType,

    // Other common enums
    AutoProductCategory,

    // Common path info
    MediaFileTokenPathInfo,

    // Common response structs
    JobDetailsLivePortraitRequest,
    MediaFileLivePortraitDetails,
    MediaFileModelDetails,
    MediaFileOriginDetails,
    MediaFileSocialMetaLight,
    MediaFileWriteError,
    MediaFileWriteError,
    MediaLinks,
    PaginationCursors,
    PaginationPage,
    SimpleEntityStats,
    SimpleGenericJsonSuccess,
    SimpleResponse,
    TagInfo,
    UserDetailsLight,
    VideoPreviews,
    Visibility,

    // Common cover image types
    CoverImageLinks,
    MediaFileCoverImageDetails,
    MediaFileDefaultCover,
    UserDefaultAvatarInfo,
    WeightsCoverImageDetails,
    WeightsDefaultCoverInfo,

    // Endpoint API types
    AppStateError,
    AppStateLegacyPermissionFlags,
    AppStatePermissions,
    AppStatePremiumInfo,
    AppStateResponse,
    AppStateServerInfo,
    AppStateStatusAlertCategory,
    AppStateStatusAlertInfo,
    AppStateSubscriptionProductKey,
    AppStateUserInfo,
    AppStateUserLocale,
    BatchGetInferenceJobStatusError,
    BatchGetInferenceJobStatusQueryParams,
    BatchGetInferenceJobStatusSuccessResponse,
    BatchGetMediaFilesError,
    BatchGetMediaFilesModelInfo,
    BatchGetMediaFilesQueryParams,
    BatchGetMediaFilesSuccessResponse,
    BatchGetUserBookmarksError,
    BatchGetUserBookmarksQueryParams,
    BatchGetUserBookmarksResponse,
    BatchGetUserRatingError,
    BatchGetUserRatingQueryParams,
    BatchGetUserRatingResponse,
    BatchInferenceJobStatusResponsePayload,
    BatchMediaFileInfo,
    BatchRequestDetailsResponse,
    BatchResultDetailsResponse,
    BatchStatusDetailsResponse,
    BetaKeyItem,
    BookmarkRow,
    ByQueueStats,
    ChangeMediaFileAnimationTypeError,
    ChangeMediaFileAnimationTypeRequest,
    ChangeMediaFileEngineCategoryError,
    ChangeMediaFileEngineCategoryRequest,
    ChangeMediaFileVisibilityError,
    ChangeMediaFileVisibilityRequest,
    CreateAccountErrorResponse,
    CreateAccountErrorType,
    CreateAccountRequest,
    CreateAccountSuccessResponse,
    CreateBetaKeysError,
    CreateBetaKeysRequest,
    CreateBetaKeysSuccessResponse,
    CreateCheckoutSessionError,
    CreateCheckoutSessionRequest,
    CreateCheckoutSessionSuccessResponse,
    CreateCommentError,
    CreateCommentRequest,
    CreateCommentSuccessResponse,
    CreateFeaturedItemError,
    CreateFeaturedItemRequest,
    CreateFeaturedItemSuccessResponse,
    CreateSceneError,
    CreateSceneSuccessResponse,
    CreateUserBookmarkError,
    CreateUserBookmarkRequest,
    CreateUserBookmarkSuccessResponse,
    DeleteCommentError,
    DeleteCommentPathInfo,
    DeleteCommentRequest,
    DeleteFeaturedItemError,
    DeleteFeaturedItemRequest,
    DeleteMediaFileError,
    DeleteMediaFilePathInfo,
    DeleteMediaFileRequest,
    DeleteUserBookmarkError,
    DeleteUserBookmarkPathInfo,
    DeleteUserBookmarkRequest,
    DeleteWeightError,
    DeleteWeightPathInfo,
    DeleteWeightRequest,
    DismissFinishedSessionJobsError,
    DismissFinishedSessionJobsSuccessResponse,
    EditBetaKeyDistributedFlagError,
    EditBetaKeyDistributedFlagPathInfo,
    EditBetaKeyDistributedFlagRequest,
    EditBetaKeyDistributedFlagSuccessResponse,
    EditBetaKeyNoteError,
    EditBetaKeyNotePathInfo,
    EditBetaKeyNoteRequest,
    EditBetaKeyNoteSuccessResponse,
    EditUserFeatureFlagPathInfo,
    EditUserFeatureFlagsError,
    EditUserFeatureFlagsOption,
    EditUserFeatureFlagsRequest,
    GptImage1EditImageRequest,
    GptImage1EditImageImageSize,
    GptImage1EditImageNumImages,
    GptImage1EditImageImageQuality,
    GptImage1EditImageResponse,
    EditUsernameError,
    EditUsernameRequest,
    EditUsernameResponse,
    EnqueueFaceFusionCropDimensions,
    EnqueueFaceFusionWorkflowError,
    EnqueueFaceFusionWorkflowRequest,
    EnqueueFaceFusionWorkflowSuccessResponse,
    EnqueueFbxToGltfRequest,
    EnqueueFbxToGltfRequestError,
    EnqueueFbxToGltfRequestSuccessResponse,
    EnqueueGptSovitsModelDownloadError,
    EnqueueGptSovitsModelDownloadRequest,
    EnqueueGptSovitsModelDownloadSuccessResponse,
    EnqueueImageGenRequestError,
    EnqueueImageGenRequestSuccessResponse,
    EnqueueLivePortraitCropDimensions,
    EnqueueLivePortraitWorkflowError,
    EnqueueLivePortraitWorkflowRequest,
    EnqueueLivePortraitWorkflowSuccessResponse,
    EnqueueStudioGen2Error,
    EnqueueStudioGen2Request,
    EnqueueStudioGen2Response,
    EnqueueStudioImageGenRequest,
    EnqueueTTSRequest,
    EnqueueTTSRequestError,
    EnqueueTTSRequestSuccessResponse,
    EnqueueVideoStyleTransferError,
    EnqueueVideoStyleTransferRequest,
    EnqueueVideoStyleTransferSuccessResponse,
    EnqueueVoiceConversionInferenceError,
    EnqueueVoiceConversionInferenceRequest,
    EnqueueVoiceConversionInferenceSuccessResponse,
    FakeYouPlan,
    FeaturedMediaFile,
    FeaturedModelWeightForList,
    FundamentalFrequencyMethod,
    GenerateFlux1DevTextToImageAspectRatio,
    GenerateFlux1DevTextToImageNumImages,
    GenerateFlux1DevTextToImageRequest,
    GenerateFlux1DevTextToImageResponse,
    GenerateFlux1SchnellTextToImageAspectRatio,
    GenerateFlux1SchnellTextToImageNumImages,
    GenerateFlux1SchnellTextToImageRequest,
    GenerateFlux1SchnellTextToImageResponse,
    GenerateFluxPro11TextToImageAspectRatio,
    GenerateFluxPro11TextToImageNumImages,
    GenerateFluxPro11TextToImageRequest,
    GenerateFluxPro11TextToImageResponse,
    GenerateFluxPro11UltraTextToImageAspectRatio,
    GenerateFluxPro11UltraTextToImageNumImages,
    GenerateFluxPro11UltraTextToImageRequest,
    GenerateFluxPro11UltraTextToImageResponse,
    GenerateHunyuan21ImageTo3dRequest,
    GenerateHunyuan21ImageTo3dResponse,
    GenerateHunyuan20ImageTo3dRequest,
    GenerateHunyuan20ImageTo3dResponse,
    GenerateKling16ProAspectRatio,
    GenerateKling16ProDuration,
    GenerateKling16ProImageToVideoRequest,
    GenerateKling16ProImageToVideoResponse,
    GenerateKling21MasterAspectRatio,
    GenerateKling21MasterDuration,
    GenerateKling21MasterImageToVideoRequest,
    GenerateKling21MasterImageToVideoResponse,
    GenerateKling21ProAspectRatio,
    GenerateKling21ProDuration,
    GenerateKling21ProImageToVideoRequest,
    GenerateKling21ProImageToVideoResponse,
    GenerateSeedance10LiteDuration,
    GenerateSeedance10LiteImageToVideoRequest,
    GenerateSeedance10LiteImageToVideoResponse,
    GenerateSeedance10LiteResolution,
    GenerateVeo2AspectRatio,
    GenerateVeo2Duration,
    GenerateVeo2ImageToVideoRequest,
    GenerateVeo2ImageToVideoResponse,
    GetInferenceJobStatusError,
    GetInferenceJobStatusPathInfo,
    GetInferenceJobStatusSuccessResponse,
    GetIsFeaturedItemError,
    GetIsFeaturedItemPathInfo,
    GetIsFeaturedItemSuccessResponse,
    GetMediaFileError,
    GetMediaFileModelInfo,
    GetMediaFileModeratorFields,
    GetMediaFilePathInfo,
    GetMediaFileSuccessResponse,
    GetProfilePathInfo,
    GetPromptError,
    GetPromptPathInfo,
    GetPromptSuccessResponse,
    GetUnifiedQueueStatsError,
    GetUnifiedQueueStatsSuccessResponse,
    GetUserRatingError,
    GetUserRatingResponse,
    GetWeightError,
    GetWeightPathInfo,
    GetWeightResponse,
    GoogleCreateAccountErrorResponse,
    GoogleCreateAccountErrorType,
    GoogleCreateAccountRequest,
    GoogleCreateAccountSuccessResponse,
    InferTtsError,
    InferTtsRequest,
    InferTtsSuccessResponse,
    InferenceJobStatusResponsePayload,
    InferenceJobTokenType,
    LegacyQueueDetails,
    ListActiveUserSubscriptionsError,
    ListActiveUserSubscriptionsResponse,
    ListAvailableWeightsQuery,
    ListAvailableWeightsSuccessResponse,
    ListBetaKeysError,
    ListBetaKeysFilterOption,
    ListBetaKeysQueryParams,
    ListBetaKeysSuccessResponse,
    ListCommentsError,
    ListCommentsPathInfo,
    ListCommentsSuccessResponse,
    ListDatasetsByUserError,
    ListDatasetsByUserPathInfo,
    ListDatasetsByUserSuccessResponse,
    ListFeaturedMediaFilesError,
    ListFeaturedMediaFilesQueryParams,
    ListFeaturedMediaFilesSuccessResponse,
    ListFeaturedWeightsError,
    ListFeaturedWeightsQueryParams,
    ListFeaturedWeightsSuccessResponse,
    ListMediaFilesByBatchError,
    ListMediaFilesByBatchPathInfo,
    ListMediaFilesByBatchSuccessResponse,
    ListMediaFilesError,
    ListMediaFilesForUserError,
    ListMediaFilesForUserPathInfo,
    ListMediaFilesForUserQueryParams,
    ListMediaFilesForUserSuccessResponse,
    ListMediaFilesQueryParams,
    ListMediaFilesSuccessResponse,
    ListPinnedMediaFilesError,
    ListPinnedMediaFilesSuccessResponse,
    ListPinnedWeightsError,
    ListPinnedWeightsSuccessResponse,
    ListSessionJobsError,
    ListSessionJobsItem,
    ListSessionJobsQueryParams,
    ListSessionJobsSuccessResponse,
    ListSessionRequestDetailsResponse,
    ListSessionResultDetailsResponse,
    ListSessionStatusDetailsResponse,
    ListTagsForEntityError,
    ListTagsForEntityPathInfo,
    ListTagsForEntitySuccessResponse,
    ListUserBookmarksForEntityError,
    ListUserBookmarksForEntityPathInfo,
    ListUserBookmarksForEntitySuccessResponse,
    ListUserBookmarksForUserError,
    ListUserBookmarksForUserSuccessResponse,
    ListUserBookmarksPathInfo,
    ListWeightError,
    ListWeightsByUserError,
    ListWeightsByUserPathInfo,
    ListWeightsByUserSuccessResponse,
    LogBrowserSessionError,
    LogBrowserSessionRequest,
    LogBrowserSessionSuccessResponse,
    LoginErrorResponse,
    LoginErrorType,
    LoginRequest,
    LoginSuccessResponse,
    LogoutError,
    LogoutSuccessResponse,
    MediaFileData,
    MediaFileForUserListItem,
    MediaFileInfo,
    MediaFileListItem,
    MediaFileUploadError,
    MediaFilesByBatchListItem,
    ModelWeightForList,
    ModelWeightSearchResult,
    ModernInferenceQueueStats,
    PinnedMediaFile,
    PinnedModelWeightForList,
    ProfileError,
    PromptInfo,
    RatingRow,
    RedeemBetaKeyError,
    RedeemBetaKeyRequest,
    RedeemBetaKeySuccessResponse,
    RemoveImageBackgroundRequest,
    RemoveImageBackgroundResponse,
    RenameMediaFileError,
    RenameMediaFileRequest,
    RequestDetailsResponse,
    ResultDetailsResponse,
    SearchFeaturedMediaFileListItem,
    SearchFeaturedMediaFilesError,
    SearchFeaturedMediaFilesQueryParams,
    SearchFeaturedMediaFilesSuccessResponse,
    SearchMediaFileListItem,
    SearchMediaFilesError,
    SearchMediaFilesQueryParams,
    SearchMediaFilesSuccessResponse,
    SearchModelWeightsError,
    SearchModelWeightsRequest,
    SearchModelWeightsSortDirection,
    SearchModelWeightsSortField,
    SearchModelWeightsSuccessResponse,
    SessionInfoError,
    SessionInfoSuccessResponse,
    SessionTokenInfoError,
    SessionTokenInfoSuccessResponse,
    SessionUserInfo,
    SetMediaFileCoverImageError,
    SetMediaFileCoverImageRequest,
    SetModelWeightCoverImageError,
    SetModelWeightCoverImagePathInfo,
    SetModelWeightCoverImageRequest,
    SetModelWeightCoverImageResponse,
    SetTagsForEntityError,
    SetTagsForEntityPathInfo,
    SetTagsForEntityRequest,
    SetTagsForEntitySuccessResponse,
    SetUserRatingError,
    SetUserRatingRequest,
    SetUserRatingResponse,
    StatusAlertCategory,
    StatusAlertError,
    StatusAlertInfo,
    StatusAlertResponse,
    StatusDetailsResponse,
    StorytellerStreamPlan,
    SubscriptionProductKey,
    TerminateInferenceJobError,
    TerminateInferenceJobPathInfo,
    TerminateInferenceJobSuccessResponse,
    UpdateWeightError,
    UpdateWeightPathInfo,
    UpdateWeightRequest,
    UploadAudioMediaFileForm,
    UploadAudioMediaFileSuccessResponse,
    UploadEngineAssetMediaSuccessResponse,
    UploadImageMediaFileForm,
    UploadImageMediaFileSuccessResponse,
    UploadMediaSuccessResponse,
    UploadNewEngineAssetFileForm,
    UploadNewEngineAssetSuccessResponse,
    UploadNewSceneMediaFileForm,
    UploadNewSceneMediaFileSuccessResponse,
    UploadNewVideoMediaFileForm,
    UploadNewVideoMediaFileSuccessResponse,
    UploadPmxFileForm,
    UploadPmxSuccessResponse,
    UploadSavedSceneMediaFileForm,
    UploadSavedSceneMediaFilePathInfo,
    UploadSavedSceneMediaFileSuccessResponse,
    UploadSceneSnapshotMediaFileForm,
    UploadSceneSnapshotMediaFileSuccessResponse,
    UploadSnapshotMediaFileForm,
    UploadSnapshotMediaFileSuccessResponse,
    UploadStudioShotFileForm,
    UploadStudioShotSuccessResponse,
    UploadVideoMediaSuccessResponse,
    UserBookmarkDetailsForUserList,
    UserBookmarkEntityType,
    UserBookmarkForEntityListItem,
    UserBookmarkListItem,
    UserProfileModeratorFields,
    UserProfileRecordForResponse,
    UserProfileUserBadge,
    UserRatingEntityType,
    UserRatingValue,
    VstError,
    VstRequest,
    VstSuccessResponse,
    Weight,
    WeightsData,
    WriteEngineAssetMediaSuccessResponse,
    WriteSceneFileMediaSuccessResponse,
    ZsDatasetRecord,
  ))
)]
pub struct ApiDoc;
