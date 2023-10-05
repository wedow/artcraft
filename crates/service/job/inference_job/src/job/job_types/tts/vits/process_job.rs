use std::fs::File;
use std::io::Read;
use std::path::PathBuf;
use std::time::Instant;

use anyhow::anyhow;
use log::{error, info};
use tempdir::TempDir;

use container_common::filesystem::check_file_exists::check_file_exists;
use container_common::filesystem::safe_delete_temp_directory::safe_delete_temp_directory;
use container_common::filesystem::safe_delete_temp_file::safe_delete_temp_file;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use errors::AnyhowResult;
use hashing::sha256::sha256_hash_string::sha256_hash_string;
use mysql_queries::column_types::vocoder_type::VocoderType;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::tts::tts_models::get_tts_model_for_inference_improved::TtsModelForInferenceRecord;
use mysql_queries::queries::tts::tts_results::insert_tts_result::{insert_tts_result, JobType};

use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::tts::vits::vits_inference_command::{Device, VitsInferenceArgs};
use crate::job_dependencies::JobDependencies;
use crate::util::maybe_download_file_from_bucket::maybe_download_file_from_bucket;

/// Text starting with this will be treated as a test request.
/// This allows the request to bypass the model cache and query the latest TTS model.
const TEST_REQUEST_TEXT: &str = "This is a test request.";


pub struct VitsProcessJobArgs<'a> {
  pub job_dependencies: &'a JobDependencies,
  pub job: &'a AvailableInferenceJob,
  pub tts_model: &'a TtsModelForInferenceRecord,
  pub raw_inference_text: &'a str,
}

