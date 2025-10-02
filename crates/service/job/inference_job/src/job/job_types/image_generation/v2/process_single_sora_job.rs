use std::time::Instant;

use anyhow::anyhow;
use bucket_paths::legacy::remote_file_manager_paths::media_descriptor::MediaImagePngDescriptor;

use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use enums::by_table::generic_synthetic_ids::id_category::IdCategory;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::PolymorphicInferenceArgs;
use mysql_queries::queries::media_files::create::generic_insert::insert_media_file_generic_from_job::{insert_media_file_generic_from_job, InsertFromJobArgs};

use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::state::job_dependencies::JobDependencies;
use crate::util::extractors::get_polymorphic_args_from_job::get_polymorphic_args_from_job;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use cloud_storage::remote_file_manager::remote_cloud_file_manager::RemoteCloudFileClient;
use composite_identifiers::by_table::batch_generations::batch_generation_entity::BatchGenerationEntity;
use errors::AnyhowResult;
use filesys::file_read_bytes::file_read_bytes;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use log::info;
use mimetypes::mimetype_for_bytes::get_mimetype_for_bytes;
use mysql_queries::queries::batch_generations::insert_batch_generation_records::{insert_batch_generation_records, InsertBatchArgs};
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use openai_sora_client::credentials::SoraCredentials;
use openai_sora_client::recipes::wait_for_image_gen_status::wait_for_image_gen_status;
use openai_sora_client::requests::image_gen::sora_job_status::{Generation, TaskStatus};
use r2d2_redis::r2d2::PooledConnection;
use r2d2_redis::redis::Commands;
use r2d2_redis::RedisConnectionManager;
use shared_service_components::sora_redis_credentials::get_sora_credentials_from_redis::get_sora_credentials_from_redis;
use std::collections::HashMap;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use tempdir::TempDir;
use tokens::tokens::batch_generations::BatchGenerationToken;
use url::Url;

const IMAGE_PREFIX : &str = "image_";
const IMAGE_SUFFIX : &str = ".png"; // TODO: Vary based on filetype.

pub struct ImageGenerationProcessArgs<'a> {
  pub job_dependencies: &'a JobDependencies,
  pub job: &'a AvailableInferenceJob,
}

pub struct ImageGenerationArgs {
  pub number_of_samples: u32,
  pub sora_task_id: String,
}

pub async fn ig_args_from_job(args: &ImageGenerationProcessArgs<'_>) -> Result<ImageGenerationArgs, ProcessSingleJobError> {
  let polymorphic_args = get_polymorphic_args_from_job(&args.job)?;

  let job_args = match polymorphic_args {
    PolymorphicInferenceArgs::Sg(args) => args,
    _ => {
      return Err(
        ProcessSingleJobError::from_anyhow_error(anyhow!("wrong inner args for job!"))
      );
    }
  };

  let number_of_samples = job_args.maybe_number_of_samples.unwrap_or(1);
  let sora_task_id = job_args.maybe_sora_task_id.clone().ok_or_else(|| ProcessSingleJobError::from_anyhow_error(anyhow!("Missing Sora Task ID")))?;

  Ok(ImageGenerationArgs {
    number_of_samples,
    sora_task_id,
  })
}

