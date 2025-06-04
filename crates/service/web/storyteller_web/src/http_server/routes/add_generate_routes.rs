use crate::http_server::endpoints::generate::image::remove_image_background_handler::remove_image_background_handler;
use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::{web, App, Error, HttpResponse};
use crate::http_server::endpoints::generate::video::generate_kling_1_6_video_handler::generate_kling_1_6_video_handler;

pub fn add_generate_routes<T, B> (app: App<T>) -> App<T>
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
  app.service(web::scope("/v1/generate")
      .service(web::scope("/image")
        .service(web::resource("/remove_background")
            .route(web::post().to(remove_image_background_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
      )
      .service(web::scope("/video")
          .service(web::resource("/kling_16_image_to_video")
              .route(web::post().to(generate_kling_1_6_video_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
      )
  )
}
