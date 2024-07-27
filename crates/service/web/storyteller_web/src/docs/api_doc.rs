use utoipa::OpenApi;

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

use crate::http_server::common_requests::media_file_token_path_info::MediaFileTokenPathInfo;
use crate::http_server::common_responses::media_file_cover_image_details::MediaFileCoverImageDetails;
use crate::http_server::common_responses::media_file_cover_image_details::MediaFileDefaultCover;
use crate::http_server::common_responses::media_file_origin_details::*;
use crate::http_server::common_responses::media_file_social_meta_lite::MediaFileSocialMetaLight;
use crate::http_server::common_responses::pagination_cursors::PaginationCursors;
use crate::http_server::common_responses::pagination_page::PaginationPage;
use crate::http_server::common_responses::simple_entity_stats::SimpleEntityStats;
use crate::http_server::common_responses::simple_response::SimpleResponse;
use crate::http_server::common_responses::user_details_lite::{UserDefaultAvatarInfo, UserDetailsLight};
use crate::http_server::common_responses::weights_cover_image_details::*;
use crate::http_server::endpoints::analytics::log_browser_session_handler::*;
use crate::http_server::endpoints::beta_keys::create_beta_keys_handler::*;
use crate::http_server::endpoints::beta_keys::edit_beta_key_distributed_flag_handler::*;
use crate::http_server::endpoints::beta_keys::edit_beta_key_note_handler::*;
use crate::http_server::endpoints::beta_keys::list_beta_keys_handler::*;
use crate::http_server::endpoints::beta_keys::redeem_beta_key_handler::*;
use crate::http_server::endpoints::comments::create_comment_handler::*;
use crate::http_server::endpoints::comments::delete_comment_handler::*;
use crate::http_server::endpoints::comments::list_comments_handler::*;
use crate::http_server::endpoints::conversion::enqueue_fbx_to_gltf_handler::*;
use crate::http_server::endpoints::engine::create_scene_handler::*;
use crate::http_server::endpoints::featured_items::create_featured_item_handler::*;
use crate::http_server::endpoints::featured_items::delete_featured_item_handler::*;
use crate::http_server::endpoints::featured_items::get_is_featured_item_handler::*;
use crate::http_server::endpoints::inference_job::batch_get_inference_job_status_handler::*;
use crate::http_server::endpoints::inference_job::dismiss_finished_session_jobs_handler::*;
use crate::http_server::endpoints::inference_job::get_inference_job_status_handler::*;
use crate::http_server::endpoints::inference_job::list_session_jobs_handler::*;
use crate::http_server::endpoints::inference_job::terminate_inference_job_handler::*;
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
use crate::http_server::endpoints::media_files::upload::upload_new_video_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_pmx::upload_pmx_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_saved_scene_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_scene_snapshot_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_video::upload_video_media_file_handler::*;
use crate::http_server::endpoints::media_files::upsert_upload::write_engine_asset::write_engine_asset_media_file_handler::*;
use crate::http_server::endpoints::media_files::upsert_upload::write_error::MediaFileWriteError;
use crate::http_server::endpoints::media_files::upsert_upload::write_scene_file::write_scene_file_media_file_handler::*;
use crate::http_server::endpoints::moderation::user_feature_flags::edit_user_feature_flags_handler::*;
use crate::http_server::endpoints::prompts::get_prompt_handler::*;
use crate::http_server::endpoints::service::status_alert_handler::*;
use crate::http_server::endpoints::stats::get_unified_queue_stats_handler::*;
use crate::http_server::endpoints::tts::enqueue_infer_tts_handler::enqueue_infer_tts_handler::*;
use crate::http_server::endpoints::user_bookmarks::batch_get_user_bookmarks_handler::*;
use crate::http_server::endpoints::user_bookmarks::create_user_bookmark_handler::*;
use crate::http_server::endpoints::user_bookmarks::delete_user_bookmark_handler::*;
use crate::http_server::endpoints::user_bookmarks::list_user_bookmarks_for_entity_handler::*;
use crate::http_server::endpoints::user_bookmarks::list_user_bookmarks_for_user_handler::*;
use crate::http_server::endpoints::user_ratings::batch_get_user_rating_handler::*;
use crate::http_server::endpoints::user_ratings::get_user_rating_handler::*;
use crate::http_server::endpoints::user_ratings::set_user_rating_handler::*;
use crate::http_server::endpoints::users::get_profile_handler::*;
use crate::http_server::endpoints::users::login_handler::*;
use crate::http_server::endpoints::users::logout_handler::*;
use crate::http_server::endpoints::users::session_info_handler::*;
use crate::http_server::endpoints::voice_conversion::inference::enqueue_voice_conversion_inference::*;
use crate::http_server::endpoints::voice_designer::inference::enqueue_tts_request::*;
use crate::http_server::endpoints::voice_designer::voice_datasets::list_datasets_by_user::*;
use crate::http_server::endpoints::weights::delete_weight_handler::*;
use crate::http_server::endpoints::weights::get_weight_handler::*;
use crate::http_server::endpoints::weights::list_available_weights_handler::*;
use crate::http_server::endpoints::weights::list_featured_weights_handler::*;
use crate::http_server::endpoints::weights::list_pinned_weights_handler::*;
use crate::http_server::endpoints::weights::list_weights_by_user_handler::*;
use crate::http_server::endpoints::weights::search_model_weights_handler::*;
use crate::http_server::endpoints::weights::set_model_weight_cover_image_handler::*;
use crate::http_server::endpoints::weights::update_weight_handler::*;
use crate::http_server::endpoints::workflows::enqueue::enqueue_live_portrait_workflow_handler::*;
use crate::http_server::endpoints::workflows::enqueue::vst_common::vst_error::*;
use crate::http_server::endpoints::workflows::enqueue::vst_common::vst_request::*;
use crate::http_server::endpoints::workflows::enqueue::vst_common::vst_response::*;
use crate::http_server::endpoints::workflows::enqueue_video_style_transfer_handler::*;
use crate::http_server::web_utils::response_success_helpers::*;

