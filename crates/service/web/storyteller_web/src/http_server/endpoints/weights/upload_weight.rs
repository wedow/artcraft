use std::collections::HashSet;
use std::sync::Arc;

use actix_multipart::Multipart;
use actix_web::{ HttpRequest, HttpResponse, web };
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::by_table::model_weights::weights_types::WeightsType;
use mysql_queries::queries::model_weights::create_weight::{ self, create_weight };
use once_cell::sync::Lazy;

use tokens::tokens::model_weights::ModelWeightToken;

use crate::http_server::endpoints::media_uploads::common::upload_error::UploadError;
use crate::server_state::ServerState;

use log::{ error, info, warn };

use buckets::public::weight_uploads::original_file::WeightUploadOriginalFilePath;
use enums::by_table::media_uploads::media_upload_source::MediaUploadSource;
use enums::by_table::media_uploads::media_upload_type::MediaUploadType;

use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use http_server_common::request::get_request_ip::get_request_ip;
use media::decode_basic_audio_info::decode_basic_audio_bytes_info;
use mimetypes::mimetype_for_bytes::get_mimetype_for_bytes;
use mysql_queries::queries::media_uploads::get_media_upload_by_uuid::get_media_upload_by_uuid_with_connection;
use mysql_queries::queries::media_uploads::insert_media_upload::{ Args, insert_media_upload };

use crate::http_server::endpoints::media_uploads::common::drain_multipart_request::{
    drain_multipart_request,
    MediaSource,
};
use crate::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use utoipa::ToSchema;

use config::bad_urls::is_bad_model_weights_download_url;

use enums::by_table::model_weights::{
    weights_category::WeightsCategory,
    weights_types::WeightsType,
};
use enums::common::visibility::Visibility;
use utoipa::ToSchema;

#[derive(Deserialize, ToSchema)]
pub struct UploadModelWeightsRequest {
    idempotency_token: String,
    title: String,
    download_url: String,
    model_weights_type: WeightsType,
    model_weights_category: WeightsCategory,
    creator_set_visibility: Option<Visibility>,
}

/// Tell the frontend how to deal with the download queue.
#[derive(Serialize, ToSchema)]
pub enum DownloadJobType {
    /// Modern shared download type (everything will use this in the
    /// future, and this endpoint will die.)
    #[serde(rename = "generic")]
    Generic,
}

#[derive(Serialize, ToSchema)]
pub struct UploadModelWeightsSuccessResponse {
    pub success: bool,
    /// This is how frontend clients can request the job execution status.
    pub job_token: String,
    /// This is a transitional field to tell the frontend how to process the job checking.
    pub job_type: DownloadJobType,
}

#[derive(Debug)]
pub enum UploadModelWeightsError {
    BadInput(String),
    MustBeLoggedIn,
    ServerError,
    RateLimited,
}

impl ResponseError for UploadModelWeightsError {
    fn status_code(&self) -> StatusCode {
        match *self {
            UploadModelWeightsError::BadInput(_) => StatusCode::BAD_REQUEST,
            UploadModelWeightsError::MustBeLoggedIn => StatusCode::UNAUTHORIZED,
            UploadModelWeightsError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
            UploadModelWeightsError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
        }
    }

    fn error_response(&self) -> HttpResponse {
        let error_reason = match self {
            UploadModelWeightsError::BadInput(reason) => reason.to_string(),
            UploadModelWeightsError::MustBeLoggedIn => "user must be logged in".to_string(),
            UploadModelWeightsError::ServerError => "server error".to_string(),
            UploadModelWeightsError::RateLimited => "rate limited".to_string(),
        };

        to_simple_json_error(&error_reason, self.status_code())
    }
}

pub async fn upload_weights_handler(
    http_request: HttpRequest,
    server_state: web::Data<Arc<ServerState>>,
    mut multipart_payload: Multipart
) -> Result<HttpResponse, UploadError> {
    // Rate limiter check
    if
        let Err(_err) = server_state.redis_rate_limiters.model_upload.rate_limit_request(
            &http_request
        )
    {
        return Err(UploadModelWeightsError::RateLimited);
    }

    let maybe_user_session = server_state.session_checker
        .maybe_get_user_session(&http_request, &server_state.mysql_pool).await
        .map_err(|e| {
            warn!("Session checker error: {:?}", e);
            UploadModelWeightsError::ServerError
        })?;

    let user_session = match maybe_user_session {
        Some(session) => session,
        None => {
            warn!("not logged in");
            return Err(UploadModelWeightsError::MustBeLoggedIn);
        }
    };

    if let Err(reason) = validate_idempotency_token(&request.idempotency_token) {
        return Err(UploadModelWeightsError::BadInput(reason));
    }

    if let Err(reason) = validate_model_title(&request.title) {
        return Err(UploadModelWeightsError::BadInput(reason));
    }

    match is_bad_model_weights_download_url(&download_url) {
        Ok(false) => {} // Ok case
        Ok(true) => {
            return Err(UploadModelWeightsError::BadInput("Bad model download URL".to_string()));
        }
        Err(err) => {
            warn!("Error parsing url: {:?}", err);
            return Err(UploadModelWeightsError::BadInput("Bad model download URL".to_string()));
        }
    }

    let supported_model_weights_type = request.model_weights_type;

    let job_token;
    let download_job_type;

    let (download_job_token, _record_id) = insert_generic_download_job(
        InsertGenericDownloadJobArgs {
            uuid_idempotency_token: &uuid,
            download_type: GenericDownloadType::Vits,
            download_url: &download_url,
            title: &title,
            creator_user_token: &user_session.user_token,
            creator_ip_address: &ip_address,
            creator_set_visibility: visibility, // TODO: Creator set preference
            mysql_pool: &server_state.mysql_pool,
        }
    ).await.map_err(|err| {
        warn!("New generic download creation DB error (for generic model): {:?}", err);
        UploadModelWeightsError::ServerError
    })?;

    job_token = download_job_token.to_string();
    download_job_type = DownloadJobType::Generic;

    let response = UploadModelWeightsSuccessResponse {
        success: true,
        job_token: job_token.to_string(),
        job_type: download_job_type,
    };

    let body = serde_json::to_string(&response).map_err(|_e| UploadModelWeightsError::ServerError)?;

    Ok(HttpResponse::Ok().content_type("application/json").body(body))
}

fn validate_idempotency_token(token: &str) -> Result<(), String> {
    if token.len() != 36 {
        return Err("idempotency token should be 36 characters".to_string());
    }

    Ok(())
}