pub async fn process_single_sora_job(args: &ImageGenerationProcessArgs<'_>) -> Result<JobSuccessResult, ProcessSingleJobError> {
  let job = args.job;
  let deps = args.job_dependencies;
  let mysql_pool = &deps.db.mysql_pool;

  let ig_args = ig_args_from_job(&args).await?;

  let _job_progress_reporter = args.job_dependencies.clients.job_progress_reporter
      .new_generic_inference(job.inference_job_token.as_str())
      .map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

  //==================== TEMP DIR ==================== //
  let work_temp_dir = format!("temp_image_generation_{}", job.id.0);

  //NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
  let work_temp_dir = args.job_dependencies.fs.scoped_temp_dir_creator_for_work
      .new_tempdir(&work_temp_dir)
      .map_err(|e| ProcessSingleJobError::from_io_error(e))?;

  // thread::sleep(seconds) to check the directory

  let inference_start_time = Instant::now();

  let redis_pool = deps
    .db
    .maybe_keepalive_redis_pool
    .as_ref()
    .ok_or_else(|| ProcessSingleJobError::Other(anyhow!("failed to get redis pool")))?;

  let redis = &mut redis_pool
      .get()
      .map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

  let sora_credentials = get_sora_credentials_from_redis(redis)?;

  let sora_task_id = ig_args.sora_task_id.clone();

  let sora_task_response = wait_for_image_gen_status(
    &sora_task_id,
    &sora_credentials,
    None,
  ).await.map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

  match TaskStatus::from_str(&sora_task_response.status) {
    TaskStatus::Succeeded => {} // Success case. Fall-through.
    TaskStatus::Failed => {
      return Err(ProcessSingleJobError::Other(anyhow!("Task failed: {:?}", sora_task_response)));
    }
    _ => {
      return Err(ProcessSingleJobError::Other(anyhow!("Task not completed yet: {:?}", sora_task_response)));
    }
  }

  let generations = sora_task_response.generations;

  if generations.is_empty() {
    return Err(ProcessSingleJobError::Other(anyhow!("No generations found in task response")));
  }

  let inference_duration = Instant::now().duration_since(inference_start_time);

  let remote_cloud_file_client = &deps.buckets.public_bucket_client;

  let mut entries = vec![];

  let batch_token = BatchGenerationToken::generate();
  let mut maybe_first_media_file_token = None;

  for (i, generation) in generations.iter().enumerate() {
    info!("Downloading generation {} of {} from Sora task ID: {}", i + 1, generations.len(), &sora_task_id);

    let download_path = download_generation(&generation, &work_temp_dir).await?;

    info!("Sora image was downloaded to filesystem path: {:?}", &download_path);

    info!("Reading file bytes and metadata...");

    let bytes = file_read_bytes(&download_path)?;
    let sha256_checksum = sha256_hash_file(&download_path)?;
    let mimetype: &str = get_mimetype_for_bytes(&bytes).unwrap_or("application/octet-stream");

    let media_file_bucket_path =
        MediaFileBucketPath::generate_new(Some(IMAGE_PREFIX), Some(IMAGE_SUFFIX));

    remote_cloud_file_client.upload_filename_with_content_type(
      media_file_bucket_path.to_full_object_pathbuf(),
      &download_path,
      mimetype,
    ).await?;

    // TODO(ks: 2025-04-08): This should insert the media file token and maybe additional metadata about the generation
    let (media_file_token, _id) = insert_media_file_generic_from_job(InsertFromJobArgs {
      pool: mysql_pool,
      job,
      media_class: MediaFileClass::Image,
      media_type: MediaFileType::Png, // TODO(bt,2024-04-30): Verify that these are png images.
      origin_category: MediaFileOriginCategory::Inference,
      origin_product_category: MediaFileOriginProductCategory::ImageGeneration,
      maybe_origin_model_type: Some(MediaFileOriginModelType::StorytellerStudioImageGen),
      maybe_origin_model_token: None,
      maybe_origin_filename: None, // TODO: Need to grab this
      maybe_batch_token: Some(&batch_token),
      maybe_prompt_token: None,
      maybe_mime_type: Some(mimetype.as_ref()),
      file_size_bytes: bytes.len() as u64,
      maybe_duration_millis: Some(inference_duration.as_millis() as u64),
      maybe_audio_encoding: None,
      maybe_video_encoding: None,
      maybe_frame_width: Some(1024), // TODO: Need to grab this
      maybe_frame_height: Some(1024), // TODO: Need to grab this
      checksum_sha2: sha256_checksum.as_str(),
      maybe_text_transcript: None,
      public_bucket_directory_hash: media_file_bucket_path.get_object_hash(),
      maybe_public_bucket_prefix: media_file_bucket_path.get_optional_prefix(),
      maybe_public_bucket_extension: media_file_bucket_path.get_optional_extension(),
      maybe_extra_media_info: None,
      maybe_creator_file_synthetic_id_category: IdCategory::MediaFile,
      maybe_creator_category_synthetic_id_category: IdCategory::MediaFile,
      maybe_mod_user_token: None,
      is_generated_on_prem: false,
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

    let batch_generation_entity: BatchGenerationEntity = BatchGenerationEntity::MediaFile(
      media_file_token
    );

    entries.push(batch_generation_entity);
  }

  // TODO(bt,2024-02-22): This transaction should wrap everything
  let mut transaction = mysql_pool.begin()
      .await
      .map_err(|e| ProcessSingleJobError::from_anyhow_error(anyhow!(e)))?;

  let batch_token_result = insert_batch_generation_records(InsertBatchArgs {
   entries,
   maybe_existing_batch_token: Some(&batch_token),
   transaction: &mut transaction,
  }).await;

  let _batch_token = match batch_token_result {
   Ok(v) => { v.to_string() }
   Err(_err) => {
     return Err(
       ProcessSingleJobError::from_anyhow_error(
         anyhow!("No batch token? something has failed.")
       )
     );
   }
  };

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
  Ok(JobSuccessResult {
    inference_duration,
    maybe_result_entity: maybe_first_media_file_token.map(|media_file_token| ResultEntity {
      entity_type: InferenceResultType::MediaFile,
      entity_token: media_file_token.to_string()
    })
  })
}

async fn download_generation(generation: &Generation, tempdir: &TempDir) -> AnyhowResult<PathBuf> {
  let url = Url::parse(&generation.url)?;

  let response = reqwest::get(&generation.url).await?;
  let image_bytes = response.bytes().await?;

  let ext = url.path().split(".").last().unwrap_or("png");
  let download_filename = format!("{}.{}", generation.id, ext);
  let download_path = tempdir.path().join(download_filename);

  let mut file = File::create(&download_path)?;
  file.write_all(&image_bytes)?;

  Ok(download_path)
}
