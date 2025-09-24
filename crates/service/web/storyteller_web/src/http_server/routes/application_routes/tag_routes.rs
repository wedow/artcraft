use crate::http_server::endpoints::tags::list_tags_for_entity_handler::list_tags_for_entity_handler;
use crate::http_server::endpoints::tags::set_tags_for_entity_handler::set_tags_for_entity_handler;
use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::{web, App, Error, HttpResponse};

pub fn add_tag_routes<T, B>(app: App<T>) -> App<T>
where
    B: MessageBody,
    T: ServiceFactory<
      ServiceRequest,
      Config = (),
      Response = ServiceResponse<B>,
      Error = Error,
      InitError = ()
    >
{
  app.service(
    web
    ::scope("/v1/tags")
        .service(web::resource("/list/{entity_type}/{entity_token}")
            .route(web::get().to(list_tags_for_entity_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(web::resource("/edit/{entity_type}/{entity_token}")
            .route(web::post().to(set_tags_for_entity_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
  )
}
