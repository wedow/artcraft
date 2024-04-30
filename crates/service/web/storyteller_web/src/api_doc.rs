use utoipa::OpenApi;

use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_subtype::MediaFileSubtype;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::by_table::model_weights::{weights_category::WeightsCategory, weights_types::WeightsType};
use enums::by_table::prompts::prompt_type::PromptType;
use enums::by_table::user_bookmarks::user_bookmark_entity_type::UserBookmarkEntityType;
use enums::by_table::user_ratings::entity_type::UserRatingEntityType;
use enums::by_table::user_ratings::rating_value::UserRatingValue;
use enums::common::job_status_plus::JobStatusPlus;
use enums::common::visibility::Visibility;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use tokens::tokens::batch_generations::*;
use tokens::tokens::generic_inference_jobs::*;
use tokens::tokens::media_files::*;
use tokens::tokens::model_weights::*;
use tokens::tokens::prompts::*;
use tokens::tokens::user_bookmarks::*;
use tokens::tokens::users::*;
use tokens::tokens::zs_voice_datasets::*;
use users_component::common_responses::user_details_lite::{UserDefaultAvatarInfo, UserDetailsLight};
use users_component::endpoints::get_profile_handler::*;
use users_component::endpoints::login_handler::*;
use users_component::endpoints::logout_handler::*;
use users_component::endpoints::session_info_handler::*;

use crate::http_server::common_responses::media_file_cover_image_details::MediaFileCoverImageDetails;
use crate::http_server::common_responses::media_file_cover_image_details::MediaFileDefaultCover;
use crate::http_server::common_responses::media_file_origin_details::*;
use crate::http_server::common_responses::media_file_social_meta_lite::MediaFileSocialMetaLight;
use crate::http_server::common_responses::pagination_cursors::PaginationCursors;
use crate::http_server::common_responses::pagination_page::PaginationPage;
use crate::http_server::common_responses::simple_entity_stats::SimpleEntityStats;
use crate::http_server::common_responses::weights_cover_image_details::*;
use crate::http_server::endpoints::conversion::enqueue_fbx_to_gltf_handler::*;
use crate::http_server::endpoints::engine::create_scene_handler::*;
use crate::http_server::endpoints::inference_job::batch_get_inference_job_status_handler::*;
use crate::http_server::endpoints::inference_job::get_inference_job_status_handler::*;
use crate::http_server::endpoints::inference_job::list_session_jobs_handler::*;
use crate::http_server::endpoints::inference_job::terminate_inference_job_handler::*;
use crate::http_server::endpoints::media_files::delete::delete_media_file_handler::*;
use crate::http_server::endpoints::media_files::edit::change_media_file_visibility_handler::*;
use crate::http_server::endpoints::voice_conversion::inference::enqueue_voice_conversion_inference::*;
use crate::http_server::endpoints::media_files::edit::rename_media_file_handler::*;
use crate::http_server::endpoints::media_files::edit::set_media_file_cover_image_handler::*;
use crate::http_server::endpoints::media_files::get::batch_get_media_files_handler::*;
use crate::http_server::endpoints::media_files::get::get_media_file_handler::*;
use crate::http_server::endpoints::media_files::list::list_featured_media_files_handler::*;
use crate::http_server::endpoints::media_files::list::list_media_files_by_batch_token_handler::*;
use crate::http_server::endpoints::media_files::list::list_media_files_for_user_handler::*;
use crate::http_server::endpoints::media_files::list::list_media_files_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_engine_asset::upload_engine_asset_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_error::MediaFileUploadError;
use crate::http_server::endpoints::media_files::upload::upload_generic::upload_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_video::upload_video_media_file_handler::*;
use crate::http_server::endpoints::media_files::upsert_upload::write_engine_asset::write_engine_asset_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_new_scene_media_file_handler::*;
use crate::http_server::endpoints::media_files::upsert_upload::write_error::MediaFileWriteError;
use crate::http_server::endpoints::media_files::upsert_upload::write_scene_file::write_scene_file_media_file_handler::*;
use crate::http_server::endpoints::moderation::user_feature_flags::edit_user_feature_flags_handler::*;
use crate::http_server::endpoints::prompts::get_prompt_handler::*;
use crate::http_server::endpoints::service::status_alert_handler::*;
use crate::http_server::endpoints::tts::enqueue_infer_tts_handler::enqueue_infer_tts_handler::*;
use crate::http_server::endpoints::user_bookmarks::batch_get_user_bookmarks_handler::*;
use crate::http_server::endpoints::user_bookmarks::create_user_bookmark_handler::*;
use crate::http_server::endpoints::user_bookmarks::delete_user_bookmark_handler::*;
use crate::http_server::endpoints::user_bookmarks::list_user_bookmarks_for_entity_handler::*;
use crate::http_server::endpoints::user_bookmarks::list_user_bookmarks_for_user_handler::*;
use crate::http_server::endpoints::user_ratings::batch_get_user_rating_handler::*;
use crate::http_server::endpoints::user_ratings::get_user_rating_handler::*;
use crate::http_server::endpoints::user_ratings::set_user_rating_handler::*;
use crate::http_server::endpoints::voice_designer::inference::enqueue_tts_request::*;
use crate::http_server::endpoints::voice_designer::voice_datasets::list_datasets_by_user::*;
use crate::http_server::endpoints::weights::delete_weight_handler::*;
use crate::http_server::endpoints::weights::get_weight_handler::*;
use crate::http_server::endpoints::weights::list_available_weights_handler::*;
use crate::http_server::endpoints::weights::list_featured_weights_handler::*;
use crate::http_server::endpoints::weights::list_weights_by_user_handler::*;
use crate::http_server::endpoints::weights::search_model_weights_handler::*;
use crate::http_server::endpoints::weights::set_model_weight_cover_image_handler::*;
use crate::http_server::endpoints::weights::update_weight_handler::*;
use crate::http_server::endpoints::workflows::enqueue_video_style_transfer_handler::*;
use crate::http_server::web_utils::response_success_helpers::*;

