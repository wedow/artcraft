// NB: The following windows directive is cargo-culted from:
// https://github.com/emilk/egui/blob/master/examples/hello_world/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")] // hide console window on Windows in release

pub mod gui;
pub mod main_loop;
pub mod persistence;
pub mod shared_state;
pub mod startup_args;
pub mod web_server;
pub mod workers;

#[macro_use] extern crate serde_derive;

use actix_web::{HttpResponse, HttpServer, web};
use async_openai::Client;
use clap::{App, Arg};
use crate::gui::launch_gui::launch_gui;
use crate::main_loop::main_loop;
use crate::persistence::save_directory::SaveDirectory;
use crate::shared_state::app_control_state::AppControlState;
use crate::shared_state::job_state::JobState;
use crate::startup_args::get_startup_args;
use crate::web_server::launch_web_server::{launch_web_server, LaunchWebServerArgs};
use crate::workers::web_content_scraping::main_loop::web_content_scraping_main_loop;
use crate::workers::web_index_ingestion::main_loop::web_index_ingestion_main_loop;
use enums::by_table::web_scraping_targets::web_content_type::WebContentType;
use errors::AnyhowResult;
use log::info;
use sqlite_queries::queries::by_table::web_scraping_targets::insert_web_scraping_target::{Args, insert_web_scraping_target};
use sqlx::sqlite::SqlitePoolOptions;
use std::sync::{Arc, RwLock};
use std::thread;
use std::time::Duration;
use tokio::runtime::{Builder, Runtime};
use web_scrapers::sites::cnn::cnn_article_scraper::cnn_article_scraper;
use web_scrapers::sites::techcrunch::techcrunch_article_scraper::techcrunch_article_scraper;
use web_scrapers::sites::theguardian::theguardian_scraper::theguardian_scraper_test;
use workers::web_content_scraping::single_target::ingest_url_scrape_and_save::ingest_url_scrape_and_save;
use strum::IntoEnumIterator;

//#[tokio::main]
//pub async fn main() -> AnyhowResult<()> {
  //test().await
//}

//async fn test() -> AnyhowResult<()> {
  //let database_url = easyenv::get_env_string_required("DATABASE_URL")?;
  //let pool = SqlitePoolOptions::new()
      //.max_connections(5)
      //.connect(&database_url).await?;

  //let _ = dotenv::from_filename(".env-aichatbot-secrets").ok();
  //let startup_args = get_startup_args()?;
  //let save_directory = SaveDirectory::new(&startup_args.save_directory);

  ////let url = "https://techcrunch.com/2023/02/04/elon-musk-says-twitter-will-provide-a-free-write-only-api-to-bots-providing-good-content/";
  //let url = "https://www.cnn.com/2023/02/04/business/automakers-problems-catching-up-with-tesla/index.html";
  //ingest_url_scrape_and_save(url, WebContentType::CnnArticle, &save_directory).await?;

  //Ok(())
//}

pub const LOG_LEVEL: &'static str = concat!(
  "info,",
  "actix_web=info,",
  "sqlx::query=warn,", // SQLX logs all queries as "info", which is super spammy
  "hyper::proto::h1::io=warn,",
  "storyteller_web::threads::db_health_checker_thread::db_health_checker_thread=warn,",
  "http_server_common::request::get_request_ip=info," // Debug spams Rust logs
);

#[actix_web::main]
pub async fn main() -> AnyhowResult<()> {
  easyenv::init_all_with_default_logging(Some(LOG_LEVEL));

  // NB: Do not check this secrets-containing dotenv file into VCS.
  // This file should only contain *development* secrets, never production.
  let _ = dotenv::from_filename(".env-aichatbot-secrets").ok();

  let startup_args = get_startup_args()?;

  let app_control_state = Arc::new(AppControlState::new());

  let openai_client = Arc::new(Client::new()
      .with_api_key(startup_args.openai_secret_key.clone()));

  let save_directory = SaveDirectory::new(&startup_args.save_directory);

  let database_url = easyenv::get_env_string_required("DATABASE_URL")?;
  let pool = SqlitePoolOptions::new()
      .max_connections(5)
      .connect(&database_url).await?;

  let job_state = Arc::new(JobState {
    sqlite_pool: pool,
    save_directory: save_directory.clone(),
  });

  info!("Starting worker threads and web server...");

  let app_control_state2 = app_control_state.clone();
  let openai_client2 = openai_client.clone();
  let job_state2 = job_state.clone();
  let job_state3 = job_state.clone();

  // NB: both egui and imgui (which we aren't using) complain about launching on a non-main thread.
  // They even complain that this is impossible on Windows (and our program aims to be multiplatform)
  // Thus, we launch everything else into its own thread.
  thread::spawn(move || {
    let server_future = launch_web_server(LaunchWebServerArgs {
      app_control_state: app_control_state2,
      openai_client: openai_client2,
      save_directory,
    });

    let tokio_runtime = Builder::new_multi_thread()
        .worker_threads(4)
        .thread_name("tokio-worker")
        .thread_stack_size(3 * 1024 * 1024)
        .enable_time()
        .enable_io()
        .build()
        .unwrap();

    tokio_runtime.spawn(async {
    });

    tokio_runtime.spawn(async {
      let _r = web_index_ingestion_main_loop(job_state2).await;
    });

    tokio_runtime.spawn(async {
      let _r = web_content_scraping_main_loop(job_state3).await;
    });

    // TODO: GPT Transformation thread
    //tokio_runtime.spawn(async {
    //  // TODO...
    //});

    // TODO: FakeYou enrichment thread
    //tokio_runtime.spawn(async {
    //  // TODO...
    //});

    // TODO: Final scheduling thread
    //tokio_runtime.spawn(async {
    //  // TODO...
    //});

    let runtime = actix_web::rt::System::new();

    runtime.block_on(server_future)
  });

  info!("Starting GUI ...");

  let _r = launch_gui(startup_args.clone(), app_control_state.clone());

  Ok(())
}
