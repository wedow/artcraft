use std::fs::read_to_string;
use std::time::Instant;

use anyhow::anyhow;
use log::{error, info, warn};

use bucket_paths::legacy::remote_file_manager_paths::media_descriptor::MediaImagePngDescriptor;
use cloud_storage::remote_file_manager::remote_cloud_file_manager::RemoteCloudFileClient;
use composite_identifiers::by_table::batch_generations::batch_generation_entity::BatchGenerationEntity;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use enums::by_table::generic_synthetic_ids::id_category::IdCategory;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::by_table::prompts::prompt_type::PromptType;
use filesys::path_to_string::path_to_string;
use mysql_queries::payloads::media_file_extra_info::inner_payloads::stable_diffusion_extra_info::StableDiffusionExtraInfo;
use mysql_queries::payloads::media_file_extra_info::media_file_extra_info::MediaFileExtraInfo;
use mysql_queries::queries::media_files::create::generic_insert::insert_media_file_generic_from_job::{insert_media_file_generic_from_job, InsertFromJobArgs};
use mysql_queries::queries::model_weights::get::get_weight::get_weight_by_token;
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::prompts::PromptToken;

use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::image_generation::v2::process_single_ig_job::{ig_args_from_job};
use openai_sora_client::image_gen::common::{ImageSize, NumImages};
use openai_sora_client::image_gen::sora_image_gen_remix::{sora_image_gen_remix, SoraImageGenRemixRequest};
use openai_sora_client::upload::upload_media_from_file::{sora_media_upload_from_file, SoraMediaUploadRequest};
use openai_sora_client::image_gen::image_gen_status::{get_image_gen_status, wait_for_image_gen_status, save_generations_to_dir};
use crate::util::redis_sora_secrets::get_sora_credentials;
use crate::util::extractors::get_polymorphic_args_from_job::get_polymorphic_args_from_job;
use crate::state::job_dependencies::JobDependencies;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
pub struct ImageGenerationProcessArgs<'a> {
  pub job_dependencies: &'a JobDependencies,
  pub job: &'a AvailableInferenceJob,
}

pub struct ImageGenerationArgs {
  pub prompt: String,
  pub number_of_samples: u32,
  pub task_id: String,
}

pub async fn ig_args_from_job(args: &ImageGenerationProcessArgs<'_>) -> Result<ImageGenerationArgs, ProcessSingleJobError> {
  let polymorphic_args = get_polymorphic_args_from_job(&args.job)?;
  Ok(ImageGenerationArgs { prompt: polymorphic_args.prompt, number_of_samples: polymorphic_args.number_of_samples, task_id: polymorphic_args.task_id })
}

