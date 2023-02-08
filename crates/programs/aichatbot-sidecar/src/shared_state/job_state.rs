use std::sync::{Arc, RwLock};

use crate::persistence::save_directory::SaveDirectory;
use sqlx::{Pool, Sqlite};
use web_scrapers::sites::slashdot::slashdot_scraper::SlashdotScraper;

//#[derive(Clone)]
pub struct JobState {
  pub sqlite_pool: Pool<Sqlite>,
  pub save_directory: SaveDirectory,
  pub slashdot_scrapers: Arc<RwLock<Vec<SlashdotScraper>>>,
}

