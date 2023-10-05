use std::path::PathBuf;
use std::time::Instant;

use anyhow::anyhow;
use log::{error, info, warn};

use buckets::public::media_uploads::original_file::MediaUploadOriginalFilePath;
use buckets::public::voice_conversion_results::original_file::VoiceConversionResultOriginalFilePath;
use container_common::filesystem::check_file_exists::check_file_exists;
use container_common::filesystem::safe_delete_temp_directory::safe_delete_temp_directory;
use container_common::filesystem::safe_delete_temp_file::safe_delete_temp_file;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use filesys::create_dir_all_if_missing::create_dir_all_if_missing;
use filesys::file_size::file_size;
use media::decode_basic_audio_info::decode_basic_audio_file_info;
use mimetypes::mimetype_for_file::get_mimetype_for_file;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::media_uploads::get_media_upload_for_inference::MediaUploadRecordForInference;
use mysql_queries::queries::voice_conversion::inference::get_voice_conversion_model_for_inference::VoiceConversionModelForInference;
use mysql_queries::queries::voice_conversion::results::insert_voice_conversion_result::{insert_voice_conversion_result, InsertArgs};
use tokens::files::media_upload::MediaUploadToken;
use tokens::users::user::UserToken;

use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::vc::rvc_v2::rvc_v2_inference_command::InferenceArgs;
use crate::job_dependencies::JobDependencies;
use crate::util::maybe_download_file_from_bucket::maybe_download_file_from_bucket;

pub struct RvcV2ProcessJobArgs<'a> {
  pub job_dependencies: &'a JobDependencies,
  pub job: &'a AvailableInferenceJob,
  pub vc_model: &'a VoiceConversionModelForInference,
  pub media_upload_token: &'a MediaUploadToken,
  pub media_upload: &'a MediaUploadRecordForInference,
}