pub async fn process_single_ig_job(args: &ImageGenerationProcessArgs<'_>) -> Result<JobSuccessResult, ProcessSingleJobError> {
  let job = args.job;
  let deps = args.job_dependencies;
  let mysql_pool = &deps.db.mysql_pool;

  let ig_args = ig_args_from_job(&args).await?;
  // let ig_deps: &crate::job::job_types::image_generation::v2::stable_diffusion_dependencies::StableDiffusionDependencies = match
  // &args.job_dependencies.job.job_specific_dependencies.maybe_stable_diffusion_dependencies
  // {
  //   None => {
  //     return Err(ProcessSingleJobError::Other(anyhow!("Missing Job Specific Dependencies")));
  //   }
  //   Some(val) => { val }
  // };

  let _job_progress_reporter = args.job_dependencies.clients.job_progress_reporter.new_generic_inference(job.inference_job_token.as_str()).map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

  //==================== TEMP DIR ==================== //
  let work_temp_dir = format!("temp_image_generation_{}", job.id.0);

  //NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
  let work_temp_dir = args.job_dependencies.fs.scoped_temp_dir_creator_for_work.new_tempdir(&work_temp_dir).map_err(|e| ProcessSingleJobError::from_io_error(e))?;

  // thread::sleep(seconds) to check the directory

  let stderr_output_file = work_temp_dir.path().join("sd_err.txt");
  let stdout_output_file = work_temp_dir.path().join("sd_out.txt");

  let number_of_samples = sd_args.maybe_number_of_samples.unwrap_or(20);

  let positive_prompt = prompt.clone();
  let maybe_negative_prompt = sd_args.maybe_n_prompt.clone();

  let inference_start_time = Instant::now();

  // Use the sora client to wait for the task to complete and get the resulting images.

  // let sora_credentials = get_sora_credentials_from_request(http_request);

  let sora_credentials = get_sora_credentials(&mut redis);

  if !exit_status.is_success() {
    error!("SD inference failed: {:?}", exit_status);

    let error = ProcessSingleJobError::Other(anyhow!("CommandExitStatus: {:?}", exit_status));

    if let Ok(contents) = read_to_string(&stderr_output_file) {
      warn!("Captured stderr output: {}", contents);
    }
    return Err(error);
  }

  // hack to check the directory before clean up.
  //   let thirtyMinutes = 1800;
  //   thread::sleep(Duration::from_secs(thirtyMinutes));
  // upload media and create a record.

  let inference_duration = Instant::now().duration_since(inference_start_time);

  // let mut entries = vec![];
  // let inputs = MediaFileExtraInfo::S(StableDiffusionExtraInfo {
  //   prompt: Some(prompt.clone()),
  //   cfg_scale: Some(sd_args.maybe_cfg_scale.unwrap_or(7)),
  //   negative_prompt: sd_args.maybe_n_prompt,
  //   lora_model_weight_token: Some(lora_token),
  //   lora_name: Some(lora_name),
  //   sampler: Some(sd_args.maybe_sampler.unwrap_or(String::from("Euler a"))),
  //   width: Some(sd_args.maybe_width.unwrap_or(512)),
  //   height: Some(sd_args.maybe_height.unwrap_or(512)),
  //   seed: Some(sd_args.maybe_seed.unwrap_or(1)),
  //   number_of_samples: Some(number_of_samples),
  // });

  // let batch_token = BatchGenerationToken::generate();
  // let prompt_token = PromptToken::generate();

  // let mut maybe_first_media_file_token = None;

  // for i in 0..sd_args.maybe_batch_count.unwrap_or(1) {
  //   let path = output_path.clone();

  //   let file_path = format!("{}_{}.png", path_to_string(path), i);

  //   println!("Upload File Path:{}", file_path);

  //   let metadata = remote_cloud_file_client.upload_file(
  //     Box::new(MediaImagePngDescriptor {}),
  //     file_path.as_ref(),
  //   ).await?;

  //   let bucket_details = match metadata.bucket_details {
  //     Some(val) => { val }
  //     None => {
  //       return Err(
  //         ProcessSingleJobError::from_anyhow_error(anyhow!("no VAE? thats a problem."))
  //       );
  //     }
  //   };

  // extra_file_modification_info: todo!(), // JSON ENCODED STRUCT

  // TODO(ks: 2025-04-08): This should insert the media file token and maybe additional metadata about the generation
  let (media_file_token, _id) = insert_media_file_generic_from_job(InsertFromJobArgs {
    pool: mysql_pool,
    job,
    media_class: MediaFileClass::Image,
    media_type: MediaFileType::Image, // TODO(bt,2024-04-30): This should be a specific type of image
    origin_category: MediaFileOriginCategory::Upload,
    origin_product_category: MediaFileOriginProductCategory::ImageGeneration,
    maybe_origin_model_type: Some(MediaFileOriginModelType::StableDiffusion15),
    maybe_origin_model_token: Some(sd_model_weight_token),
    maybe_origin_filename: Some(file_path),
    maybe_batch_token: Some(&batch_token),
    maybe_prompt_token: Some(&prompt_token),
    maybe_mime_type: Some(metadata.mimetype.as_ref()),
    file_size_bytes: metadata.file_size_bytes,
    maybe_duration_millis: Some(inference_duration.as_millis() as u64),
    maybe_audio_encoding: None,
    maybe_video_encoding: None,
    maybe_frame_width: Some(sd_args.maybe_width.unwrap_or(512)),
    maybe_frame_height: Some(sd_args.maybe_height.unwrap_or(512)),
    checksum_sha2: metadata.sha256_checksum.as_str(),
    maybe_text_transcript: None,
    public_bucket_directory_hash: bucket_details.object_hash.as_str(),
    maybe_public_bucket_prefix: Some(bucket_details.prefix.as_str()),
    maybe_public_bucket_extension: Some(bucket_details.suffix.as_str()),
    maybe_extra_media_info: Some(&inputs),
    maybe_creator_file_synthetic_id_category: IdCategory::MediaFile,
    maybe_creator_category_synthetic_id_category: IdCategory::ModelWeights,
    maybe_mod_user_token: None,
    is_generated_on_prem: args.job_dependencies.job.info.container.is_on_prem,
    generated_by_worker: Some(&args.job_dependencies.job.info.container.hostname),
    generated_by_cluster: Some(&args.job_dependencies.job.info.container.cluster_name),
    maybe_title: None,
    maybe_scene_source_media_file_token: None,
    is_intermediate_system_file: false,
  })
  .await?;

  if maybe_first_media_file_token.is_none() {
    maybe_first_media_file_token = Some(media_file_token.clone());
  }

  // let batch_generation_entity: BatchGenerationEntity = BatchGenerationEntity::MediaFile(
  //   media_file_token
  // );

  //   entries.push(batch_generation_entity);
  // }

  // TODO(bt,2024-02-22): This transaction should wrap everything
  let mut transaction = mysql_pool.begin().await.map_err(|e| ProcessSingleJobError::from_anyhow_error(anyhow!(e)))?;

  //let batch_token_result = insert_batch_generation_records(InsertBatchArgs {
  //  entries,
  //  maybe_existing_batch_token: Some(&batch_token),
  //  transaction: &mut transaction,
  //}).await;
  //
  //let _batch_token = match batch_token_result {
  //  Ok(v) => { v.to_string() }
  //  Err(_err) => {
  //    return Err(
  //      ProcessSingleJobError::from_anyhow_error(
  //        anyhow!("No batch token? something has failed.")
  //      )
  //    );
  //  }
  //};

  // NB: Don't fail the job if the query fails.
  // let prompt_result = insert_prompt(InsertPromptArgs {
  //   maybe_apriori_prompt_token: Some(&prompt_token),
  //   prompt_type: PromptType::StableDiffusion,
  //   maybe_creator_user_token: job.maybe_creator_user_token_typed.as_ref(),
  //   maybe_positive_prompt: Some(&positive_prompt),
  //   maybe_negative_prompt: maybe_negative_prompt.as_deref(),
  //   maybe_other_args: None, // TODO(bt,2024-02-22): Support other arguments
  //   creator_ip_address: &job.creator_ip_address,
  //   mysql_executor: &mut *transaction,
  //   phantom: Default::default(),
  // }).await;

  // match prompt_result {
  //   Ok(_token) => {}
  //   Err(err) => {
  //     error!("No prompt result token? something has failed: {:?}", err);
  //     return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("No prompt result token? something has failed.")));
  //   }
  // }

  let _r = transaction.commit().await.map_err(|e| ProcessSingleJobError::from_anyhow_error(anyhow!(e)))?;

  // TODO(bt,2024-02-12): Return the batch token instead. (We're not ready for that.)
  Ok(JobSuccessResult { inference_duration, maybe_result_entity: maybe_first_media_file_token.map(|media_file_token| ResultEntity { entity_type: InferenceResultType::MediaFile, entity_token: media_file_token.to_string() }) })
}
