use std::fmt;
use std::sync::Arc;

use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use log::{error, log, warn};

use mysql_queries::queries::w2l::w2l_templates::list_w2l_templates::{list_w2l_templates, W2lTemplateRecordForList};

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

#[derive(Serialize)]
pub struct ListW2lTemplatesSuccessResponse {
  pub success: bool,
  pub templates: Vec<W2lTemplateRecordForList>,
}

#[derive(Debug)]
pub enum ListW2lTemplatesError {
  ServerError,
}

impl ResponseError for ListW2lTemplatesError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListW2lTemplatesError::ServerError=> StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      ListW2lTemplatesError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for ListW2lTemplatesError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn list_w2l_templates_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, ListW2lTemplatesError>
{
  // TODO(bt): Perhaps we should build a second endpoint to allow fetching a user's W2L templates
  //  and including them in the global list (before they're mod approved!) just for the uploader.

  let maybe_templates = server_state
      .caches
      .ephemeral
      .w2l_template_list
      .grab_copy_without_bump_if_unexpired()
      .map_err(|e| {
        error!("Error consulting cache: {:?}", e);
        ListW2lTemplatesError::ServerError
      })?;

  let templates = match maybe_templates {
    Some(templates) => {
      templates
    },
    None => {
      const NO_CREATOR_SCOPING_HERE : Option<&'static str> = None;

      let query_results = list_w2l_templates(
        &server_state.mysql_pool,
        NO_CREATOR_SCOPING_HERE,
        true,
      ).await;

      let templates = match query_results {
        Ok(results) => results,
        Err(e) => {
          warn!("w2l template list query error: {:?}", e);
          return Err(ListW2lTemplatesError::ServerError);
        }
      };

      server_state.caches.ephemeral.w2l_template_list.store_copy(&templates)
          .map_err(|e| {
            error!("error storing cache: {:?}", e);
            ListW2lTemplatesError::ServerError
          })?;
      
      templates
    },
  };

  let response = ListW2lTemplatesSuccessResponse {
    success: true,
    templates,
  };

  let body = serde_json::to_string(&response)
    .map_err(|e| ListW2lTemplatesError::ServerError)?;

  Ok(HttpResponse::Ok()
    .content_type("application/json")
    .body(body))
}
