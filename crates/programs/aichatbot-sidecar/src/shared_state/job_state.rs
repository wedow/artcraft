use crate::persistence::save_directory::SaveDirectory;
use sqlx::{Pool, Sqlite};

#[derive(Clone)]
pub struct JobState {
  pub sqlite_pool: Pool<Sqlite>,
  pub save_directory: SaveDirectory,
}