pub async fn process_job(args: RvcV2ProcessJobArgs<'_>) -> Result<JobSuccessResult, ProcessSingleJobError> {
  let job = args.job;
  let vc_model = args.vc_model;

  let mut job_progress_reporter = args.job_dependencies
      .job_progress_reporter
      .new_generic_inference(job.inference_job_token.as_str())
      .map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

  // ==================== DOWNLOAD HUBERT ==================== //

  info!("Download RVC hubert model (if not present)...");

  args.job_dependencies.pretrained_models.rvc_v2_hubert.download_if_not_on_filesystem(
    &args.job_dependencies.private_bucket_client,
    &args.job_dependencies.fs.scoped_temp_dir_creator_for_downloads)
      .await
      .map_err(|e| {
        error!("could not download hubert: {:?}", e);
        ProcessSingleJobError::from_anyhow_error(e)
      })?;

  // ==================== CONFIRM OR DOWNLOAD RVC (v2) MODEL ==================== //

  info!("Download RVC model (if not present)...");

  let rvc_v2_model_fs_path = {
    let filename = format!("{}.pt", vc_model.token.as_str());
    let fs_path = args.job_dependencies.fs.semi_persistent_cache.voice_conversion_model_path(&filename);

    create_dir_all_if_missing(args.job_dependencies.fs.semi_persistent_cache.voice_conversion_model_directory())
        .map_err(|e| {
          error!("could not create model storage directory: {:?}", e);
          ProcessSingleJobError::from_io_error(e)
        })?;

    let model_object_path = args.job_dependencies.bucket_path_unifier.rvc_v2_model_path(&vc_model.private_bucket_hash);

    maybe_download_file_from_bucket(
      "rvc (v2) model",
      &fs_path,
      &model_object_path,
      &args.job_dependencies.private_bucket_client,
      &mut job_progress_reporter,
      "downloading rvc (v2) model",
      job.id.0,
      &args.job_dependencies.fs.scoped_temp_dir_creator_for_downloads,
    ).await?;

    fs_path
  };

  // ==================== CONFIRM OR DOWNLOAD RVC (v2) MODEL INDICES ==================== //

  // Index files are optional
  let mut maybe_rvc_v2_model_index_fs_path: Option<PathBuf> = None;

  if vc_model.has_index_file {
    info!("Download RVC index (if not present)...");

    maybe_rvc_v2_model_index_fs_path = {
      let filename = format!("{}.index", vc_model.token.as_str());
      let fs_path = args.job_dependencies.fs.semi_persistent_cache.voice_conversion_model_path(&filename);

      create_dir_all_if_missing(args.job_dependencies.fs.semi_persistent_cache.voice_conversion_model_directory())
          .map_err(|e| {
            error!("could not create model storage directory: {:?}", e);
            ProcessSingleJobError::from_io_error(e)
          })?;

      let model_index_object_path = args.job_dependencies.bucket_path_unifier.rvc_v2_model_index_path(&vc_model.private_bucket_hash);

      maybe_download_file_from_bucket(
        "rvc (v2) model index",
        &fs_path,
        &model_index_object_path,
        &args.job_dependencies.private_bucket_client,
        &mut job_progress_reporter,
        "downloading rvc (v2) model index",
        job.id.0,
        &args.job_dependencies.fs.scoped_temp_dir_creator_for_downloads,
      ).await?;

      Some(fs_path)
    };
  }

  // ==================== TEMP DIR ==================== //

  let work_temp_dir = format!("temp_rvc_v2_inference_{}", job.id.0);

  // NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
  let work_temp_dir = args.job_dependencies
      .fs
      .scoped_temp_dir_creator_for_work
      .new_tempdir(&work_temp_dir)
      .map_err(ProcessSingleJobError::from_io_error)?;

  // ==================== DOWNLOAD MEDIA FILE ==================== //

  info!("Download media for RVC voice conversion...");

  // TODO: If already transcoded, download the transcoded file instead.
  // TODO: Turn this into a general utility.

  let original_media_upload_fs_path = {
    let original_media_upload_fs_path = work_temp_dir.path().join("original.bin");

    let media_upload_bucket_path =
        MediaUploadOriginalFilePath::from_object_hash(&args.media_upload.public_bucket_directory_hash);

    let bucket_object_path = media_upload_bucket_path.to_full_object_pathbuf();

    info!("Downloading media from bucket path: {:?}", &bucket_object_path);

    maybe_download_file_from_bucket(
      "media upload (original file)",
      &original_media_upload_fs_path,
      &bucket_object_path,
      &args.job_dependencies.public_bucket_client,
      &mut job_progress_reporter,
      "downloading",
      job.id.0,
      &args.job_dependencies.fs.scoped_temp_dir_creator_for_work,
    ).await?;

    original_media_upload_fs_path
  };

  // ==================== TRANSCODE MEDIA (IF NECESSARY) ==================== //

  // TODO

  // ==================== SETUP FOR INFERENCE ==================== //

  info!("Ready for RVC (v2) inference...");

  job_progress_reporter.log_status("running inference")
      .map_err(ProcessSingleJobError::Other)?;

  //let config_path = PathBuf::from("/models/voice_conversion/so-vits-svc/example_config.json"); // TODO: This could be variable.
  let input_wav_path = original_media_upload_fs_path;

  let output_audio_fs_path = work_temp_dir.path().join("output.wav");
  //let output_metadata_fs_path = temp_dir.path().join("metadata.json");
  //let output_spectrogram_fs_path = temp_dir.path().join("spectrogram.json");

  info!("Running RVC (v2) VC inference...");

  info!("Expected output audio filename: {:?}", &output_audio_fs_path);

  // TODO: Limit output length for premium.

  let _maybe_args = job.maybe_inference_args
      .as_ref()
      .and_then(|args| args.args.as_ref());

  // ==================== RUN INFERENCE SCRIPT ==================== //

  let inference_start_time = Instant::now();

  let command_exit_status = args.job_dependencies
      .job_type_details
      .rvc_v2
      .inference_command
      .execute_inference(InferenceArgs {
        model_path: &rvc_v2_model_fs_path,
        maybe_model_index_path: maybe_rvc_v2_model_index_fs_path,
        hubert_path: &args.job_dependencies.pretrained_models.rvc_v2_hubert.filesystem_path,
        input_path: &input_wav_path,
        output_path: &output_audio_fs_path,
      });

  let inference_duration = Instant::now().duration_since(inference_start_time);

  info!("Inference took duration to complete: {:?}", &inference_duration);

  if !command_exit_status.is_success() {
    error!("Inference failed: {:?}", command_exit_status);
    safe_delete_temp_file(&input_wav_path);
    safe_delete_temp_file(&output_audio_fs_path);
    safe_delete_temp_directory(&work_temp_dir);
    return Err(ProcessSingleJobError::Other(anyhow!("CommandExitStatus: {:?}", command_exit_status)));
  }

  // ==================== CHECK ALL FILES EXIST AND GET METADATA ==================== //

  info!("Checking that output files exist...");

  check_file_exists(&output_audio_fs_path).map_err(ProcessSingleJobError::Other)?;
  //check_file_exists(&output_metadata_fs_path).map_err(|e| ProcessSingleJobError::Other(e))?;
  //check_file_exists(&output_spectrogram_fs_path).map_err(|e| ProcessSingleJobError::Other(e))?;

  info!("Interrogating result file properties...");

  let file_size_bytes = file_size(&output_audio_fs_path)
      .map_err(ProcessSingleJobError::Other)?;

  let maybe_mimetype = get_mimetype_for_file(&output_audio_fs_path)
      .map_err(ProcessSingleJobError::from_io_error)?
      .map(|mime| mime.to_string());

  let audio_info = decode_basic_audio_file_info(&output_audio_fs_path, maybe_mimetype.as_deref(), None)
      .map_err(ProcessSingleJobError::Other)?;

  if audio_info.required_full_decode {
    warn!("Required a full decode of the output data to get duration! That's inefficient!");
  }

  // TODO: Make a new python image that generates spectrograms from any audio file.

  let file_metadata = FileMetadata {
    duration_millis: audio_info.duration_millis,
    mimetype: maybe_mimetype,
    file_size_bytes,
  };

  //safe_delete_temp_file(&output_metadata_fs_path);

  // ==================== UPLOAD AUDIO TO BUCKET ==================== //

  job_progress_reporter.log_status("uploading result")
      .map_err(ProcessSingleJobError::Other)?;

  let result_bucket_location = VoiceConversionResultOriginalFilePath::generate_new();

  let result_bucket_object_pathbuf = result_bucket_location.to_full_object_pathbuf();

  info!("Audio destination bucket path: {:?}", &result_bucket_object_pathbuf);

  info!("Uploading audio...");

  args.job_dependencies.public_bucket_client.upload_filename_with_content_type(
    &result_bucket_object_pathbuf,
    &output_audio_fs_path,
    "audio/wav")
      .await
      .map_err(ProcessSingleJobError::Other)?;

  safe_delete_temp_file(&output_audio_fs_path);

//  // ==================== UPLOAD SPECTROGRAM TO BUCKETS ==================== //
//
//  let spectrogram_result_object_path = args.job_dependencies.bucket_path_unifier.tts_inference_spectrogram_output_path(
//    &job.uuid_idempotency_token); // TODO: Don't use this!
//
//  info!("Spectrogram destination bucket path: {:?}", &spectrogram_result_object_path);
//
//  info!("Uploading spectrogram...");
//
//  args.job_dependencies.public_bucket_client.upload_filename_with_content_type(
//    &spectrogram_result_object_path,
//    &output_spectrogram_fs_path,
//    "application/json")
//      .await
//      .map_err(|e| ProcessSingleJobError::Other(e))?;
//
//  safe_delete_temp_file(&output_spectrogram_fs_path);

  // ==================== DELETE DOWNLOADED FILE ==================== //

  // NB: We should be using a tempdir, but to make absolutely certain we don't overflow the disk...
  safe_delete_temp_directory(&work_temp_dir);

  // ==================== SAVE RECORDS ==================== //

  info!("Saving vc inference record...");

  let (inference_result_token, id) = insert_voice_conversion_result(InsertArgs {
    pool: &args.job_dependencies.mysql_pool,
    job,
    public_bucket_hash: result_bucket_location.get_object_hash(),
    file_size_bytes: file_metadata.file_size_bytes,
    duration_millis: file_metadata.duration_millis.unwrap_or(0),
    is_on_prem: args.job_dependencies.container.is_on_prem,
    worker_hostname: &args.job_dependencies.container.hostname,
    worker_cluster: &args.job_dependencies.container.cluster_name,
    is_debug_worker: args.job_dependencies.worker_details.is_debug_worker
  })
      .await
      .map_err(ProcessSingleJobError::Other)?;

  info!("VC Done.");

  // TODO: Update upstream to be strongly typed
  let maybe_user_token = job.maybe_creator_user_token.as_deref()
      .map(UserToken::new_from_str);

  args.job_dependencies.firehose_publisher.vc_inference_finished(
    maybe_user_token.as_ref(),
    &job.inference_job_token,
    inference_result_token.as_str())
      .await
      .map_err(|e| {
        error!("error publishing event: {:?}", e);
        ProcessSingleJobError::Other(anyhow!("error publishing event"))
      })?;

  job_progress_reporter.log_status("done")
      .map_err(ProcessSingleJobError::Other)?;

  info!("Job {:?} complete success! Downloaded, ran inference, and uploaded. Saved model record: {}, Result Token: {}",
        job.id, id, &inference_result_token);

  Ok(JobSuccessResult {
    maybe_result_entity: Some(ResultEntity {
      entity_type: InferenceResultType::VoiceConversion,
      entity_token: inference_result_token.to_string(),
    }),
    inference_duration,
  })
}

#[derive(Deserialize, Default)]
struct FileMetadata {
  pub duration_millis: Option<u64>,
  pub mimetype: Option<String>,
  pub file_size_bytes: u64,
}
