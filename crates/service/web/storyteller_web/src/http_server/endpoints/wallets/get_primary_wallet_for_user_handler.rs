use std::fmt;
use std::sync::Arc;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Json, Path};
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use artcraft_api_defs::common::responses::media_links::MediaLinks;
use artcraft_api_defs::wallets::get_primary_wallet_for_user::{GetPrimaryWalletForUserResponse, WalletDetails};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use chrono::{DateTime, Utc};
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::model_type::ModelType;
use enums::common::payments_namespace::PaymentsNamespace;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use log::{error, warn};
use mysql_queries::queries::prompt_context_items::list_prompt_context_items::list_prompt_context_items;
use mysql_queries::queries::prompts::get_prompt::{get_prompt, get_prompt_from_connection};
use mysql_queries::queries::wallets::find_primary_wallet_for_owner::find_primary_wallet_for_owner_using_connection;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use utoipa::ToSchema;

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct GetPrimaryWalletForUserPathInfo {
  namespace: PaymentsNamespace,
}

#[utoipa::path(
  get,
  tag = "Wallets",
  path = "/v1/wallets/primary_wallet/{namespace}",
  responses(
    (status = 200, description = "Success", body = GetPrimaryWalletForUserResponse),
  ),
  params(
    ("path" = GetPromptPathInfo, description = "Path for Request")
  )
)]
pub async fn get_prompt_handler(
  http_request: HttpRequest,
  path: Path<GetPrimaryWalletForUserPathInfo>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<GetPrimaryWalletForUserResponse>, CommonWebError>
{
  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("Error acquiring MySQL connection: {:?}", err);
        CommonWebError::ServerError
      })?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::ServerError
      })?;
  
  let user_token = match maybe_user_session {
    Some(session) => session.user_token,
    None => return Err(CommonWebError::NotAuthorized),
  };

  let maybe_wallet = find_primary_wallet_for_owner_using_connection(
    &user_token,
    path.namespace,
    &mut mysql_connection,
  ).await.map_err(|err| {
    error!("Error finding primary wallet for user: {:?}, error: {:?}", user_token, err);
    CommonWebError::ServerError
  })?;

  Ok(Json(GetPrimaryWalletForUserResponse {
    success: true,
    maybe_primary_wallet: maybe_wallet.map(|wallet| WalletDetails {
      token: wallet.token,
      namespace: wallet.namespace,
      banked_credits: wallet.banked_credits,
      monthly_credits: wallet.monthly_credits,
    })
  }))
}
