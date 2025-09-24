use crate::http_server::endpoints::studio_gen2::enqueue_studio_gen2_handler::enqueue_studio_gen2_handler;
use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::{web, App, Error, HttpResponse};

pub fn add_studio_gen2_routes<T, B> (app: App<T>) -> App<T>
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
  app.service(web::scope("/v1/studio_gen2")
      .service(web::resource("/enqueue")
          .route(web::post().to(enqueue_studio_gen2_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
  )
}
