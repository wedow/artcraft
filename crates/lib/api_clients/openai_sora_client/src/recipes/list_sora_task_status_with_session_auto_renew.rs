use crate::creds::credential_migration::CredentialMigrationRef;
use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::recipes::image_upload_from_file_with_session_auto_renew::ImageUploadFromFileAutoRenewRequest;
use crate::recipes::maybe_refresh_credentials_on_sora_error::maybe_refresh_credentials_on_sora_error;
use crate::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use crate::requests::image_gen::image_gen_status::{get_image_gen_status, StatusRequest, TaskId, TaskResponse, VideoGenStatusResponse};
use crate::requests::upload::upload_media_from_file::sora_media_upload_from_file;
use crate::requests::upload::upload_media_http_request::SoraMediaUploadResponse;
use crate::sora_error::SoraError;
use anyhow::Error;
use log::{info, warn};
use std::path::Path;

pub struct StatusRequestArgs {
  pub limit: Option<u32>,
  pub before: Option<TaskId>,
  pub credentials: SoraCredentialSet,
}

/// Check Sora task statuses with session auto-renewal.
/// If a new sora credential is returned, replace the old one with the new one.
pub async fn list_sora_task_status_with_session_auto_renew(
  args: StatusRequestArgs,
) -> Result<(VideoGenStatusResponse, Option<SoraCredentialSet>), SoraError> {

  let request = StatusRequest {
    limit: args.limit,
    before: args.before.map(|t| t.0),
  };

  let mut new_creds = None;

  if args.credentials.jwt_bearer_token.is_none() {
    info!("JWT not set. Upgrading credentials...");
    let mut updated_creds = args.credentials.clone();
    if let Err(err) = maybe_upgrade_or_renew_session(&mut updated_creds).await {
      warn!("Failed to upgrade or renew session: {:?}", err);
    }
    new_creds = Some(updated_creds);
  }

  let upgraded_creds = new_creds.as_ref()
      .unwrap_or_else(|| &args.credentials);

  let result = get_image_gen_status(&request, &upgraded_creds).await;

  let err = match result {
    Ok(response) => return Ok((response, new_creds)),
    Err(err) => err,
  };

  warn!("Task status polling failed: {:?}", err);

  let new_creds = maybe_refresh_credentials_on_sora_error(&args.credentials, err).await?;

  info!("Retrying image upload with new credentials...");

  let result = get_image_gen_status(&request, &upgraded_creds).await?;

  Ok((result, Some(new_creds)))
}
