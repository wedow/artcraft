use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::error::Error;
use actix_web::{web, App, HttpResponse};

use actix_helpers::route_builder::RouteBuilder;
use billing_component::default_routes::add_suggested_stripe_billing_routes;
use reusable_types::server_environment::ServerEnvironment;

use crate::http_server::endpoints::app_state::get_app_state_handler::get_app_state_handler;
use crate::http_server::endpoints::comments::create_comment_handler::create_comment_handler;
use crate::http_server::endpoints::comments::delete_comment_handler::delete_comment_handler;
use crate::http_server::endpoints::comments::list_comments_handler::list_comments_handler;
use crate::http_server::endpoints::prompts::create_prompt_handler::create_prompt_handler;
use crate::http_server::endpoints::prompts::get_prompt_handler::get_prompt_handler;
use crate::http_server::endpoints::service::status_alert_handler::status_alert_handler;
use crate::http_server::endpoints::stats::get_unified_queue_stats_handler::get_unified_queue_stats_handler;
use crate::http_server::endpoints::user_bookmarks::batch_get_user_bookmarks_handler::batch_get_user_bookmarks_handler;
use crate::http_server::endpoints::user_bookmarks::create_user_bookmark_handler::create_user_bookmark_handler;
use crate::http_server::endpoints::user_bookmarks::delete_user_bookmark_handler::delete_user_bookmark_handler;
use crate::http_server::endpoints::user_bookmarks::list_user_bookmarks_for_entity_handler::list_user_bookmarks_for_entity_handler;
use crate::http_server::endpoints::user_bookmarks::list_user_bookmarks_for_user_handler::list_user_bookmarks_for_user_handler;
use crate::http_server::endpoints::voice_conversion::enqueue_seed_vc_inference_handler::enqueue_infer_seed_vc_handler;
use crate::http_server::endpoints::voice_conversion::enqueue_voice_conversion_inference_handler::enqueue_voice_conversion_inference_handler;
use crate::http_server::endpoints::voice_conversion::list_voice_conversion_models_handler::list_voice_conversion_models_handler;
use crate::http_server::routes::application_routes::add_application_routes::add_application_routes;
use crate::http_server::routes::legacy_routes::add_legacy_routes::add_legacy_routes;
use crate::http_server::routes::service_routes::add_service_routes;

pub fn add_routes<T, B> (app: App<T>, server_environment: ServerEnvironment) -> App<T>
  where
      B: MessageBody,
      T: ServiceFactory<
        ServiceRequest,
        Config = (),
        Response = ServiceResponse<B>,
        Error = Error,
        InitError = (),
      >,
{
  let mut app = app;
  
  app = add_legacy_routes(app); // various legacy routes, mostly deprecated
  app = add_application_routes(app); // Primary product service area routes
  app = add_service_routes(app); // Essential service routes (status, health, info, etc.)


  // ==================== Application State ====================

  let mut app = RouteBuilder::from_app(app)
      .add_get("/v1/app_state", get_app_state_handler)
      .into_app();

  // ==================== Prompts ====================

  let mut app = RouteBuilder::from_app(app)
      // NB: This poor RouteBuilder utility requires that POST comes first, otherwise the GET glob
      // will capture it and force 504 Method Not Allowed for all POSTs.
      .add_post("/v1/prompts/create", create_prompt_handler)
      .add_get("/v1/prompts/{token}", get_prompt_handler)
      .into_app();

  // ==================== Stats ====================

  let mut app = RouteBuilder::from_app(app)
      .add_get("/v1/stats/queues", get_unified_queue_stats_handler)
      .into_app();

  // ==================== Service Status ====================

  let mut app = RouteBuilder::from_app(app)
      .add_get("/v1/status_alert_check", status_alert_handler)
      .into_app();

  // ==================== COMPONENTS ====================

 
  app
}



