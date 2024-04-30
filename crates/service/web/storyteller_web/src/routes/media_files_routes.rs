use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::{App, Error, HttpResponse, web};
use actix_web::dev::{ServiceRequest, ServiceResponse};

use crate::http_server::endpoints::media_files::delete::delete_media_file_handler::delete_media_file_handler;
use crate::http_server::endpoints::media_files::edit::change_media_file_visibility_handler::change_media_file_visibility_handler;
use crate::http_server::endpoints::media_files::edit::rename_media_file_handler::rename_media_file_handler;
use crate::http_server::endpoints::media_files::edit::set_media_file_cover_image_handler::set_media_file_cover_image_handler;
use crate::http_server::endpoints::media_files::edit::update_media_file_handler::update_media_file_handler;
use crate::http_server::endpoints::media_files::get::batch_get_media_files_handler::batch_get_media_files_handler;
use crate::http_server::endpoints::media_files::get::get_media_file_handler::get_media_file_handler;
use crate::http_server::endpoints::media_files::list::list_featured_media_files_handler::list_featured_media_files_handler;
use crate::http_server::endpoints::media_files::list::list_media_files_handler::list_media_files_handler;
use crate::http_server::endpoints::media_files::list::list_media_files_by_batch_token_handler::list_media_files_by_batch_token_handler;
use crate::http_server::endpoints::media_files::list::list_media_files_for_user_handler::list_media_files_for_user_handler;
use crate::http_server::endpoints::media_files::upload::upload_engine_asset::upload_engine_asset_media_file_handler::upload_engine_asset_media_file_handler;
use crate::http_server::endpoints::media_files::upload::upload_generic::upload_media_file_handler::upload_media_file_handler;
use crate::http_server::endpoints::media_files::upload::upload_new_scene_media_file_handler::upload_new_scene_media_file_handler;
use crate::http_server::endpoints::media_files::upload::upload_video::upload_video_media_file_handler::upload_video_media_file_handler;
use crate::http_server::endpoints::media_files::upsert_upload::write_engine_asset::write_engine_asset_media_file_handler::write_engine_asset_media_file_handler;
use crate::http_server::endpoints::media_files::upsert_upload::write_scene_file::write_scene_file_media_file_handler::write_scene_file_media_file_handler;

pub fn add_media_file_routes<T, B> (app: App<T>) -> App<T>
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
  app.service(web::scope("/v1/media_files")
      .service(web::resource("/file/{token}")
          .route(web::get().to(get_media_file_handler))
          .route(web::delete().to(delete_media_file_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/rename/{token}")
          .route(web::post().to(rename_media_file_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/cover_image/{token}")
          .route(web::post().to(set_media_file_cover_image_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/visibility/{token}")
          .route(web::post().to(change_media_file_visibility_handler))
      )
      .service(web::resource("/file/{token}/update")
          .route(web::post().to(update_media_file_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/batch")
          .route(web::get().to(batch_get_media_files_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/list")
          .route(web::get().to(list_media_files_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/batch/{token}")
          .route(web::get().to(list_media_files_by_batch_token_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/list_featured")
          .route(web::get().to(list_featured_media_files_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/list/user/{username}")
          .route(web::get().to(list_media_files_for_user_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/upload")
          .route(web::post().to(upload_media_file_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/upload/video")
          .route(web::post().to(upload_video_media_file_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/upload/engine_asset")
          .route(web::post().to(upload_engine_asset_media_file_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/write/engine_asset")
          .route(web::post().to(write_engine_asset_media_file_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/write/scene_file")
          .route(web::post().to(write_scene_file_media_file_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/upload/new_scene")
          .route(web::post().to(upload_new_scene_media_file_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
  )
}
