use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::api_error::ApiError;
use crate::error::client_error::ClientError;
use crate::error::storyteller_error::StorytellerError;
use crate::shared_response_types::media_file_cover_image_details::MediaFileCoverImageDetails;
use crate::shared_response_types::media_links::MediaLinks;
use crate::shared_response_types::simple_entity_stats::SimpleEntityStats;
use crate::shared_response_types::user_details_light::UserDetailsLight;
use crate::utils::api_host::ApiHost;
use crate::utils::constants::{APPLICATION_JSON, USER_AGENT};
use crate::utils::filter_bad_response::filter_bad_response;
use crate::utils::http_get_anonymous::http_get_anonymous;
use chrono::{DateTime, Utc};
use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::common::visibility::Visibility;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use enums_public::by_table::model_weights::public_weights_types::PublicWeightsType;
use idempotency::uuid::generate_random_uuid;
use log::debug;
use reqwest::multipart::{Form, Part};
use reqwest::Client;
use serde_derive::{Deserialize, Serialize};
use std::fs::File;
use std::io::Read;
use std::path::Path;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::prompts::PromptToken;
use uuid::uuid;

/// Upload an image media file from a file.
/// NB: We need owned bytes for the request.
pub async fn upload_image_media_file_from_bytes(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  bytes: Vec<u8>,
) -> Result<UploadImageMediaFileSuccessResponse, StorytellerError> {

  let url = get_route(api_host);

  debug!("Requesting {:?}", &url);

  let client = Client::builder()
      .gzip(true)
      .build()
      .map_err(|err| StorytellerError::Client(ClientError::from(err)))?;

  let part = Part::bytes(bytes)
      .file_name("image.png")
      .mime_str("image/png")
      .map_err(|err| StorytellerError::Client(ClientError::from(err)))?;

  let form = Form::new()
      .text("uuid_idempotency_token", generate_random_uuid())
      .part("file", part);

  let mut request_builder = client.post(url)
      .header("User-Agent", USER_AGENT)
      .header("Accept", APPLICATION_JSON);
  
  if let Some(creds) = maybe_creds {
    if let Some(header) = &creds.maybe_as_cookie_header() {
      request_builder = request_builder.header("Cookie", header);
    }
  }
  
  let response = request_builder
      .multipart(form)
      .send()
      .await
      .map_err(|err| StorytellerError::Api(ApiError::from(err)))?;

  let response = filter_bad_response(response).await?;
  let response_body = &response.text().await
      .map_err(|err| StorytellerError::Api(ApiError::from(err)))?;

  let media_file = serde_json::from_str(&response_body)
      .map_err(|err| StorytellerError::Api(ApiError::from(err)))?;

  Ok(media_file)
}

fn get_route(api_host: &ApiHost) -> String {
  let api_hostname_and_scheme = api_host.to_api_hostname_and_scheme();
  format!("{}/v1/media_files/upload/image", api_hostname_and_scheme)
}

// TODO(bt,2025-04-22): Share API definitions between client and server in common crate.

#[derive(Deserialize, Debug)]
pub struct UploadImageMediaFileSuccessResponse {
  pub success: bool,
  pub media_file_token: MediaFileToken,
}
