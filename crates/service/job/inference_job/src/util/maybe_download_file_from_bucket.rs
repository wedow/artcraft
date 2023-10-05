use std::path::Path;

use log::{info, warn};

use cloud_storage::bucket_client::BucketClient;
use container_common::filesystem::safe_delete_temp_directory::safe_delete_temp_directory;
use jobs_common::job_progress_reporter::job_progress_reporter::JobProgressReporter;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::util::scoped_temp_dir_creator::ScopedTempDirCreator;

// TODO(bt, 2022-07-15): Make a concrete type for bucket paths

pub async fn maybe_download_file_from_bucket(
  name_or_description_of_file: &str,
  file_path: &Path,
  bucket_object_path: &Path,
  bucket_client: &BucketClient,
  job_progress_reporter: &mut Box<dyn JobProgressReporter>,
  job_progress_update_description: &str,
  job_id: i64,
  scoped_tempdir_creator: &ScopedTempDirCreator,
) -> Result<(), ProcessSingleJobError> {

  if file_path.exists() {
    // TODO(bt, 2022-07-15): Check signature of file
    return Ok(())
  }

  warn!("{} does not exist at path: {:?}", name_or_description_of_file, &file_path);

  job_progress_reporter.log_status(job_progress_update_description)
      .map_err(ProcessSingleJobError::Other)?;

  // NB: Download to temp directory to stop concurrent writes and race conditions from other
  // workers writing to a shared volume.
  let temp_dir = format!("temp_download_{}", job_id);

  // NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
  let temp_dir = scoped_tempdir_creator.new_tempdir(&temp_dir)
      .map_err(ProcessSingleJobError::from_io_error)?;

  let temp_path = temp_dir.path().join("download.part");

  info!("Downloading {} from bucket path: {:?}", name_or_description_of_file, &bucket_object_path);

  bucket_client.download_file_to_disk(&bucket_object_path, &temp_path)
      .await
      .map_err(|e| {
        safe_delete_temp_directory(&temp_dir);
        ProcessSingleJobError::Other(e)
      })?;

  info!("Downloaded {} from bucket!", name_or_description_of_file);

  info!("Renaming {} temp file from {:?} to {:?}!",
    name_or_description_of_file, &temp_path, &file_path);

  std::fs::rename(&temp_path, file_path)
      .map_err(|e| {
        safe_delete_temp_directory(&temp_dir);
        ProcessSingleJobError::from_io_error(e)
      })?;

  info!("Finished downloading {} file to {:?}", name_or_description_of_file, &file_path);

  safe_delete_temp_directory(&temp_dir);

  Ok(())
}