#[derive(OpenApi)]
#[openapi(
  paths(
    billing_component::stripe::http_endpoints::checkout::create::stripe_create_checkout_session_json_handler::stripe_create_checkout_session_json_handler,
    billing_component::users::http_endpoints::list_active_user_subscriptions_handler::list_active_user_subscriptions_handler,
    crate::http_server::endpoints::analytics::log_browser_session_handler::log_browser_session_handler,
    crate::http_server::endpoints::beta_keys::create_beta_keys_handler::create_beta_keys_handler,
    crate::http_server::endpoints::beta_keys::edit_beta_key_distributed_flag_handler::edit_beta_key_distributed_flag_handler,
    crate::http_server::endpoints::beta_keys::edit_beta_key_note_handler::edit_beta_key_note_handler,
    crate::http_server::endpoints::beta_keys::list_beta_keys_handler::list_beta_keys_handler,
    crate::http_server::endpoints::beta_keys::redeem_beta_key_handler::redeem_beta_key_handler,
    crate::http_server::endpoints::comments::create_comment_handler::create_comment_handler,
    crate::http_server::endpoints::comments::delete_comment_handler::delete_comment_handler,
    crate::http_server::endpoints::comments::list_comments_handler::list_comments_handler,
    crate::http_server::endpoints::conversion::enqueue_fbx_to_gltf_handler::enqueue_fbx_to_gltf_handler,
    crate::http_server::endpoints::engine::create_scene_handler::create_scene_handler,
    crate::http_server::endpoints::featured_items::create_featured_item_handler::create_featured_item_handler,
    crate::http_server::endpoints::featured_items::delete_featured_item_handler::delete_featured_item_handler,
    crate::http_server::endpoints::featured_items::get_is_featured_item_handler::get_is_featured_item_handler,
    crate::http_server::endpoints::inference_job::batch_get_inference_job_status_handler::batch_get_inference_job_status_handler,
    crate::http_server::endpoints::inference_job::dismiss_finished_session_jobs_handler::dismiss_finished_session_jobs_handler,
    crate::http_server::endpoints::inference_job::get_inference_job_status_handler::get_inference_job_status_handler,
    crate::http_server::endpoints::inference_job::list_session_jobs_handler::list_session_jobs_handler,
    crate::http_server::endpoints::inference_job::terminate_inference_job_handler::terminate_inference_job_handler,
    crate::http_server::endpoints::media_files::delete::delete_media_file_handler::delete_media_file_handler,
    crate::http_server::endpoints::media_files::edit::change_media_file_animation_type_handler::change_media_file_animation_type_handler,
    crate::http_server::endpoints::media_files::edit::change_media_file_engine_category_handler::change_media_file_engine_category_handler,
    crate::http_server::endpoints::media_files::edit::change_media_file_visibility_handler::change_media_file_visibility_handler,
    crate::http_server::endpoints::media_files::edit::rename_media_file_handler::rename_media_file_handler,
    crate::http_server::endpoints::media_files::edit::set_media_file_cover_image_handler::set_media_file_cover_image_handler,
    crate::http_server::endpoints::media_files::get::batch_get_media_files_handler::batch_get_media_files_handler,
    crate::http_server::endpoints::stats::get_unified_queue_stats_handler::get_unified_queue_stats_handler,
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
    crate::http_server::endpoints::media_files::upload::upload_new_video_media_file_handler::upload_new_video_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_pmx::upload_pmx_media_file_handler::upload_pmx_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_saved_scene_media_file_handler::upload_saved_scene_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_scene_snapshot_media_file_handler::upload_scene_snapshot_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_video::upload_video_media_file_handler::upload_video_media_file_handler,
    crate::http_server::endpoints::media_files::upsert_upload::write_engine_asset::write_engine_asset_media_file_handler::write_engine_asset_media_file_handler,
    crate::http_server::endpoints::media_files::upsert_upload::write_scene_file::write_scene_file_media_file_handler::write_scene_file_media_file_handler,
    crate::http_server::endpoints::moderation::user_feature_flags::edit_user_feature_flags_handler::edit_user_feature_flags_handler,
    crate::http_server::endpoints::prompts::get_prompt_handler::get_prompt_handler,
    crate::http_server::endpoints::service::status_alert_handler::status_alert_handler,
    crate::http_server::endpoints::tts::enqueue_infer_tts_handler::enqueue_infer_tts_handler::enqueue_infer_tts_handler,
    crate::http_server::endpoints::user_bookmarks::batch_get_user_bookmarks_handler::batch_get_user_bookmarks_handler,
    crate::http_server::endpoints::user_bookmarks::create_user_bookmark_handler::create_user_bookmark_handler,
    crate::http_server::endpoints::user_bookmarks::delete_user_bookmark_handler::delete_user_bookmark_handler,
    crate::http_server::endpoints::user_bookmarks::list_user_bookmarks_for_entity_handler::list_user_bookmarks_for_entity_handler,
    crate::http_server::endpoints::user_bookmarks::list_user_bookmarks_for_user_handler::list_user_bookmarks_for_user_handler,
    crate::http_server::endpoints::user_ratings::batch_get_user_rating_handler::batch_get_user_rating_handler,
    crate::http_server::endpoints::user_ratings::get_user_rating_handler::get_user_rating_handler,
    crate::http_server::endpoints::user_ratings::set_user_rating_handler::set_user_rating_handler,
    crate::http_server::endpoints::users::get_profile_handler::get_profile_handler,
    crate::http_server::endpoints::users::login_handler::login_handler,
    crate::http_server::endpoints::users::logout_handler::logout_handler,
    crate::http_server::endpoints::users::session_info_handler::session_info_handler,
    crate::http_server::endpoints::voice_conversion::inference::enqueue_voice_conversion_inference::enqueue_voice_conversion_inference_handler,
    crate::http_server::endpoints::voice_designer::inference::enqueue_tts_request::enqueue_tts_request,
    crate::http_server::endpoints::voice_designer::voice_datasets::list_datasets_by_user::list_datasets_by_user_handler,
    crate::http_server::endpoints::weights::delete_weight_handler::delete_weight_handler,
    crate::http_server::endpoints::weights::get_weight_handler::get_weight_handler,
    crate::http_server::endpoints::weights::list_available_weights_handler::list_available_weights_handler,
    crate::http_server::endpoints::weights::list_featured_weights_handler::list_featured_weights_handler,
    crate::http_server::endpoints::weights::list_pinned_weights_handler::list_pinned_weights_handler,
    crate::http_server::endpoints::weights::list_weights_by_user_handler::list_weights_by_user_handler,
    crate::http_server::endpoints::weights::search_model_weights_handler::search_model_weights_handler,
    crate::http_server::endpoints::weights::set_model_weight_cover_image_handler::set_model_weight_cover_image_handler,
    crate::http_server::endpoints::weights::update_weight_handler::update_weight_handler,
    crate::http_server::endpoints::workflows::enqueue_video_style_transfer_handler::enqueue_video_style_transfer_handler,
    crate::http_server::endpoints::workflows::enqueue::enqueue_live_portrait_workflow_handler::enqueue_live_portrait_workflow_handler,
    crate::http_server::endpoints::workflows::enqueue::enqueue_studio_workflow_handler::enqueue_studio_workflow_handler,
    crate::http_server::endpoints::workflows::enqueue::enqueue_video_style_transfer_workflow_handler::enqueue_video_style_transfer_workflow_handler,
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

    // Common path info
    MediaFileTokenPathInfo,

    // Common response structs
    MediaFileModelDetails,
    MediaFileOriginDetails,
    MediaFileSocialMetaLight,
    MediaFileWriteError,
    MediaFileWriteError,
    PaginationCursors,
    PaginationPage,
    SimpleEntityStats,
    SimpleGenericJsonSuccess,
    SimpleResponse,
    UserDetailsLight,
    Visibility,

    // Common cover image types
    MediaFileCoverImageDetails,
    MediaFileDefaultCover,
    UserDefaultAvatarInfo,
    WeightsCoverImageDetails,
    WeightsDefaultCoverInfo,

    // Endpoint API types
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
    EnqueueFbxToGltfRequest,
    EnqueueFbxToGltfRequestError,
    EnqueueFbxToGltfRequestSuccessResponse,
    EnqueueLivePortraitCropDimensions,
    EnqueueLivePortraitWorkflowError,
    EnqueueLivePortraitWorkflowRequest,
    EnqueueLivePortraitWorkflowSuccessResponse,
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
    SearchModelWeightsSuccessResponse,
    SessionInfoError,
    SessionInfoSuccessResponse,
    SessionUserInfo,
    SetMediaFileCoverImageError,
    SetMediaFileCoverImageRequest,
    SetModelWeightCoverImageError,
    SetModelWeightCoverImagePathInfo,
    SetModelWeightCoverImageRequest,
    SetModelWeightCoverImageResponse,
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
