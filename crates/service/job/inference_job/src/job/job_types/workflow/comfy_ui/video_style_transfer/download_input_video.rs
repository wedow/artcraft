use anyhow::anyhow;
use log::{error, info};
use sqlx::MySqlPool;

use buckets::public::media_files::bucket_file_path::MediaFileBucketPath;
use cloud_storage::remote_file_manager::remote_cloud_file_manager::RemoteCloudFileClient;
use filesys::path_to_string::path_to_string;
use mysql_queries::queries::media_files::get::get_media_file::{get_media_file, MediaFile};
use videos::ffprobe_get_dimensions::ffprobe_get_dimensions;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::workflow::comfy_ui::video_style_transfer::video_paths::VideoPaths;
use crate::job::job_types::workflow::comfy_ui::video_style_transfer::validate_job::JobArgs;

pub struct VideoDownloadDetails {
  pub input_video_media_file: MediaFile,
}

pub struct DownloadInputVideoArgs<'a> {
  pub job_args: &'a JobArgs<'a>,
  pub videos: &'a VideoPaths,
  pub mysql_pool: &'a MySqlPool,
  pub remote_cloud_file_client: &'a RemoteCloudFileClient,
}

pub async fn download_input_video(
  args: DownloadInputVideoArgs<'_>
) -> Result<VideoDownloadDetails, ProcessSingleJobError> {

  let input_media_file_token = match args.job_args.maybe_input_file {
    None => return Err(ProcessSingleJobError::InvalidJob(anyhow!("No input video file provided"))),
    Some(token) => token.clone(),
  };

  info!("Querying input media file by token: {:?} ...", &input_media_file_token);

  let mut input_media_file =  get_media_file(
    &input_media_file_token,
    false,
    args.mysql_pool
  ).await?.ok_or_else(|| {
    error!("input media_file not found: {:?}", &input_media_file_token);
    ProcessSingleJobError::Other(anyhow!("input media_file not found: {:?}", &input_media_file_token))
  })?;

  if let Some(source_media_file_token) = &input_media_file.maybe_style_transfer_source_media_file_token {
    // NB: We do this to avoid deep-frying the video.
    // This also lets us hide the engine renders from users.
    // This shouldn't ever become a deeply nested tree of children, but rather a single root
    // with potentially many direct children.
    // TODO(bt,2024-05-14): Perhaps fail open and use the first media file if the original
    //  isn't found?
    info!("Looking up original style transfer source media file...");
    input_media_file =  get_media_file(
      &source_media_file_token,
      true, // NB: In case the original was deleted, allow this to continue.
      args.mysql_pool
    ).await?.ok_or_else(|| {
      error!("source input media_file not found: {:?}", &input_media_file_token);
      ProcessSingleJobError::Other(anyhow!("source input media_file not found: {:?}",
        &input_media_file_token))
    })?;
  }

  let media_file_bucket_path = MediaFileBucketPath::from_object_hash(
    &input_media_file.public_bucket_directory_hash,
    input_media_file.maybe_public_bucket_prefix.as_deref(),
    input_media_file.maybe_public_bucket_extension.as_deref());

  info!("Input media file cloud bucket path: {:?}", media_file_bucket_path.get_full_object_path_str());

  info!("Downloading input file to {:?}", args.videos.original_video_path);

  args.remote_cloud_file_client.download_media_file(
    &media_file_bucket_path,
    path_to_string(&args.videos.original_video_path)
  ).await?;

  info!("Downloaded video!");

  Ok(VideoDownloadDetails {
    input_video_media_file: input_media_file,
  })
}
