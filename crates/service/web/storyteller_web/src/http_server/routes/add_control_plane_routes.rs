use crate::http_server::deprecated_endpoints::control_plane::set_sora_secret_handler::set_sora_secret_handler;
use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::{web, App, Error, HttpResponse};

pub fn add_control_plane_routes<T, B> (app: App<T>) -> App<T>
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
  app.service(web::scope("/v1/control_plane")
      .service(web::resource("/sora_secret")
          .route(web::post().to(set_sora_secret_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
  )
}
