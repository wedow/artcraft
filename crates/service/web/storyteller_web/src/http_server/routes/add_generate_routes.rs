use crate::http_server::endpoints::generate::image::generate_flux_pro_ultra_text_to_image_handler::generate_flux_pro_11_ultra_text_to_image_handler;
use crate::http_server::endpoints::generate::image::remove_image_background_handler::remove_image_background_handler;
use crate::http_server::endpoints::generate::object::generate_hunyuan2_image_to_3d_handler::generate_hunyuan_2_image_to_3d_handler;
use crate::http_server::endpoints::generate::video::generate_kling_1_6_pro_video_handler::generate_kling_1_6_pro_video_handler;
use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::{web, App, Error, HttpResponse};

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
        .service(web::resource("/flux_pro_1.1_ultra_text_to_image")
            .route(web::post().to(generate_flux_pro_11_ultra_text_to_image_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(web::resource("/remove_background")
            .route(web::post().to(remove_image_background_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
      )
      .service(web::scope("/video")
          .service(web::resource("/kling_1.6_pro_image_to_video")
              .route(web::post().to(generate_kling_1_6_pro_video_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
      )
      .service(web::scope("/object")
          .service(web::resource("/hunyuan_2_image_to_3d")
              .route(web::post().to(generate_hunyuan_2_image_to_3d_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
      )
  )
}
