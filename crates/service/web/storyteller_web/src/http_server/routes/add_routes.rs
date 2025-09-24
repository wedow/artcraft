use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::error::Error;
use actix_web::{web, App, HttpResponse};

use actix_helpers::route_builder::RouteBuilder;
use billing_component::default_routes::add_suggested_stripe_billing_routes;
use reusable_types::server_environment::ServerEnvironment;

use crate::http_server::deprecated_endpoints::events::list_events::list_events_handler;
use crate::http_server::endpoints::app_state::get_app_state_handler::get_app_state_handler;
use crate::http_server::endpoints::comments::create_comment_handler::create_comment_handler;
use crate::http_server::endpoints::comments::delete_comment_handler::delete_comment_handler;
use crate::http_server::endpoints::comments::list_comments_handler::list_comments_handler;
use crate::http_server::endpoints::misc::default_route_404::default_route_404;
use crate::http_server::endpoints::misc::detect_locale_handler::detect_locale_handler;
use crate::http_server::endpoints::misc::root_index::get_root_index;
use crate::http_server::endpoints::prompts::create_prompt_handler::create_prompt_handler;
use crate::http_server::endpoints::prompts::get_prompt_handler::get_prompt_handler;
use crate::http_server::endpoints::service::health_check_handler::get_health_check_handler;
use crate::http_server::endpoints::service::public_info_handler::get_public_info_handler;
use crate::http_server::endpoints::service::status_alert_handler::status_alert_handler;
use crate::http_server::endpoints::stats::get_unified_queue_stats_handler::get_unified_queue_stats_handler;
use crate::http_server::endpoints::user_bookmarks::batch_get_user_bookmarks_handler::batch_get_user_bookmarks_handler;
use crate::http_server::endpoints::user_bookmarks::create_user_bookmark_handler::create_user_bookmark_handler;
use crate::http_server::endpoints::user_bookmarks::delete_user_bookmark_handler::delete_user_bookmark_handler;
use crate::http_server::endpoints::user_bookmarks::list_user_bookmarks_for_entity_handler::list_user_bookmarks_for_entity_handler;
use crate::http_server::endpoints::user_bookmarks::list_user_bookmarks_for_user_handler::list_user_bookmarks_for_user_handler;
use crate::http_server::endpoints::user_ratings::batch_get_user_rating_handler::batch_get_user_rating_handler;
use crate::http_server::endpoints::user_ratings::get_user_rating_handler::get_user_rating_handler;
use crate::http_server::endpoints::user_ratings::set_user_rating_handler::set_user_rating_handler;
use crate::http_server::endpoints::voice_conversion::enqueue_seed_vc_inference_handler::enqueue_infer_seed_vc_handler;
use crate::http_server::endpoints::voice_conversion::enqueue_voice_conversion_inference_handler::enqueue_voice_conversion_inference_handler;
use crate::http_server::endpoints::voice_conversion::list_voice_conversion_models_handler::list_voice_conversion_models_handler;
use crate::http_server::routes::add_control_plane_routes::add_control_plane_routes;
use crate::http_server::routes::add_credits_routes::add_credits_routes;
use crate::http_server::routes::add_generate_routes::add_generate_routes;
use crate::http_server::routes::add_stripe_artcraft_routes::add_stripe_artcraft_routes;
use crate::http_server::routes::add_subscription_routes::add_subscription_routes;
use crate::http_server::routes::add_tts_routes::add_tts_routes;
use crate::http_server::routes::add_webhook_routes::add_webhook_routes;
use crate::http_server::routes::featured_item_routes::add_featured_item_routes;
use crate::http_server::routes::job_routes::add_job_routes;
use crate::http_server::routes::legacy_routes::add_legacy_routes::add_legacy_routes;
use crate::http_server::routes::media_files_routes::add_media_file_routes;
use crate::http_server::routes::moderation_routes::add_moderator_routes;
use crate::http_server::routes::tag_routes::add_tag_routes;
use crate::http_server::routes::user_routes::add_user_routes;
use crate::http_server::routes::weights_routes::add_weights_routes;

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
  let mut app = add_moderator_routes(app); // /moderation
  
  app = add_legacy_routes(app); // various routes, mostly deprecated
  
  app = add_user_routes(app); // /create_account, /session, /login, /logout, etc.
  app = add_tts_routes(app); // /tts
  app = add_web_vc_routes(app); // /v1/voice_conversion
  app = add_media_file_routes(app); // /v1/media_files/...
  app = add_user_rating_routes(app); // /v1/user_rating/...
  app = add_featured_item_routes(app); // /v1/featured_item/...
  app = add_subscription_routes(app); // /v1/subscriptions/...
  app = add_weights_routes(app);
  app = add_tag_routes(app); // /v1/tags
  app = add_job_routes(app);
  app = add_control_plane_routes(app); // /v1/control_plane/...
  app = add_generate_routes(app); // /v1/generate/...
  app = add_webhook_routes(app); // /v1/webhooks/...
  app = add_stripe_artcraft_routes(app); // /v1/stripe_artcraft/...
  app = add_credits_routes(app); // /v1/credits/...

  // app = add_image_gen_routes(app);

  // ==================== Comments ====================

  let mut app = RouteBuilder::from_app(app)
      .add_get("/v1/comments/list/{entity_type}/{entity_token}", list_comments_handler)
      .add_post("/v1/comments/new", create_comment_handler)
      .add_post("/v1/comments/delete/{comment_token}", delete_comment_handler)
      .into_app();

  // ==================== User Bookmarks ====================

  let mut app = RouteBuilder::from_app(app)
      .add_get("/v1/user_bookmarks/batch", batch_get_user_bookmarks_handler)
      .add_post("/v1/user_bookmarks/create", create_user_bookmark_handler)
      .add_post("/v1/user_bookmarks/delete/{user_bookmark_token}", delete_user_bookmark_handler)
      //.add_get("/v1/user_bookmarks/list/session", list_user_bookmarks_for_session_handler)
      .add_get("/v1/user_bookmarks/list/user/{username}", list_user_bookmarks_for_user_handler)
      .add_get("/v1/user_bookmarks/list/entity/{entity_type}/{entity_token}", list_user_bookmarks_for_entity_handler)
      .into_app();

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

  app = add_suggested_stripe_billing_routes(app); // /stripe, billing, webhooks, etc.
 
  // ==================== SERVICE ====================
  app.service(
    web::resource("/_status")
        .route(web::get().to(get_health_check_handler))
        .route(web::head().to(|| HttpResponse::Ok()))
  )
  .service(
    web::resource("/server_info") // NB/TODO(bt,2023-01-21): Couldn't scope to /v1/, actix routing table might not like collision
        .route(web::get().to(get_public_info_handler))
        .route(web::head().to(|| HttpResponse::Ok()))
  )
  // ==================== MISC ====================
  .service(
    web::resource("/events")
        .route(web::get().to(list_events_handler))
        .route(web::head().to(|| HttpResponse::Ok()))
  )
      .service(
        web::resource("/detect_locale")
            .route(web::get().to(detect_locale_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
  .service(web::resource("/")
      .route(web::get().to(get_root_index))
      .route(web::head().to(|| HttpResponse::Ok()))
  )
  .default_service( web::route().to(default_route_404))
}



// ==================== WEB VOICE CONVERSION ROUTES ====================

fn add_web_vc_routes<T, B> (app: App<T>) -> App<T>
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
  app.service(
    web::scope("/v1/voice_conversion")
        .service(
          web::resource("/inference")
              .route(web::post().to(enqueue_voice_conversion_inference_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(
          web::resource("/seed_vc_inference")
            .route(web::post().to(enqueue_infer_seed_vc_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(
          web::resource("/model_list")
              .route(web::get().to(list_voice_conversion_models_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
        )
  )
}

// ==================== USER RATING ROUTES ====================

fn add_user_rating_routes<T, B> (app: App<T>) -> App<T>
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
  app.service(web::scope("/v1/user_rating")
      .service(web::resource("/batch")
          .route(web::get().to(batch_get_user_rating_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/rate")
          .route(web::post().to(set_user_rating_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/view/{entity_type}/{entity_token}")
          .route(web::get().to(get_user_rating_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
  )
}

