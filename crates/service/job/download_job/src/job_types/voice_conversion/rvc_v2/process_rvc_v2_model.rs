use std::path::PathBuf;

use anyhow::anyhow;
use log::{error, info, warn};
use tempdir::TempDir;

use container_common::filesystem::check_file_exists::check_file_exists;
use container_common::filesystem::safe_delete_possible_temp_file::safe_delete_possible_temp_file;
use container_common::filesystem::safe_delete_temp_directory::safe_delete_temp_directory;
use container_common::filesystem::safe_delete_temp_file::safe_delete_temp_file;
use crockford_deprecated::crockford_entropy_lower;
use enums::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use filesys::file_size::file_size;
use jobs_common::redis_job_status_logger::RedisJobStatusLogger;
use mysql_queries::queries::generic_download::job::list_available_generic_download_jobs::AvailableDownloadJob;
use mysql_queries::queries::voice_conversion::models::insert_voice_conversion_model_from_download_job::{insert_voice_conversion_model_from_download_job, InsertVoiceConversionModelArgs};

use crate::job_loop::job_results::JobResults;
use crate::job_types::voice_conversion::rvc_v2::extract_rvc_files::{DownloadedRvcFile, extract_rvc_files};
use crate::job_types::voice_conversion::rvc_v2::rvc_v2_model_check_command::CheckArgs;
use crate::JobState;

