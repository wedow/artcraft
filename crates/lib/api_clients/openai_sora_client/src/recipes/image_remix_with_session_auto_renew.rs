use anyhow::anyhow;
use log::{info, warn};
use errors::AnyhowResult;
use crate::creds::credential_migration::CredentialMigrationRef;
use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::creds::sora_jwt_bearer_token::SoraJwtBearerToken;
use crate::creds::sora_sentinel::SoraSentinel;
use crate::requests::bearer::generate::generate_bearer_with_cookie;
use crate::requests::image_gen::common::{ImageSize, NumImages, SoraImageGenResponse};
use crate::requests::image_gen::image_gen_http_request;
use crate::requests::image_gen::sora_image_gen_remix::{sora_image_gen_remix, SoraImageGenRemixRequest};
use crate::requests::sentinel_refresh::generate::token::generate_token;
use crate::sora_error::SoraError;

pub struct ImageRemixAutoRenewRequest<'a> {
  pub prompt: String,
  pub num_images: NumImages,
  pub image_size: ImageSize,
  pub sora_media_tokens: Vec<String>,
  pub credentials: &'a SoraCredentialSet,
}

/// Image request with retry and session auto-renewal.
pub async fn image_remix_with_session_auto_renew(request: ImageRemixAutoRenewRequest<'_>) -> Result<(SoraImageGenResponse, Option<SoraCredentialSet>), SoraError> {
  let result = sora_image_gen_remix(SoraImageGenRemixRequest {
    prompt: request.prompt.clone(), // NB: Clone because used again
    num_images: request.num_images,
    image_size: request.image_size,
    sora_media_tokens: request.sora_media_tokens.clone(), // NB: Clone because used again
    credentials: CredentialMigrationRef::New(request.credentials),
  }).await;

  let err = match result {
    Ok(response) => return Ok((response, None)),
    Err(err) => err,
  };

  warn!("Image generation failed: {:?}", err);

  let mut refresh_jwt = false;
  let mut refresh_sentinel = false;

  match err {
    // We'll fail these requests...
    image_gen_http_request::SoraError::TooManyConcurrentTasks(_) => {
      return Err(SoraError::TooManyConcurrentTasks);
    }
    image_gen_http_request::SoraError::GenericError(err) => {
      return Err(SoraError::OtherBadStatus(anyhow!("image remix failed with GenericError: {:?}", err)))
    }
    image_gen_http_request::SoraError::NetworkError(err) => {
      // TODO: The underlying type should be a reqwest::Error.
      return Err(SoraError::OtherBadStatus(anyhow!("network error: {:?}", err)))
    }

    // We'll retry these requests...

    image_gen_http_request::SoraError::SentinelBlock(err) => {
      warn!("Image generation failed due to sentinel block error: {:?}", err);
      refresh_sentinel = true;
    }
    image_gen_http_request::SoraError::TokenExpired(err) => {
      warn!("Image generation failed due to token expired error: {:?}", err);
      refresh_sentinel = true; // TODO: Not sure what this error is, actually.
      refresh_jwt = true;
    }
    image_gen_http_request::SoraError::InvalidJwt(err) => {
      warn!("Image generation failed due to invalid jwt error: {:?}", err);
      refresh_jwt = true;
    }
  }

  let mut new_bearer = None;

  if refresh_jwt {
    info!("Generating new JWT bearer token...");
    let cookies = request.credentials.cookies.as_str();
    let response = generate_bearer_with_cookie(cookies).await;
    match response {
      Err(err) => {
        return Err(SoraError::OtherBadStatus(anyhow!("failed to generate new JWT bearer token: {:?}", err)))
      }
      Ok(bearer) => {
        match SoraJwtBearerToken::new(bearer) {
          Err(err) => {
            return Err(SoraError::OtherBadStatus(anyhow!("Failed to parse new JWT bearer token: {:?}", err)));
          }
          Ok(bearer) => new_bearer = Some(bearer),
        }
      },
    }
  }

  let mut new_sentinel = None;

  if refresh_sentinel {
    info!("Generating new sentinel...");
    let response = generate_token().await;
    match response {
      Err(err) => {
        return Err(SoraError::OtherBadStatus(anyhow!("failed to generate new sentinel: {:?}", err)))
      }
      Ok(sentinel) => new_sentinel = Some(SoraSentinel::new(sentinel)),
    }
  }

  let mut new_creds = request.credentials.clone();

  if let Some(bearer) = new_bearer {
    new_creds.jwt_bearer_token = Some(bearer);
  }

  if let Some(sentinel) = new_sentinel {
    new_creds.sora_sentinel = Some(sentinel);
  }

  // Now try again...

  let result = sora_image_gen_remix(SoraImageGenRemixRequest {
    prompt: request.prompt,
    num_images: request.num_images,
    image_size: request.image_size,
    sora_media_tokens: request.sora_media_tokens,
    credentials: CredentialMigrationRef::New(&new_creds),
  }).await;

  match result {
    Ok(response) => Ok((response, Some(new_creds))),
    Err(err) => match err {
      image_gen_http_request::SoraError::TooManyConcurrentTasks(err) => {
        Err(SoraError::TooManyConcurrentTasks)
      }
      _ => {
        warn!("Image remix failed again: {:?}", err);
        Err(SoraError::OtherBadStatus(anyhow!("image remix failed again: {:?}", err)))
      }
    }
  }
}
