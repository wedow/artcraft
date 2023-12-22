use log::info;
use tokio::time::Duration;

use async_trait::async_trait;
use errors::AnyhowResult;

use crate::bucket_client::BucketClient;
use crate::remote_file_manager::file_meta_data::FileMetaData;

#[async_trait]
pub trait BucketOrchestrationCore {
    async fn download_file_to_disk(
        &self,
        object_path: String,
        filesystem_path: String,
        is_public: bool,
    ) -> AnyhowResult<()>;

    async fn upload_file_with_content_type_process(&self, object_name: &str,
                                                   bytes: &[u8],
                                                   content_type: &str,
                                                   is_public: bool) -> AnyhowResult<()>;

}


pub struct BucketOrchestration {
    access_key: String,
    secret_key: String,
    region_name: String,
    public_bucket_name: String,
    private_bucket_name: String,
}

#[async_trait]
impl BucketOrchestrationCore for BucketOrchestration {
    async fn download_file_to_disk(
        &self,
        object_path: String,
        filesystem_path: String,
        is_public: bool,
    ) -> AnyhowResult<()> {
        let bucket_client = self.get_bucket_with_visbility(is_public).await?;
        bucket_client.download_file_to_disk(object_path, filesystem_path).await
    }

    async fn upload_file_with_content_type_process(&self, object_name: &str,
                                                   bytes: &[u8],
                                                   content_type: &str,
                                                   is_public: bool) -> AnyhowResult<()> {
        let bucket_client = self.get_bucket_with_visbility(is_public).await?;
        bucket_client.upload_file_with_content_type_process(
            object_name,
            bytes,
            content_type,
        ).await
    }
}

impl BucketOrchestration {
    pub fn new_bucket_client_from_existing_env() -> AnyhowResult<Self> {
        let access_key = easyenv::get_env_string_required("ACCESS_KEY")?;
        let secret_key = easyenv::get_env_string_required("SECRET_KEY")?;

        let region_name = easyenv::get_env_string_required("REGION_NAME")?;
        let public_bucket_name = easyenv::get_env_string_required("PUBLIC_BUCKET_NAME")?;
        let private_bucket_name = easyenv::get_env_string_required("PRIVATE_BUCKET_NAME")?;


        let bucket_orchestration = BucketOrchestration::new(
            access_key,
            secret_key,
            region_name,
            public_bucket_name,
            private_bucket_name,
        );

        Ok(bucket_orchestration)
    }

    pub fn new(
        access_key: String,
        secret_key: String,
        region_name: String,
        public_bucket_name: String,
        private_bucket_name: String) -> Self {
        Self {
            access_key: access_key,
            secret_key: secret_key,
            region_name: region_name,
            public_bucket_name: public_bucket_name,
            private_bucket_name: private_bucket_name,
        }
    }


    async fn get_bucket_with_visbility(&self, public: bool) -> AnyhowResult<BucketClient> {
        let bucket_timeout = easyenv::get_env_duration_seconds_or_default(
            "BUCKET_TIMEOUT_SECONDS", Duration::from_secs(60 * 10));
        let bucket_client: BucketClient;
        if public {
            // use public bucket client
            info!("Configuring public GCS bucket...");
            bucket_client = BucketClient::create(
                &self.access_key,
                &self.secret_key,
                &self.region_name,
                &self.public_bucket_name,
                None,
                Some(bucket_timeout),
            )?;
        } else {
            info!("Configuring private GCS bucket...");
            bucket_client = BucketClient::create(
                &self.access_key,
                &self.secret_key,
                &self.region_name,
                &self.private_bucket_name,
                None,
                Some(bucket_timeout),
            )?;
        }
        Ok(bucket_client)
    }
}

#[cfg(test)]
mod tests {
    #[test]
    pub fn test() {}
}