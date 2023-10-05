use std::path::PathBuf;

use anyhow::anyhow;
use log::{error, warn};
use sqlx::MySqlPool;
use tempdir::TempDir;

use buckets::public::media_uploads::original_file::MediaUploadOriginalFilePath;
use cloud_storage::bucket_client::BucketClient;
use jobs_common::job_progress_reporter::job_progress_reporter::JobProgressReporter;
use mysql_queries::payloads::generic_inference_args::lipsync_payload::LipsyncAnimationImageSource;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::media_uploads::get_media_upload_for_inference::get_media_upload_for_inference;
use tokens::files::media_upload::MediaUploadToken;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::util::maybe_download_file_from_bucket::maybe_download_file_from_bucket;
use crate::util::scoped_temp_dir_creator::ScopedTempDirCreator;

pub struct ImageFile {
  pub filesystem_path: PathBuf,
}

pub async fn download_image_file(
  image_source: &LipsyncAnimationImageSource,
  public_bucket_client: &BucketClient,
  job_progress_reporter: &mut Box<dyn JobProgressReporter>,
  job: &AvailableInferenceJob,
  temp_dir_creator: &ScopedTempDirCreator,
  work_temp_dir: &TempDir,
  mysql_pool: &MySqlPool,
) -> Result<ImageFile, ProcessSingleJobError> {

  let bucket_object_path;

  match image_source {
    LipsyncAnimationImageSource::F(_media_file_token) => {
      // TODO(bt, 2023-09-08): Implement
      return Err(ProcessSingleJobError::NotYetImplemented)
    }
    LipsyncAnimationImageSource::U(media_upload_token) => {
      let media_upload_token = MediaUploadToken::new_from_str(media_upload_token);
      let media_upload_result = get_media_upload_for_inference(
        &media_upload_token,
        mysql_pool
      ).await;

      let media_upload_result = match media_upload_result {
        Ok(Some(result)) => result,
        Ok(None) => {
          warn!("could not find media upload: {:?}", media_upload_token);
          return Err(ProcessSingleJobError::from_anyhow_error(
            anyhow!("could not find media upload: {:?}", media_upload_token)))
        }
        Err(e) => {
          error!("could not query media upload: {:?}", e);
          return Err(ProcessSingleJobError::from_anyhow_error(e))
        }
      };

      let media_upload_bucket_path = MediaUploadOriginalFilePath::from_object_hash(&media_upload_result.public_bucket_directory_hash);
      bucket_object_path = media_upload_bucket_path.to_full_object_pathbuf();
    }
  }

  let downloaded_filesystem_path = work_temp_dir.path().join("image.bin");

  maybe_download_file_from_bucket(
    "image file",
    &downloaded_filesystem_path,
    &bucket_object_path,
    public_bucket_client,
    job_progress_reporter,
    "downloading",
    job.id.0,
    temp_dir_creator,
  ).await?;

  Ok(ImageFile {
    filesystem_path: downloaded_filesystem_path,
  })
}
