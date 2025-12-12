use std::collections::HashMap;
use crate::api::api_types::run_object_id::RunObjectId;
use crate::api::api_types::upload_object_id::UploadObjectId;
use crate::api::api_types::upload_mime_type::UploadMimeType;
use crate::api::api_types::world_object_id::WorldObjectId;
use crate::api::common::common_header_values::{ORIGIN_VALUE, REFERER_VALUE};
use crate::api::utils::upload_id_to_image_url::upload_id_to_image_url;
use crate::credentials::world_labs_bearer_token::WorldLabsBearerToken;
use crate::credentials::world_labs_cookies::WorldLabsCookies;
use crate::error::world_labs_client_error::WorldLabsClientError;
use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use http_headers::names::{PRIORITY, SEC_FETCH_DEST, SEC_FETCH_MODE, SEC_FETCH_SITE, SEC_GPC};
use http_headers::values::accept::ACCEPT_ALL;
use http_headers::values::cache_control::CACHE_CONTROL_NO_CACHE;
use http_headers::values::connection::CONNECTION_KEEP_ALIVE;
use http_headers::values::content_type::CONTENT_TYPE_APPLICATION_JSON;
use http_headers::values::pragma::PRAGMA_NO_CACHE;
use http_headers::values::priority::PRIORITY_4;
use http_headers::values::sec::{SEC_FETCH_DEST_EMPTY, SEC_FETCH_MODE_CORS, SEC_FETCH_SITE_CROSS_SITE};
use http_headers::values::te::TE_TRAILERS;
use log::{debug, error};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use chrono::Utc;
use serde_json::Value;
use wreq::header::{ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, AUTHORIZATION, CACHE_CONTROL, CONNECTION, CONTENT_TYPE, ORIGIN, PRAGMA, REFERER, TE};
use wreq::Client;
use wreq_util::Emulation;

const BASE_URL : &str = "https://marble2-kgw-prod-iac1.wlt-ai.art/api/v1/objects";

fn get_url(run_id: &RunObjectId) -> String {
  format!("{}/{}", BASE_URL, run_id.0)
}

pub struct UpdateRunObjectWithUploadArgs<'a> {
  pub cookies: &'a WorldLabsCookies,
  pub bearer_token: &'a WorldLabsBearerToken,
  pub run_id: &'a RunObjectId,

  pub upload_id: &'a UploadObjectId,
  pub upload_mime_type: UploadMimeType,
  pub text_prompt: &'a str,
  pub request_timeout: Option<Duration>,
}

pub struct UpdateRunObjectWithUploadResponse {
  pub world_id: WorldObjectId,
}

/// Marble Image-to-World
/// This request patches an object. Seems to update it with the attached files.
/// Request #6 (of ~10)
pub async fn update_run_object_with_upload(args: UpdateRunObjectWithUploadArgs<'_>) -> Result<UpdateRunObjectWithUploadResponse, WorldLabsError> {
  let client = Client::builder()
      .emulation(Emulation::Firefox143)
      .build()
      .map_err(|err| WorldLabsClientError::WreqClientError(err))?;

  let url = get_url(args.run_id);

  debug!("Requesting URL: {}", url);

  let mut request_builder = client.patch(url)
      .header(ACCEPT, ACCEPT_ALL)
      .header(ACCEPT_LANGUAGE, "en-US,en;q=0.5")
      .header(ACCEPT_ENCODING, "gzip, deflate, br, zstd")
      .header(REFERER, REFERER_VALUE)
      .header(CONTENT_TYPE, CONTENT_TYPE_APPLICATION_JSON)
      .header(AUTHORIZATION, args.bearer_token.to_bearer_token_string())
      .header(ORIGIN, ORIGIN_VALUE)
      .header(SEC_GPC, "1")
      .header(CONNECTION, CONNECTION_KEEP_ALIVE)
      .header(SEC_FETCH_DEST, SEC_FETCH_DEST_EMPTY)
      .header(SEC_FETCH_MODE, SEC_FETCH_MODE_CORS)
      .header(SEC_FETCH_SITE, SEC_FETCH_SITE_CROSS_SITE)
      .header(PRIORITY, PRIORITY_4)
      .header(PRAGMA, PRAGMA_NO_CACHE)
      .header(CACHE_CONTROL, CACHE_CONTROL_NO_CACHE)
      .header(TE, TE_TRAILERS);

  if let Some(timeout) = args.request_timeout {
    request_builder = request_builder.timeout(timeout);
  }

  let request_payload = RawRequest::default();

  let http_request = request_builder.json(&request_payload)
      .build()
      .map_err(|err| {
        error!("Error building request: {:?}", err);
        WorldLabsClientError::WreqClientError(err)
      })?;

  let response = client.execute(http_request)
      .await
      .map_err(|err| {
        error!("Error during request execution: {:?}", err);
        WorldLabsGenericApiError::WreqError(err)
      })?;

  let status = response.status();

  let response_body = response.text()
      .await
      .map_err(|err| {
        error!("Error reading response body: {:?}", err);
        WorldLabsGenericApiError::WreqError(err)
      })?;

  // TODO: Handle errors (Cloudflare, Grok, etc.)
  if !status.is_success() {
    error!("Request returned an error (code {}) : {:?}", status.as_u16(), response_body);
    //return Err(classify_general_http_status_code_and_body(status, response_body));
    return Err(WorldLabsGenericApiError::UncategorizedBadResponseWithStatusAndBody { status_code: status, body: response_body}.into())
  }

  debug!("Response body (200): {}", response_body);

  let response : RawResponse = serde_json::from_str(&response_body)
      .map_err(|err| WorldLabsGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

  Ok(UpdateRunObjectWithUploadResponse {
    world_id: WorldObjectId(response.id),
  })
}

#[derive(Serialize)]
struct RawRequest {
  pub object: ObjectDef,
  pub update_mask: Vec<String>,
}

#[derive(Serialize)]
struct ObjectDef {
  pub metadata: ObjectMetadata,
}

#[derive(Serialize)]
struct ObjectMetadata {
  pub version: String,

  #[serde(rename = "createdAt")]
  pub created_at: u64,

  #[serde(rename = "updatedAt")]
  pub updated_at: u64,

  #[serde(rename = "usesAdvancedEditing")]
  pub uses_advanced_editing: bool,

  #[serde(rename = "draftMode")]
  pub draft_mode: bool,

  /// Polymorphic set of ID-to-object mappings.
  pub nodes: HashMap<String, Value>,
}

impl Default for RawRequest {
  fn default() -> Self {
    let now = Utc::now();
    let now = now.timestamp().unsigned_abs();
    Self {
      object: ObjectDef {
        metadata: ObjectMetadata {
          version: "0.0.1".to_string(),
          created_at: now,
          updated_at: now,
          uses_advanced_editing: false,
          draft_mode: false,
          nodes: HashMap::new(),
        }
      },
      update_mask: vec!["metadata".to_string()]
    }
  }
}

#[derive(Deserialize)]
struct RawResponse {
  pub id: String,
}

#[cfg(test)]
mod tests {
  use crate::api::requests::objects::update_run_object_with_upload::RawRequest;

  #[test]
  fn request_default() {
    let request = RawRequest::default();
    assert_eq!(request.object.metadata.version, "0.0.1");
    assert!(request.object.metadata.created_at > 10000);
    assert!(request.object.metadata.updated_at > 10000);
  }
}
