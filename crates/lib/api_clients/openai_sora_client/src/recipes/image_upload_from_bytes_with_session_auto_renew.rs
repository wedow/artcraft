use crate::creds::credential_migration::CredentialMigrationRef;
use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::creds::sora_jwt_bearer_token::SoraJwtBearerToken;
use crate::creds::sora_sentinel::SoraSentinel;
use crate::recipes::maybe_refresh_credentials_on_sora_error::maybe_refresh_credentials_on_sora_error;
use crate::requests::bearer::generate::generate_bearer_with_cookie;
use crate::requests::image_gen::common::{ImageSize, NumImages, SoraImageGenResponse};
use crate::requests::image_gen::image_gen_http_request;
use crate::requests::image_gen::sora_image_gen_remix::{sora_image_gen_remix, SoraImageGenRemixRequest};
use crate::requests::sentinel_refresh::generate::token::generate_token;
use crate::requests::upload::upload_media_from_bytes::sora_media_upload_from_bytes;
use crate::requests::upload::upload_media_http_request::{upload_media_http_request, SoraMediaUploadResponse};
use crate::sora_error::SoraError;
use anyhow::anyhow;
use errors::AnyhowResult;
use log::{error, info, warn};

pub struct ImageUploadFromBytesAutoRenewRequest<'a> {
  pub file_bytes: Vec<u8>,
  pub filename: String,
  pub mime_type: &'a str,
  pub credentials: &'a SoraCredentialSet,
}

/// Image upload with retry and session auto-renewal.
pub async fn image_upload_from_bytes_with_session_auto_renew(
  request: ImageUploadFromBytesAutoRenewRequest<'_>
) -> Result<(SoraMediaUploadResponse, Option<SoraCredentialSet>), SoraError> {

  let result = sora_media_upload_from_bytes(
    request.file_bytes.clone(), // FIXME(bt): This is horrible, but the client needs to take ownership. :(
    request.filename.clone(), // FIXME: Same
    CredentialMigrationRef::New(request.credentials),
  ).await;

  let err = match result {
    Ok(response) => return Ok((response, None)),
    Err(err) => err,
  };

  warn!("Image upload failed: {:?}", err);

  let new_creds = maybe_refresh_credentials_on_sora_error(request.credentials, err).await?;

  // Now try again...

  info!("Retrying image upload with new credentials...");

  let result = sora_media_upload_from_bytes(
    request.file_bytes,
    request.filename,
    CredentialMigrationRef::New(&new_creds),
  ).await?;

  Ok((result, Some(new_creds)))
}
