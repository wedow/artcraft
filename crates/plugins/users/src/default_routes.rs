//! These routes are recommended, but do not have to be used by consumers of the user system.
use actix_web::body::MessageBody;
use actix_web::dev::{ServiceRequest, ServiceResponse, ServiceFactory};
use actix_web::error::Error;
use actix_web::{App, web, HttpResponse};
use crate::endpoints::create_account_handler::create_account_handler;
use crate::endpoints::login_handler::login_handler;
use crate::endpoints::logout_handler::logout_handler;
use crate::endpoints::session_info_handler::session_info_handler;

// NB: This does not include the user edit endpoints since FakeYou's API mounts them alongside other things.
// A 'v2' API would mount under a v2 prefix and the entity type.

pub fn add_suggested_api_v1_account_creation_and_session_routes<T, B> (app: App<T>) -> App<T>
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
  app
      .service(
        web::resource("/create_account")
            .route(web::post().to(create_account_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/login")
            .route(web::post().to(login_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
          web::resource("/v1/login")
              .route(web::post().to(login_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/logout")
            .route(web::post().to(logout_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
          web::resource("/v1/logout")
              .route(web::post().to(logout_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/session")
            .route(web::get().to(session_info_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
          web::resource("/v1/session")
              .route(web::get().to(session_info_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
      )
}