#[derive(OpenApi)]
#[openapi(
  paths(
    crate::http_server::endpoints::conversion::enqueue_fbx_to_gltf_handler::enqueue_fbx_to_gltf_handler,
    crate::http_server::endpoints::engine::create_scene_handler::create_scene_handler,
    crate::http_server::endpoints::inference_job::batch_get_inference_job_status_handler::batch_get_inference_job_status_handler,
    crate::http_server::endpoints::inference_job::get_inference_job_status_handler::get_inference_job_status_handler,
    crate::http_server::endpoints::inference_job::list_session_jobs_handler::list_session_jobs_handler,
    crate::http_server::endpoints::inference_job::terminate_inference_job_handler::terminate_inference_job_handler,
    crate::http_server::endpoints::media_files::delete::delete_media_file_handler::delete_media_file_handler,
    crate::http_server::endpoints::media_files::edit::change_media_file_visibility_handler::change_media_file_visibility_handler,
    crate::http_server::endpoints::media_files::edit::rename_media_file_handler::rename_media_file_handler,
    crate::http_server::endpoints::media_files::edit::set_media_file_cover_image_handler::set_media_file_cover_image_handler,
    crate::http_server::endpoints::media_files::get::batch_get_media_files_handler::batch_get_media_files_handler,
    crate::http_server::endpoints::media_files::get::get_media_file_handler::get_media_file_handler,
    crate::http_server::endpoints::media_files::list::list_featured_media_files_handler::list_featured_media_files_handler,
    crate::http_server::endpoints::media_files::list::list_media_files_by_batch_token_handler::list_media_files_by_batch_token_handler,
    crate::http_server::endpoints::media_files::list::list_media_files_for_user_handler::list_media_files_for_user_handler,
    crate::http_server::endpoints::media_files::list::list_media_files_handler::list_media_files_handler,
    crate::http_server::endpoints::media_files::upload::upload_engine_asset::upload_engine_asset_media_file_handler::upload_engine_asset_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_generic::upload_media_file_handler::upload_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_new_scene_media_file_handler::upload_new_scene_media_file_handler,
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
    crate::http_server::endpoints::voice_conversion::inference::enqueue_voice_conversion_inference::enqueue_voice_conversion_inference_handler,
    crate::http_server::endpoints::voice_designer::inference::enqueue_tts_request::enqueue_tts_request,
    crate::http_server::endpoints::voice_designer::voice_datasets::list_datasets_by_user::list_datasets_by_user_handler,
    crate::http_server::endpoints::weights::delete_weight_handler::delete_weight_handler,
    crate::http_server::endpoints::weights::get_weight_handler::get_weight_handler,
    crate::http_server::endpoints::weights::list_available_weights_handler::list_available_weights_handler,
    crate::http_server::endpoints::weights::list_featured_weights_handler::list_featured_weights_handler,
    crate::http_server::endpoints::weights::list_weights_by_user_handler::list_weights_by_user_handler,
    crate::http_server::endpoints::weights::search_model_weights_handler::search_model_weights_handler,
    crate::http_server::endpoints::weights::set_model_weight_cover_image_handler::set_model_weight_cover_image_handler,
    crate::http_server::endpoints::weights::update_weight_handler::update_weight_handler,
    crate::http_server::endpoints::workflows::enqueue_video_style_transfer_handler::enqueue_video_style_transfer_handler,
    users_component::endpoints::get_profile_handler::get_profile_handler,
    users_component::endpoints::login_handler::login_handler,
    users_component::endpoints::logout_handler::logout_handler,
    users_component::endpoints::session_info_handler::session_info_handler,
  ),
  components(schemas(
    // Tokens
    BatchGenerationToken,
    InferenceJobToken,
    MediaFileToken,
    ModelWeightToken,
    PromptToken,
    UserBookmarkToken,
    UserToken,
    ZsVoiceDatasetToken,

    // Enums
    FrontendFailureCategory,
    InferenceCategory,
    JobStatusPlus,
    MediaFileAnimationType,
    MediaFileClass,
    MediaFileEngineCategory,
    MediaFileOriginCategory,
    MediaFileOriginModelType,
    MediaFileOriginProductCategory,
    MediaFileSubtype,
    MediaFileType,
    PromptType,
    StyleTransferName,
    WeightsCategory,
    WeightsType,

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
    BookmarkRow,
    ChangeMediaFileVisibilityError,
    ChangeMediaFileVisibilityPathInfo,
    ChangeMediaFileVisibilityRequest,
    CreateSceneError,
    EnqueueVoiceConversionInferenceError,
    EnqueueVoiceConversionInferenceSuccessResponse,

    EnqueueVoiceConversionInferenceRequest,
    FundamentalFrequencyMethod,
    CreateSceneSuccessResponse,
    CreateUserBookmarkError,
    CreateUserBookmarkRequest,
    CreateUserBookmarkSuccessResponse,
    DeleteMediaFileError,
    DeleteMediaFilePathInfo,
    DeleteMediaFileRequest,
    DeleteUserBookmarkError,
    DeleteUserBookmarkPathInfo,
    DeleteUserBookmarkRequest,
    DeleteWeightError,
    DeleteWeightPathInfo,
    DeleteWeightRequest,
    EditUserFeatureFlagPathInfo,
    EditUserFeatureFlagsError,
    EditUserFeatureFlagsOption,
    EditUserFeatureFlagsRequest,
    EnqueueFbxToGltfRequest,
    EnqueueFbxToGltfRequestError,
    EnqueueFbxToGltfRequestSuccessResponse,
    EnqueueTTSRequest,
    EnqueueTTSRequestError,
    EnqueueTTSRequestSuccessResponse,
    EnqueueVideoStyleTransferError,
    EnqueueVideoStyleTransferRequest,
    EnqueueVideoStyleTransferSuccessResponse,
    FakeYouPlan,
    FeaturedModelWeightForList,
    GetInferenceJobStatusError,
    GetInferenceJobStatusPathInfo,
    GetInferenceJobStatusSuccessResponse,
    GetMediaFileError,
    GetMediaFileModelInfo,
    GetMediaFilePathInfo,
    GetMediaFileSuccessResponse,
    GetProfilePathInfo,
    GetPromptError,
    GetPromptPathInfo,
    GetPromptSuccessResponse,
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
    ListAvailableWeightsQuery,
    ListAvailableWeightsSuccessResponse,
    ListDatasetsByUserError,
    ListDatasetsByUserPathInfo,
    ListDatasetsByUserSuccessResponse,
    ListFeaturedMediaFilesError,
    ListFeaturedMediaFilesSuccessResponse,
    ListFeaturedWeightsError,
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
    LoginErrorResponse,
    LoginErrorType,
    LoginRequest,
    LoginSuccessResponse,
    LogoutError,
    LogoutSuccessResponse,
    MediaFile,
    MediaFileData,
    MediaFileForUserListItem,
    MediaFileInfo,
    MediaFileListItem,
    MediaFileUploadError,
    MediaFilesByBatchListItem,
    ModelWeightForList,
    ModelWeightSearchResult,
    ProfileError,
    RatingRow,
    RenameMediaFileError,
    RenameMediaFilePathInfo,
    RenameMediaFileRequest,
    RequestDetailsResponse,
    ResultDetailsResponse,
    SearchModelWeightsError,
    SearchModelWeightsRequest,
    SearchModelWeightsSuccessResponse,
    SessionInfoError,
    SessionInfoSuccessResponse,
    SessionUserInfo,
    SetMediaFileCoverImageError,
    SetMediaFileCoverImagePathInfo,
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
    TerminateInferenceJobError,
    TerminateInferenceJobPathInfo,
    TerminateInferenceJobSuccessResponse,
    UpdateWeightError,
    UpdateWeightPathInfo,
    UpdateWeightRequest,
    UploadEngineAssetMediaSuccessResponse,
    UploadMediaSuccessResponse,
    UploadNewSceneMediaFileForm,
    UploadNewSceneMediaFileSuccessResponse,
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
    Weight,
    WeightsData,
    WriteEngineAssetMediaSuccessResponse,
    WriteSceneFileMediaSuccessResponse,
    ZsDatasetRecord,
  ))
)]
pub struct ApiDoc;
