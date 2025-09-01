use crate::http_server::endpoints::stripe_artcraft::checkout::stripe_artcraft_create_subscription_checkout_session_handler::stripe_artcraft_create_checkout_session_handler;
use crate::http_server::endpoints::stripe_artcraft::webhook::stripe_artcraft_webhook_handler::stripe_artcraft_webhook_handler;
use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::{web, App, Error, HttpResponse};

pub fn add_stripe_artcraft_routes<T, B> (app: App<T>) -> App<T>
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
  app.service(web::scope("/v1/stripe_artcraft")
      .service(web::resource("/webhook")
          .route(web::post().to(stripe_artcraft_webhook_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/checkout/create_subscription")
          .route(web::post().to(stripe_artcraft_create_checkout_session_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
  )
}
