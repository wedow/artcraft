use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use utoipa::ToSchema;

use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::media_files::delete::delete_media_file::{delete_media_file_as_mod, delete_media_file_as_user, undelete_media_file_as_mod, undelete_media_file_as_user};
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::state::server_state::ServerState;
use crate::util::delete_role_disambiguation::{delete_role_disambiguation, DeleteRole};

#[derive(Deserialize, ToSchema)]
pub struct DeleteMediaFileRequest {
    set_delete: bool,
    /// NB: this is only to disambiguate when a user is both a mod and an author.
    as_mod: Option<bool>,
}

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct DeleteMediaFilePathInfo {
    token: MediaFileToken,
}

// =============== Error Response ===============

#[derive(Debug, Serialize, ToSchema)]
pub enum DeleteMediaFileError {
    BadInput(String),
    NotFound,
    NotAuthorized,
    ServerError,
}

impl ResponseError for DeleteMediaFileError {
    fn status_code(&self) -> StatusCode {
        match *self {
            DeleteMediaFileError::BadInput(_) => StatusCode::BAD_REQUEST,
            DeleteMediaFileError::NotFound => StatusCode::NOT_FOUND,
            DeleteMediaFileError::NotAuthorized => StatusCode::UNAUTHORIZED,
            DeleteMediaFileError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        serialize_as_json_error(self)
    }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for DeleteMediaFileError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

// =============== Handler ===============

/// Delete a media file. (Files and records are soft deleted.)
#[utoipa::path(
    delete,
    tag = "Media Files",
    path = "/v1/media_files/file/{token}",
    responses(
        (status = 200, description = "Success Delete", body = SimpleGenericJsonSuccess),
        (status = 400, description = "Bad input", body = DeleteMediaFileError),
        (status = 401, description = "Not authorized", body = DeleteMediaFileError),
        (status = 500, description = "Server error", body = DeleteMediaFileError),
    ),
    params(
        ("request" = DeleteMediaFileRequest, description = "Payload for Request"),
        ("path" = DeleteMediaFilePathInfo, description = "Path for Request")
    )
)]
pub async fn delete_media_file_handler(
    http_request: HttpRequest,
    path: Path<DeleteMediaFilePathInfo>,
    request: web::Json<DeleteMediaFileRequest>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, DeleteMediaFileError>{
    let maybe_user_session = server_state
        .session_checker
        .maybe_get_user_session(&http_request, &server_state.mysql_pool)
        .await
        .map_err(|e| {
            warn!("Session checker error: {:?}", e);
            DeleteMediaFileError::ServerError
        })?;

    let user_session = match maybe_user_session {
        Some(session) => session,
        None => {
            warn!("not logged in");
            return Err(DeleteMediaFileError::NotAuthorized);
        }
    };

    let is_mod = user_session.can_ban_users;

    let media_file_lookup_result = get_media_file(
        &path.token,
        is_mod,
        &server_state.mysql_pool,
    ).await;

    let media_file = match media_file_lookup_result {
        Ok(Some(media_file)) => media_file,
        Ok(None) => {
            warn!("MediaFile not found: {:?}", path.token);
            return Err(DeleteMediaFileError::NotFound);
        },
        Err(err) => {
            warn!("Error looking up media_file: {:?}", err);
            return Err(DeleteMediaFileError::ServerError);
        }
    };

    let is_creator = media_file.maybe_creator_user_token
        .is_some_and(|t| t.as_str() == user_session.user_token.as_str());

    if !is_creator && !is_mod {
        warn!("user is not allowed to delete this media_file: {:?}", user_session.user_token);
        return Err(DeleteMediaFileError::NotAuthorized);
    }

    let delete_role = delete_role_disambiguation(is_mod, is_creator, request.as_mod);

    let query_result = if request.set_delete {
        match delete_role {
            DeleteRole::ErrorDoNotDelete => {
                warn!("user is not allowed to delete media_files: {:?}", user_session.user_token);
                return Err(DeleteMediaFileError::NotAuthorized);
            }
            DeleteRole::AsUser => {
                delete_media_file_as_user(
                    &path.token,
                    &server_state.mysql_pool
                ).await
            }
            DeleteRole::AsMod => {
                delete_media_file_as_mod(
                    &path.token,
                    user_session.user_token.as_str(),
                    &server_state.mysql_pool
                ).await
            }
        }
    } else {
        match delete_role {
            DeleteRole::ErrorDoNotDelete => {
                warn!("user is not allowed to undelete voices: {:?}", user_session.user_token);
                return Err(DeleteMediaFileError::NotAuthorized);
            }
            DeleteRole::AsUser => {
                // NB: Technically only mods can see their own media_files
                undelete_media_file_as_user(
                    &path.token,
                    &server_state.mysql_pool
                ).await
            }
            DeleteRole::AsMod => {
                undelete_media_file_as_mod(
                    &path.token,
                    user_session.user_token.as_str(),
                    &server_state.mysql_pool
                ).await
            }
        }
    };

    match query_result {
        Ok(_) => {},
        Err(err) => {
            warn!("Update media_file mod approval status DB error: {:?}", err);
            return Err(DeleteMediaFileError::ServerError);
        }
    };

    Ok(simple_json_success())
}