pub async fn process_job(args: VitsProcessJobArgs<'_>) -> Result<JobSuccessResult, ProcessSingleJobError> {
  let job = args.job;
  let tts_model = args.tts_model;
  let raw_inference_text = args.raw_inference_text;

  let mut job_progress_reporter = args.job_dependencies
      .job_progress_reporter
      .new_generic_inference(job.inference_job_token.as_str())
      .map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

  // ==================== CONFIRM OR DOWNLOAD VITS DEPENDENCIES ==================== //

  // TODO: Currently VITS downloads models from HuggingFace. This is likely a risk in that they can move.
  //  We'll need to address this and save these in our own cloud storage.

  // ==================== CONFIRM OR DOWNLOAD VITS SYNTHESIZER MODEL ==================== //

  let vits_traced_synthesizer_fs_path = {
    let vits_traced_synthesizer_fs_path = args.job_dependencies.fs.semi_persistent_cache.tts_synthesizer_model_path(tts_model.model_token.as_str());

    // NB: We're using traced models, not the original model files.
    // We generate these at time of upload from the original model files.
    // In the future we may need to "repair" broken models.
    let vits_traced_synthesizer_object_path  = args.job_dependencies.bucket_path_unifier.tts_traced_synthesizer_path(&tts_model.private_bucket_hash);

    maybe_download_file_from_bucket(
      "vits traced tts model",
      &vits_traced_synthesizer_fs_path,
      &vits_traced_synthesizer_object_path,
      &args.job_dependencies.private_bucket_client,
      &mut job_progress_reporter,
      "downloading synthesizer",
      job.id.0,
      &args.job_dependencies.fs.scoped_temp_dir_creator_for_downloads,
    ).await?;

    vits_traced_synthesizer_fs_path
  };

  // ==================== Preprocess text ==================== //

  // TODO: Do we need to clean the text?
  //let cleaned_inference_text = clean_symbols(raw_inference_text);
  let cleaned_inference_text = raw_inference_text.to_string();

  // ==================== WRITE TEXT TO FILE ==================== //

  info!("Creating tempdir for inference results.");

  let temp_dir = format!("temp_vits_tts_inference_{}", job.id.0);

  // NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
  let temp_dir = TempDir::new(&temp_dir)
      .map_err(ProcessSingleJobError::from_io_error)?;

  let text_input_fs_path = temp_dir.path().join("inference_input.txt");

  std::fs::write(&text_input_fs_path, &cleaned_inference_text)
      .map_err(ProcessSingleJobError::from_io_error)?;

  // ==================== SETUP FOR INFERENCE ==================== //

  job_progress_reporter.log_status("running inference")
      .map_err(ProcessSingleJobError::Other)?;

  let output_audio_fs_path = temp_dir.path().join("output.wav");
  let output_metadata_fs_path = temp_dir.path().join("metadata.json");
  //let output_spectrogram_fs_path = temp_dir.path().join("spectrogram.json");

  info!("Running TTS inference...");

  info!("Expected output audio filename: {:?}", &output_audio_fs_path);
  info!("Expected output metadata filename: {:?}", &output_metadata_fs_path);
  //info!("Expected output spectrogram filename: {:?}", &output_spectrogram_fs_path);

  // TODO: Limit output length for premium.
  // NB: Tacotron operates on decoder steps. 1000 steps is the default and correlates to
  //  roughly 12 seconds max. Here we map seconds to decoder steps.
  //let max_decoder_steps = seconds_to_decoder_steps(job.max_duration_seconds);


  // ==================== RUN INFERENCE SCRIPT ==================== //

  let config_path = PathBuf::from("configs/ljs_li44_tmbert_nmp_s1_arpa.json"); // TODO: This could be variable.

  let inference_start_time = Instant::now();

  let _r = args.job_dependencies.job_type_details.vits.inference_command.execute_inference(VitsInferenceArgs {
    model_checkpoint_path: &vits_traced_synthesizer_fs_path,
    config_path: &config_path,
    device: Device::Cuda,
    input_text_filename: &text_input_fs_path,
    output_audio_filename: &output_audio_fs_path,
    output_metadata_filename: &output_metadata_fs_path,
  });

  let inference_duration = Instant::now().duration_since(inference_start_time);

  info!("Inference took duration to complete: {:?}", &inference_duration);

  // ==================== CHECK ALL FILES EXIST AND GET METADATA ==================== //

  info!("Checking that output files exist...");

  check_file_exists(&output_audio_fs_path).map_err(ProcessSingleJobError::Other)?;
  check_file_exists(&output_metadata_fs_path).map_err(ProcessSingleJobError::Other)?;
  //check_file_exists(&output_spectrogram_fs_path).map_err(|e| ProcessSingleJobError::Other(e))?;

  let file_metadata = read_metadata_file(&output_metadata_fs_path)
      .map_err(ProcessSingleJobError::Other)?;

  safe_delete_temp_file(&output_metadata_fs_path);

  // ==================== UPLOAD AUDIO TO BUCKET ==================== //

  job_progress_reporter.log_status("uploading result")
      .map_err(ProcessSingleJobError::Other)?;

  let audio_result_object_path = args.job_dependencies.bucket_path_unifier.tts_inference_wav_audio_output_path(
    &job.uuid_idempotency_token); // TODO: Don't use this!

  info!("Audio destination bucket path: {:?}", &audio_result_object_path);

  info!("Uploading audio...");

  args.job_dependencies.public_bucket_client.upload_filename_with_content_type(
    &audio_result_object_path,
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
  safe_delete_temp_directory(&temp_dir);

  // ==================== SAVE RECORDS ==================== //

  let text_hash = sha256_hash_string(&cleaned_inference_text)
      .map_err(ProcessSingleJobError::Other)?;

  info!("Saving tts inference record...");

  // NB: The stupid DB field for spectrograms is not nullable, so we'll just set empty string.
  let fake_spectrogram_path = PathBuf::from("");
  const NO_PRETRAINED_VOCODER : Option<VocoderType> = None;

  let (id, inference_result_token) = insert_tts_result(
    &args.job_dependencies.mysql_pool,
    JobType::GenericInferenceJob(job),
    &text_hash,
    NO_PRETRAINED_VOCODER,
    &audio_result_object_path,
    &fake_spectrogram_path, // NB: No spectogram!
    file_metadata.file_size_bytes,
    file_metadata.duration_millis.unwrap_or(0),
    args.job_dependencies.container.is_on_prem,
    &args.job_dependencies.container.hostname,
    args.job_dependencies.worker_details.is_debug_worker)
      .await
      .map_err(ProcessSingleJobError::Other)?;

  info!("TTS Done. Original text was: {:?}", &job.maybe_raw_inference_text);

  args.job_dependencies.firehose_publisher.tts_inference_finished(
    job.maybe_creator_user_token.as_deref(),
    tts_model.model_token.as_str(),
    &inference_result_token)
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
      entity_type: InferenceResultType::TextToSpeech,
      entity_token: inference_result_token
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

fn read_metadata_file(filename: &PathBuf) -> AnyhowResult<FileMetadata> {
  let mut file = File::open(filename)?;
  let mut buffer = String::new();
  file.read_to_string(&mut buffer)?;
  Ok(serde_json::from_str(&buffer)?)
}
