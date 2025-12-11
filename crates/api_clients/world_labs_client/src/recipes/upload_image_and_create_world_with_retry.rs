use crate::api::api_types::object_id::ObjectId;
use crate::api::api_types::upload_mime_type::UploadMimeType;
use crate::api::requests::google_upload::google_upload_image::{google_upload_image, GoogleUploadImageArgs};
use crate::api::requests::objects::begin_object_image_attachment::{begin_object_image_attachment, BeginObjectImageAttachmentArgs};
use crate::api::requests::objects::begin_object_image_upload::{begin_object_image_upload, BeginObjectImageUploadArgs};
use crate::api::requests::objects::create_object::{create_object, CreateObjectArgs};
use crate::api::requests::objects::finalize_object_image_upload::{finalize_object_image_upload, FinalizeObjectImageUploadArgs};
use crate::credentials::world_labs_bearer_token::WorldLabsBearerToken;
use crate::credentials::world_labs_cookies::WorldLabsCookies;
use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use anyhow::bail;
use log::{error, info};
use serde::Deserialize;
use std::time::Duration;
use crate::api::requests::recaption::recaption_image::{recaption_image, RecaptionImageArgs};

pub struct UploadImageAndCreateWorldWithRetryArgs<'a> {
  pub cookies: &'a WorldLabsCookies,
  pub bearer_token: &'a WorldLabsBearerToken,
  pub individual_request_timeout: Option<Duration>,
  pub file_bytes: Vec<u8>,
}

pub struct UploadImageAndCreateWorldWithRetryResponse {
  pub object_id: ObjectId,
  pub image_upload_url: String,
}

/// Marble Image-to-World
/// Mark the upload as complete.
/// Request #5 (of ~10)
pub async fn upload_image_and_create_world_with_retry(args: UploadImageAndCreateWorldWithRetryArgs<'_>) -> Result<UploadImageAndCreateWorldWithRetryResponse, WorldLabsError> {

  info!("Request #1 of 10: create object ...");

  let response = create_object(CreateObjectArgs {
    cookies: args.cookies,
    bearer_token: args.bearer_token,
    request_timeout: args.individual_request_timeout,
  }).await?;

  let object_id = response.id;

  info!("Object id: {}", object_id.0);

  // TODO - multiple types.
  let upload_mime_type= UploadMimeType::ImageJpeg;

  info!("Request #2 of 10: begin image attachment ...");

  let response = begin_object_image_attachment(BeginObjectImageAttachmentArgs {
    cookies: &args.cookies,
    bearer_token: &args.bearer_token,
    upload_mime_type,
    request_timeout: args.individual_request_timeout,
  }).await?;

  let upload_id = response.id;

  info!("Upload id: {}", upload_id.0);

  info!("Request #3 of 10: begin image upload ...");

  let response = begin_object_image_upload(BeginObjectImageUploadArgs {
    cookies: &args.cookies,
    bearer_token: &args.bearer_token,
    upload_mime_type,
    request_timeout: args.individual_request_timeout,
    upload_id: &upload_id,
  }).await?;

  let google_upload_url = response.upload_url;

  info!("Request #4 of 10: upload to Google GCP ...");

  info!("Google upload URL: {:?}", &google_upload_url);

  let _response = google_upload_image(GoogleUploadImageArgs {
    upload_url: &google_upload_url,
    upload_mime_type,
    file_bytes: args.file_bytes,
    request_timeout: args.individual_request_timeout,
  }).await?;

  info!("Request #5 of 10: finalize object upload ...");

  let response = finalize_object_image_upload(FinalizeObjectImageUploadArgs {
    cookies: &args.cookies,
    bearer_token: &args.bearer_token,
    upload_id: &upload_id,
    request_timeout: args.individual_request_timeout,
  }).await?;

  let image_url = response.object_url;

  info!("Object/image URL: {image_url}");

  info!("Request #6 of 10: captioning with VLM ...");

  let response = recaption_image(RecaptionImageArgs {
    cookies: &args.cookies,
    bearer_token: &args.bearer_token,
    upload_id: &upload_id,
    upload_mime_type,
    run_id: &object_id,
    request_timeout: args.individual_request_timeout,
  }).await?;

  info!("Title: {}", response.title);
  info!("Caption: {}", response.caption);

  Ok(UploadImageAndCreateWorldWithRetryResponse {
    object_id,
    image_upload_url: image_url,
  })
}

#[cfg(test)]
mod tests {
  use crate::recipes::upload_image_and_create_world_with_retry::{upload_image_and_create_world_with_retry, UploadImageAndCreateWorldWithRetryArgs};
  use crate::test_utils::get_test_bearer_token::get_test_bearer_token;
  use crate::test_utils::get_test_cookies::get_typed_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use filesys::file_read_bytes::file_read_bytes;
  use log::LevelFilter;

  #[tokio::test]
  #[ignore] // Client side tests only
  async fn test_requests() {
    setup_test_logging(LevelFilter::Debug);

    let cookies = get_typed_test_cookies().unwrap();
    let bearer_token = get_test_bearer_token().unwrap();

    let file_path = "/home/bt/Pictures/locations/island.jpg";
    let file_bytes = file_read_bytes(file_path).unwrap();

    println!("File bytes len: {}", file_bytes.len());

    let results = upload_image_and_create_world_with_retry(UploadImageAndCreateWorldWithRetryArgs {
      cookies: &cookies,
      bearer_token: &bearer_token,
      individual_request_timeout: None,
      file_bytes: file_bytes,
    }).await.unwrap();

    println!("Upload URL: {}", results.image_upload_url);
    println!("Object ID: {}", results.object_id.0);

  }
}
