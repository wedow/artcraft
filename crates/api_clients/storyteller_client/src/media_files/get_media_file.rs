use crate::error::api_error::ApiError;
use crate::error::storyteller_error::StorytellerError;
use crate::shared_response_types::media_file_cover_image_details::MediaFileCoverImageDetails;
use crate::shared_response_types::media_links::MediaLinks;
use crate::shared_response_types::simple_entity_stats::SimpleEntityStats;
use crate::shared_response_types::user_details_light::UserDetailsLight;
use crate::utils::api_host::ApiHost;
use crate::utils::filter_bad_response::filter_bad_response;
use crate::utils::http_get_anonymous::http_get_anonymous;
use artcraft_api_defs::media_files::get_media_file::GetMediaFileSuccessResponse;
use chrono::{DateTime, Utc};
use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::common::visibility::Visibility;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use enums_public::by_table::model_weights::public_weights_types::PublicWeightsType;
use log::debug;
use serde_derive::Deserialize;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::prompts::PromptToken;

/// Get details about a media file from our backend
pub async fn get_media_file(api_host: &ApiHost, media_file_token: &MediaFileToken) -> Result<GetMediaFileSuccessResponse, StorytellerError> {
  let url = get_media_file_token_route(api_host, media_file_token);

  debug!("Requesting {:?}", &url);

  let response = http_get_anonymous(url).await?;
  let response = filter_bad_response(response).await?;
  let response_body = &response.text().await
      .map_err(|err| StorytellerError::Api(ApiError::from(err)))?;

  let media_file = serde_json::from_str(&response_body)
      .map_err(|err| StorytellerError::Api(ApiError::from(err)))?;

  Ok(media_file)
}

fn get_media_file_token_route(api_host: &ApiHost, media_file_token: &MediaFileToken) -> String {
  let api_hostname_and_scheme = api_host.to_api_hostname_and_scheme();
  let media_file_token = media_file_token.as_str();
  format!("{}/v1/media_files/file/{}", api_hostname_and_scheme, media_file_token)
}

// TODO(bt,2025-04-22): Share API definitions between client and server in common crate.


#[cfg(test)]
mod tests {
  use crate::media_files::get_media_file::get_media_file;
  use crate::utils::api_host::ApiHost;
  use tokens::tokens::media_files::MediaFileToken;

  #[tokio::test]
  #[ignore] // Don't run in CI. Requires valid cookie
  async fn test_request() {
    let host = ApiHost::Storyteller;
    let token = MediaFileToken::new_from_str("m_gff67btr810vg3ng9szj85zskztcgy");
    let result = get_media_file(&host, &token).await.unwrap();

    println!("Result: {:?}", &result);

    assert_eq!(result.success, false); // NB: Will fail so we can see debug printed result.
  }
}
