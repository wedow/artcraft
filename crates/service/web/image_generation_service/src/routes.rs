use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::error::Error;
use actix_web::{App, web, HttpResponse};
use http_server_common::endpoints::default_route_404::default_route_404;
use http_server_common::endpoints::root_index::get_root_index;

pub fn add_routes<T, B> (app: App<T>) -> App<T>
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
      //.service(web::resource("/_status")
      //    .route(web::get().to(get_health_check_handler))
      //    .route(web::head().to(|| HttpResponse::Ok())))
      .service(web::resource("/")
          .route(web::get().to(get_root_index))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .default_service( web::route().to(default_route_404))
}
