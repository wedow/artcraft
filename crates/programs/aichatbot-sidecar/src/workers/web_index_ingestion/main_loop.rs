use crate::shared_state::job_state::JobState;
use errors::AnyhowResult;
use log::{error, info};
use sqlite_queries::queries::by_table::web_scraping_targets::insert_web_scraping_target::{Args, insert_web_scraping_target};
use sqlx::sqlite::SqlitePoolOptions;
use std::future::Future;
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use strum::IntoEnumIterator;
use web_scrapers::payloads::web_scraping_result::ScrapedWebArticle;
use web_scrapers::payloads::web_scraping_target::WebScrapingTarget;
use web_scrapers::sites::cnn::cnn_indexer::{cnn_indexer, CnnFeed};
use web_scrapers::sites::techcrunch::techcrunch_indexer::{techcrunch_indexer, TechcrunchFeed};

/// Download RSS feeds and index pages to determine which articles and content will be scraped (async/downstream of this)
pub async fn web_index_ingestion_main_loop(job_state: Arc<JobState>) {
  loop {
    info!("web_index_ingestion main loop");

    match single_iteration(&job_state).await {
      Ok(_) => {
        info!("web_index_ingestion loop finished; waiting...");
        thread::sleep(Duration::from_secs(300))
      },
      Err(err) => {
        error!("web_index_ingestion - error with indexing: {:?}", err);
        thread::sleep(Duration::from_secs(60));
      }
    }
  }
}

async fn single_iteration(job_state: &Arc<JobState>) -> AnyhowResult<()> {

  // CNN
  for variant in CnnFeed::iter() {
    let index_targets = cnn_indexer(variant).await?;
    insert_targets(job_state, &index_targets).await?;
    thread::sleep(Duration::from_secs(2));
  }

  // TechCrunch
  for variant in TechcrunchFeed::iter() {
    let index_targets = techcrunch_indexer(variant).await?;
    insert_targets(job_state, &index_targets).await?;
    thread::sleep(Duration::from_secs(2));
  }

  Ok(())
}

async fn insert_targets(job_state: &Arc<JobState>, targets: &Vec<WebScrapingTarget>) -> AnyhowResult<()> {
  for target in targets.iter() {
    let _r = insert_web_scraping_target(Args {
      canonical_url: &target.canonical_url,
      web_content_type: target.web_content_type,
      maybe_title: target.maybe_title.as_deref(),
      maybe_article_full_image_url: target.maybe_full_image_url.as_deref(),
      maybe_article_thumbnail_image_url: target.maybe_thumbnail_image_url.as_deref(),
      sqlite_pool: &job_state.sqlite_pool,
    }).await;
  }

  Ok(())
}
