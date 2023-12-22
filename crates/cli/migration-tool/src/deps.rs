use sqlx::{MySql, Pool};
use cloud_storage::bucket_client::BucketClient;

pub struct Deps {
  pub mysql_development : Pool<MySql>,
  pub mysql_production : Pool<MySql>,

  pub bucket_development_public: BucketClient,
  pub bucket_development_private: BucketClient,

  pub bucket_production_public: BucketClient,
  pub bucket_production_private: BucketClient,
}
