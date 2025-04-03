use crate::http_server::endpoints::image_studio::prompt::enqueue_studio_image_generation::enqueue_studio_image_generation_request;
use crate::http_server::endpoints::image_studio::upload::upload_snapshot_media_file_handler::upload_studio_scene_snapshot_handler;
use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::{web, App, Error, HttpResponse};

pub fn add_image_studio_routes<T, B> (app: App<T>) -> App<T>
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
  app.service(web::scope("/v1/image_studio")
    .service(web::resource("/scene_snapshot")
      .route(web::post().to(upload_studio_scene_snapshot_handler))
      .route(web::head().to(|| HttpResponse::Ok()))
    )
    .service(web::resource("/prompt")
      .route(web::post().to(enqueue_studio_image_generation_request))
      .route(web::head().to(|| HttpResponse::Ok()))
    )
  )
}