/// Returns the token of the entity.
pub async fn process_rvc_v2_model<'a, 'b>(
  job_state: &JobState,
  job: &AvailableDownloadJob,
  temp_dir: &TempDir,
  download_filename: &str,
  redis_logger: &'a mut RedisJobStatusLogger<'b>,
) -> AnyhowResult<JobResults> {

  info!("Processing model file...");
  redis_logger.log_status("checking rvc (v2) model")?;

  // ==================== DOWNLOAD HUBERT ==================== //

  job_state.pretrained_models.rvc_v2_hubert.download_if_not_on_filesystem(
    &job_state.bucket_client,
    temp_dir,
  ).await?;

  // ==================== DETERMINE FILE CONTENTS ==================== //

  info!("Determining download file contents: {:?}", &download_filename);

  let original_download_file_path = PathBuf::from(download_filename);

  let download_contents = extract_rvc_files(&original_download_file_path, temp_dir)?;

  info!("Contents of downloaded RVC model: {:?}", &download_contents);

  let original_model_file_path;
  let maybe_original_model_index_file_path: Option<PathBuf>; // TODO RENAME MAYBE

  match download_contents {
    DownloadedRvcFile::InvalidModel => {
      return Err(anyhow!("download did not contain a valid model payload"));
    }
    DownloadedRvcFile::ModelFileOnly { model_file } => {
      info!("RVC download only contains a model (no index file).");
      original_model_file_path = model_file;
      maybe_original_model_index_file_path = None;
    }
    DownloadedRvcFile::ModelAndIndexFile { model_file, index_file } => {
      info!("RVC download contains both a model and an index file.");
      original_model_file_path = model_file;
      maybe_original_model_index_file_path = Some(index_file);
    }
  }

  // ==================== RUN MODEL CHECK ==================== //

  info!("Checking that model is valid...");

  let output_wav_path = temp_dir.path().join("output.wav");

  let model_check_result = job_state.sidecar_configs.rvc_v2_model_check_command.execute_check(CheckArgs {
    model_path: &original_model_file_path,
    maybe_model_index_path: maybe_original_model_index_file_path.as_deref(),
    hubert_path: &job_state.pretrained_models.rvc_v2_hubert.filesystem_path,
    maybe_input_path: None,
    output_path: &output_wav_path,
  });

  if let Err(e) = model_check_result {
    safe_delete_temp_file(&original_model_file_path);
    safe_delete_possible_temp_file(maybe_original_model_index_file_path.as_deref());
    safe_delete_temp_file(&output_wav_path);
    safe_delete_temp_directory(&temp_dir);
    return Err(anyhow!("model check error: {:?}", e));
  }

  // ==================== CHECK ALL FILES EXIST AND GET METADATA ==================== //

  info!("Checking that output wav file exists...");

  check_file_exists(&output_wav_path)?;

  let file_size_bytes = file_size(&original_model_file_path)?;

  // ==================== UPLOAD ORIGINAL MODEL FILE ==================== //

  info!("Uploading rvc (v2) voice conversion model to GCS...");

  let private_bucket_hash = crockford_entropy_lower(64);

  info!("Entropic bucket hash: {}", private_bucket_hash);

  let model_bucket_path = job_state.bucket_path_unifier.rvc_v2_model_path(&private_bucket_hash);

  info!("Destination bucket path (model): {:?}", &model_bucket_path);

  redis_logger.log_status("uploading rvc (v2) TTS model")?;

  if let Err(err) = job_state.bucket_client.upload_filename(&model_bucket_path, &original_model_file_path).await {
    error!("Problem uploading model file: {:?}", err);
    safe_delete_temp_file(&original_model_file_path);
    safe_delete_possible_temp_file(maybe_original_model_index_file_path.as_deref());
    safe_delete_temp_file(&output_wav_path);
    safe_delete_temp_directory(&temp_dir);
    return Err(err);
  }

  // ==================== UPLOAD ORIGINAL MODEL INDEX FILE ==================== //

  if let Some(original_index_file_path) = maybe_original_model_index_file_path.as_deref() {
    let model_index_bucket_path = job_state.bucket_path_unifier.rvc_v2_model_index_path(&private_bucket_hash);

    info!("Destination bucket path (index): {:?}", &model_index_bucket_path);

    if let Err(err) = job_state.bucket_client.upload_filename(&model_index_bucket_path, &original_index_file_path).await {
      error!("Problem uploading index file: {:?}", err);
      safe_delete_temp_file(&original_model_file_path);
      safe_delete_temp_file(&original_index_file_path);
      safe_delete_temp_file(&output_wav_path);
      safe_delete_temp_directory(&temp_dir);
      return Err(err);
    }
  }

  // ==================== DELETE DOWNLOADED FILE ==================== //

  // NB: We should be using a tempdir, but to make absolutely certain we don't overflow the disk...
  info!("Done uploading; deleting temporary files and paths...");
  safe_delete_temp_file(&original_model_file_path);
  safe_delete_possible_temp_file(maybe_original_model_index_file_path.as_deref());
  safe_delete_temp_file(&output_wav_path);
  safe_delete_temp_directory(&temp_dir);

  // ==================== SAVE RECORDS ==================== //

  info!("Saving Voice Conversion model record...");

  let (_id, model_token) = insert_voice_conversion_model_from_download_job(InsertVoiceConversionModelArgs {
    model_type: VoiceConversionModelType::RvcV2,
    title: &job.title,
    original_download_url: &job.download_url,
    original_filename: &download_filename,
    file_size_bytes,
    creator_user_token: &job.creator_user_token,
    creator_ip_address: &job.creator_ip_address,
    creator_set_visibility: Visibility::Public, // TODO: All models default to public at start
    has_index_file: maybe_original_model_index_file_path.is_some(),
    private_bucket_hash: &private_bucket_hash,
    private_bucket_object_name: "", // TODO: This should go away.
    mysql_pool: &job_state.mysql_pool,
  }).await?;

  job_state.badge_granter.maybe_grant_voice_conversion_model_uploads_badge(&job.creator_user_token)
      .await
      .map_err(|e| {
        warn!("error maybe awarding badge: {:?}", e);
        anyhow!("error maybe awarding badge")
      })?;

  Ok(JobResults {
    entity_token: Some(model_token.to_string()),
    entity_type: Some(VoiceConversionModelType::RvcV2.to_string()), // NB: This may be different from `GenericDownloadType` in the future!
  })
}

//#[cfg(test)]
//mod tests {
//  use crockford_deprecated::crockford_entropy_lower;
//
//  #[test]
//  fn temp() {
//    // need to make some hashes really quick
//    let e = crockford_entropy_lower(64);
//    assert_eq!(e, "");
//  }
//}
