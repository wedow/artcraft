use std::time::Instant;

use anyhow::anyhow;
use log::info;

use buckets::public::media_uploads::bucket_file_path::MediaUploadOriginalFilePath;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::media_files::get_media_file_for_inference::MediaFileForInference;

use crate::job::job_loop::job_success_result::JobSuccessResult;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job_dependencies::JobDependencies;
use crate::util::maybe_download_file_from_bucket::{maybe_download_file_from_bucket, MaybeDownloadArgs};

const BUCKET_FILE_EXTENSION : &str = ".gltf";

pub struct BvhToWorkflowJobArgs<'a> {
  pub job_dependencies: &'a JobDependencies,
  pub job: &'a AvailableInferenceJob,
  pub media_file: &'a MediaFileForInference,
}

pub async fn process_job(args: BvhToWorkflowJobArgs<'_>) -> Result<JobSuccessResult, ProcessSingleJobError> {
  let job = args.job;
  let media_file = args.media_file;

  let mut job_progress_reporter = args.job_dependencies
      .clients
      .job_progress_reporter
      .new_generic_inference(job.inference_job_token.as_str())
      .map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

  // ==================== TEMP DIR ==================== //

  let work_temp_dir = format!("temp_file_convert_{}", job.id.0);

  // NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
  let work_temp_dir = args.job_dependencies
      .fs
      .scoped_temp_dir_creator_for_work
      .new_tempdir(&work_temp_dir)
      .map_err(|e| ProcessSingleJobError::from_io_error(e))?;

  // ==================== DOWNLOAD MEDIA FILE ==================== //

  info!("Download media for conversion...");

  //TODO(KS): update to match correct paths & extensions
  let original_media_upload_fs_path = {
    let original_media_upload_fs_path = work_temp_dir.path().join("original.fbx");

    let media_upload_bucket_path =
        MediaUploadOriginalFilePath::from_object_hash(&media_file.public_bucket_directory_hash);

    let bucket_object_path = media_upload_bucket_path.to_full_object_pathbuf();

    info!("Downloading media to bucket path: {:?}", &bucket_object_path);

    maybe_download_file_from_bucket(MaybeDownloadArgs {
      name_or_description_of_file: "media upload (original file)",
      final_filesystem_file_path: &original_media_upload_fs_path,
      bucket_object_path: &bucket_object_path,
      bucket_client: &args.job_dependencies.buckets.public_bucket_client,
      job_progress_reporter: &mut job_progress_reporter,
      job_progress_update_description: "downloading",
      job_id: job.id.0,
      scoped_tempdir_creator: &args.job_dependencies.fs.scoped_temp_dir_creator_for_work,
      maybe_existing_file_minimum_size_required: None,
    }).await?;

    original_media_upload_fs_path
  };

  // TODO: No duration. Replace this.
  let inference_duration = Instant::now().duration_since(Instant::now());

  /* // TODO

  // ==================== SETUP FOR CONVERSION ==================== //

  job_progress_reporter.log_status("running conversion")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  //let config_path = PathBuf::from("/models/voice_conversion/so-vits-svc/example_config.json"); // TODO: This could be variable.
  let input_wav_path = original_media_upload_fs_path;

  let output_audio_fs_path = work_temp_dir.path().join("output.wav");

  let stderr_output_file = work_temp_dir.path().join("stderr.txt");

  info!("Running VC inference...");

  info!("Expected output audio filename: {:?}", &output_audio_fs_path);

  // TODO: Limit output length for premium.

  let maybe_args = job.maybe_inference_args
      .as_ref()
      .map(|args| args.args.as_ref())
      .flatten();

  // If not specified by the user, turn off auto prediction. It sounds awful.
  let auto_predict_f0 = maybe_args
      .map(|args| match args {
        PolymorphicInferenceArgs::Tts { .. } => None,
        PolymorphicInferenceArgs::La(_) => None,
        PolymorphicInferenceArgs::Vc { auto_predict_f0, .. } => *auto_predict_f0,
        PolymorphicInferenceArgs::Rr(_) => None,
        PolymorphicInferenceArgs::Ig(_) => None,
        PolymorphicInferenceArgs::Mc(_) => None,
        PolymorphicInferenceArgs::Cu(_) => None,
      })
      .flatten()
      .unwrap_or(false);

  let maybe_transpose = maybe_args
      .map(|args| match args {
        PolymorphicInferenceArgs::Tts { .. } => None,
        PolymorphicInferenceArgs::La(_) => None,
        PolymorphicInferenceArgs::Vc { transpose, .. } => *transpose,
        PolymorphicInferenceArgs::Rr(_) => None,
        PolymorphicInferenceArgs::Ig(_) => None,
        PolymorphicInferenceArgs::Mc(_) => None,
        PolymorphicInferenceArgs::Cu(_) => None,
      })
      .flatten();

  // ==================== RUN INFERENCE SCRIPT ==================== //

  let inference_start_time = Instant::now();

  let command_exit_status = model_dependencies
      .inference_command
      .execute_inference(InferenceArgs {
        model_path: &so_vits_svc_fs_path,
        input_path: &input_wav_path,
        output_path: &output_audio_fs_path,
        stderr_output_file: &stderr_output_file,
        maybe_config_path: None,
        device: Device::Cuda,
        auto_predict_f0,
        maybe_transpose,
      });

  let inference_duration = Instant::now().duration_since(inference_start_time);

  info!("Inference took duration to complete: {:?}", &inference_duration);

  if !command_exit_status.is_success() {
    error!("Inference failed: {:?}", command_exit_status);

    let error = ProcessSingleJobError::Other(anyhow!("CommandExitStatus: {:?}", command_exit_status));

    if let Ok(contents) = read_to_string(&stderr_output_file) {
      warn!("Captured stderr output: {}", contents);

      //match categorize_error(&contents)  {
      //  Some(ProcessSingleJobError::FaceDetectionFailure) => {
      //    warn!("Face not detected in source image");
      //    error = ProcessSingleJobError::FaceDetectionFailure;
      //  }
      //  _ => {}
      //}
    }

    safe_delete_temp_file(&input_wav_path);
    safe_delete_temp_file(&output_audio_fs_path);
    safe_delete_temp_directory(&work_temp_dir);

    return Err(error);
  }

  // ==================== CHECK ALL FILES EXIST AND GET METADATA ==================== //

  info!("Checking that output files exist...");

  check_file_exists(&output_audio_fs_path).map_err(|e| ProcessSingleJobError::Other(e))?;

  info!("Interrogating result file properties...");

  let file_size_bytes = file_size(&output_audio_fs_path)
      .map_err(|err| ProcessSingleJobError::Other(err))?;

  let maybe_mimetype = get_mimetype_for_file(&output_audio_fs_path)
      .map_err(|err| ProcessSingleJobError::from_io_error(err))?
      .map(|mime| mime.to_string());

  let audio_info = decode_basic_audio_file_info(&output_audio_fs_path, maybe_mimetype.as_deref(), None)
      .map_err(|err| ProcessSingleJobError::Other(err))?;

  if audio_info.required_full_decode {
    warn!("Required a full decode of the output data to get duration! That's inefficient!");
  }

  info!("Calculating sha256...");

  let file_checksum = sha256_hash_file(&output_audio_fs_path)
      .map_err(|err| {
        ProcessSingleJobError::Other(anyhow!("Error hashing file: {:?}", err))
      })?;

  let file_metadata = FileMetadata {
    duration_millis: audio_info.duration_millis,
    mimetype: maybe_mimetype.clone(),
    file_size_bytes,
  };

  // ==================== UPLOAD AUDIO TO BUCKET ==================== //

  job_progress_reporter.log_status("uploading result")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

//  let result_bucket_location = VoiceConversionResultOriginalFilePath::generate_new();
//
//  let result_bucket_object_pathbuf = result_bucket_location.to_full_object_pathbuf();
//
//  info!("Audio destination bucket path: {:?}", &result_bucket_object_pathbuf);

  let result_bucket_location = MediaFileBucketPath::generate_new(
    Some(BUCKET_FILE_PREFIX),
    Some(BUCKET_FILE_EXTENSION));

  let result_bucket_object_pathbuf = result_bucket_location.to_full_object_pathbuf();

  info!("Audio destination bucket path: {:?}", &result_bucket_object_pathbuf);

  info!("Uploading audio media file...");

  args.job_dependencies.buckets.public_bucket_client.upload_filename_with_content_type(
    &result_bucket_object_pathbuf,
    &output_audio_fs_path,
    "audio/wav")
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  safe_delete_temp_file(&output_audio_fs_path);

  // ==================== DELETE DOWNLOADED FILE ==================== //

  // NB: We should be using a tempdir, but to make absolutely certain we don't overflow the disk...
  safe_delete_temp_directory(&work_temp_dir);

  // ==================== SAVE RECORDS ==================== //

  info!("Saving vc inference record...");

//  let (inference_result_token, id) = insert_voice_conversion_result(InsertArgs {
//    pool: &args.job_dependencies.mysql_pool,
//    job: &job,
//    public_bucket_hash: result_bucket_location.get_object_hash(),
//    file_size_bytes: file_metadata.file_size_bytes,
//    duration_millis: file_metadata.duration_millis.unwrap_or(0),
//    is_on_prem: args.job_dependencies.container.is_on_prem,
//    worker_hostname: &args.job_dependencies.container.hostname,
//    worker_cluster: &args.job_dependencies.container.cluster_name,
//    is_debug_worker: args.job_dependencies.worker_details.is_debug_worker
//  })
//      .await
//      .map_err(|e| ProcessSingleJobError::Other(e))?;

  let (inference_result_token, id) = insert_media_file_from_voice_conversion(InsertMediaFileArgs {
    pool: &args.job_dependencies.db.mysql_pool,
    job: &job,
    voice_conversion_type: VoiceConversionModelType::SoVitsSvc,
    maybe_mime_type: maybe_mimetype.as_deref(),
    file_size_bytes: file_metadata.file_size_bytes,
    duration_millis: file_metadata.duration_millis.unwrap_or(0),
    sha256_checksum: &file_checksum,
    public_bucket_directory_hash: result_bucket_location.get_object_hash(),
    maybe_public_bucket_prefix: Some(BUCKET_FILE_PREFIX),
    maybe_public_bucket_extension: Some(BUCKET_FILE_EXTENSION),
    is_on_prem: args.job_dependencies.job.info.container.is_on_prem,
    worker_hostname: &args.job_dependencies.job.info.container.hostname,
    worker_cluster: &args.job_dependencies.job.info.container.cluster_name,
  })
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  info!("VC Done.");

  // TODO: Update upstream to be strongly typed
  let maybe_user_token = job.maybe_creator_user_token.as_deref()
      .map(|token| UserToken::new_from_str(token));

  args.job_dependencies.clients.firehose_publisher.vc_inference_finished(
    maybe_user_token.as_ref(),
    &job.inference_job_token,
    inference_result_token.as_str())
      .await
      .map_err(|e| {
        error!("error publishing event: {:?}", e);
        ProcessSingleJobError::Other(anyhow!("error publishing event"))
      })?;

  job_progress_reporter.log_status("done")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  info!("Job {:?} complete success! Downloaded, ran inference, and uploaded. Saved model record: {}, Result Token: {}",
        job.id, id, &inference_result_token);

   */

  Ok(JobSuccessResult {
    //maybe_result_entity: Some(ResultEntity {
    //  entity_type: InferenceResultType::MediaFile,
    //  entity_token: inference_result_token.to_string(),
    //}),
    maybe_result_entity: None,
    inference_duration,
  })
}

#[derive(Deserialize, Default)]
struct FileMetadata {
  pub duration_millis: Option<u64>,
  pub mimetype: Option<String>,
  pub file_size_bytes: u64,
}
