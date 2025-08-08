use errors::AnyhowResult;
use log::{error, info};
use sqlx::migrate::MigrateError;
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode};
use sqlx::{Pool, Sqlite, SqlitePool};
use std::path::Path;

#[derive(Clone)]
pub struct TaskDbConnection {
  pool: Pool<Sqlite>,
}

impl TaskDbConnection {
  pub async fn connect_and_migrate<P: AsRef<Path>>(database_file: P) -> AnyhowResult<Self> {
    match run_migrations(&database_file).await {
      Ok(pool) => return Ok(Self { pool }),
      Err(err) => {
        error!("Error running SQLite migrations: {:?}", err);
      }
    }

    info!("Deleting and recreating SQLite database at {:?}", database_file.as_ref());

    if let Err(err) = std::fs::remove_file(&database_file) {
      error!("Error deleting SQLite database file: {:?}", err);
    }

    let pool = run_migrations(database_file).await?;

    Ok(Self { pool })
  }

  pub fn get_pool(&self) -> &Pool<Sqlite> {
    &self.pool
  }
}

async fn run_migrations<P: AsRef<Path>>(database_file: P) -> Result<SqlitePool, MigrateError> {
  let connection_options = SqliteConnectOptions::new()
      .filename(database_file)
      .create_if_missing(true)
      .journal_mode(SqliteJournalMode::Wal);

  let pool = SqlitePool::connect_with(connection_options).await?;

  // Run migrations regardless of whether the database is new, SQLx will track which migrations
  // have been run.
  // The migrations text get compiled into the binary, so no worries about build inclusion.
  // Since the task database is being treated as ephemeral, we can always run migrations without
  // worrying about previous state if we simply blow away old versions of the schema.
  sqlx::migrate!("../../../../_sql/artcraft_migrations").run(&pool).await?;

  Ok(pool)
}
