//! This service is meant to help with debugging.

use actix_http::StatusCode;
use actix_web::{App, HttpResponse, HttpServer, web};
use actix_web::middleware::{Compress, DefaultHeaders, Logger};

use actix_helpers::route_builder::RouteBuilder;
use errors::AnyhowResult;

use crate::env_args::env_args;

pub mod env_args;
pub mod handlers;

pub const DEFAULT_RUST_LOG: &str = concat!(
  "debug,",
  "actix_web=info,",
  "hyper::proto::h1::io=warn,",
  "http_server_common::request::get_request_ip=info," // Debug spams Rust logs
);

#[actix_web::main]
async fn main() -> AnyhowResult<()> {
  easyenv::init_all_with_default_logging(Some(DEFAULT_RUST_LOG));

  //let log_format = "[%{HOSTNAME}e] %a \"%r\" %s %b \"%{Referer}i\" \"%{User-Agent}i\" %T";
  let log_format = "[dummy-service] [%{HOSTNAME}e] %{X-Forwarded-For}i \"%r\" %s %b \"%{Referer}i\" \"%{User-Agent}i\" %T";

  let env_args = env_args()?;

  let server_hostname = hostname::get()
      .ok()
      .and_then(|h| h.into_string().ok())
      .unwrap_or("hostname-unknown".to_string());

  // TODO: Fix duplication for gzip compression. This is stupid.
  //  I'm too tired to figure out the generic types though.
  if env_args.enable_gzip {
    HttpServer::new(move || {
      let app = App::new()
          .wrap(Logger::new(log_format))
          .wrap(DefaultHeaders::new()
              .header("X-Backend-Hostname", &server_hostname))
          .wrap(Compress::default());

      RouteBuilder::from_app(app)
          .add_get("/", simple_handler)
          .add_get("/_status", simple_handler)
          .into_app()
          .default_service(web::route().to(simple_handler))
    })
        .bind(&env_args.bind_address)?
        .workers(env_args.num_workers)
        .run()
        .await?;
  } else {
    HttpServer::new(move || {
      let app = App::new()
          .wrap(Logger::new(log_format))
          .wrap(DefaultHeaders::new()
              .header("X-Backend-Hostname", &server_hostname));

      RouteBuilder::from_app(app)
          .add_get("/", simple_handler)
          .add_get("/_status", simple_handler)
          .into_app()
          .default_service(web::route().to(simple_handler))
    })
        .bind(&env_args.bind_address)?
        .workers(env_args.num_workers)
        .run()
        .await?;
  }

  Ok(())
}

pub async fn simple_handler() -> HttpResponse {
  HttpResponse::build(StatusCode::OK)
      .content_type("application/json; charset=utf-8")
      .body("{\"success\": true}")
}

