use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::error::Error;
use actix_web::{web, App, HttpResponse};

use crate::http_server::endpoints::voice_conversion::enqueue_seed_vc_inference_handler::enqueue_infer_seed_vc_handler;
use crate::http_server::endpoints::voice_conversion::enqueue_voice_conversion_inference_handler::enqueue_voice_conversion_inference_handler;
use crate::http_server::endpoints::voice_conversion::list_voice_conversion_models_handler::list_voice_conversion_models_handler;

pub fn add_voice_conversion_routes<T, B> (app: App<T>) -> App<T>
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

