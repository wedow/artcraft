use crate::creds::credential_migration::CredentialMigrationRef;
use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::recipes::maybe_refresh_credentials_on_sora_error::maybe_refresh_credentials_on_sora_error;
use crate::requests::upload::upload_media_from_file::sora_media_upload_from_file;
use crate::requests::upload::upload_media_http_request::{upload_media_http_request, SoraMediaUploadResponse};
use crate::sora_error::SoraError;
use log::{info, warn};
use std::path::Path;

pub struct ImageUploadFromFileAutoRenewRequest<'a, P: AsRef<Path>> {
  pub file_path: P,
  pub credentials: &'a SoraCredentialSet,
}

/// Image upload with retry and session auto-renewal.
pub async fn image_upload_from_file_with_session_auto_renew<P: AsRef<Path>>(
  request: ImageUploadFromFileAutoRenewRequest<'_, P>
) -> Result<(SoraMediaUploadResponse, Option<SoraCredentialSet>), SoraError> {

  let result = sora_media_upload_from_file(
    request.file_path.as_ref().clone(), // FIXME(bt): This is horrible, but the client needs to take ownership. :(
    CredentialMigrationRef::New(request.credentials),
  ).await;

  let err = match result {
    Ok(response) => return Ok((response, None)),
    Err(err) => err,
  };

  warn!("Image upload failed: {:?}", err);

  let new_creds = maybe_refresh_credentials_on_sora_error(request.credentials, err).await?;

  info!("Retrying image upload with new credentials...");

  let result = sora_media_upload_from_file(
    request.file_path,
    CredentialMigrationRef::New(&new_creds),
  ).await?;

  Ok((result, Some(new_creds)))
}

