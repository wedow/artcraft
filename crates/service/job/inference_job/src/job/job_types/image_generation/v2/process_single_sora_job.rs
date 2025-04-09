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
use cloud_storage::remote_file_manager::remote_cloud_file_manager::RemoteCloudFileClient;
use composite_identifiers::by_table::batch_generations::batch_generation_entity::BatchGenerationEntity;
use errors::AnyhowResult;
use mysql_queries::queries::batch_generations::insert_batch_generation_records::{insert_batch_generation_records, InsertBatchArgs};
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use openai_sora_client::credentials::SoraCredentials;
use openai_sora_client::image_gen::image_gen_status::TaskStatus;
use openai_sora_client::image_gen::wait_for_image_gen_status;
use r2d2_redis::r2d2::PooledConnection;
use r2d2_redis::redis::Commands;
use r2d2_redis::RedisConnectionManager;
use std::collections::HashMap;
use tokens::tokens::batch_generations::BatchGenerationToken;

/// Redis key
const SORA_SECRET_REDIS_KEY : &str = "sora_secret";

// Fields within the HKEY
const BEARER_SUBKEY : &str = "bearer";
const COOKIE_SUBKEY : &str = "cookie";
const SENTINEL_SUBKEY : &str = "sentinel";


/// Sora credentials stored in Redis


#[derive(Clone,Copy,Debug)]
pub enum RedisSoraCredentialSubkey {
  Bearer,
  Cookie,
  Sentinel,
}


impl RedisSoraCredentialSubkey {
  pub fn to_str(&self) -> &'static str {
    match self {
      RedisSoraCredentialSubkey::Bearer => BEARER_SUBKEY,
      RedisSoraCredentialSubkey::Cookie => COOKIE_SUBKEY,
      RedisSoraCredentialSubkey::Sentinel => SENTINEL_SUBKEY,
    }
  }
}

pub fn get_sora_credentials(
  redis: &mut PooledConnection<RedisConnectionManager>
) -> AnyhowResult<SoraCredentials> {

  let values : HashMap<String, String> = redis.hgetall(SORA_SECRET_REDIS_KEY)
    .map_err(|e| anyhow!("Failed to get Sora credentials from Redis: {}", e))?;

  let bearer = values.get(BEARER_SUBKEY);
  let cookie = values.get(COOKIE_SUBKEY);
  let sentinel = values.get(SENTINEL_SUBKEY);

  match (bearer, cookie, sentinel) {
    (Some(b), Some(c), Some(s)) => {
      Ok(
        SoraCredentials {
          bearer_token: b.to_string(),
          cookie: c.to_string(),
          sentinel: Some(s.to_string()),
        }
      )
    }
    _ => Err(anyhow!("redis sora credential values not present")),
  }
}


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




  let inference_start_time = Instant::now();

  // Use the sora client to wait for the task to complete and get the resulting images.

  // let sora_credentials = get_sora_credentials_from_request(http_request);

  let redis_pool_dep = deps
    .db
    .maybe_keepalive_redis_pool.clone();

  let redis_pool = redis_pool_dep
    .ok_or_else(|| ProcessSingleJobError::Other(anyhow!("failed to get redis pool")))?;

  let sora_credentials = get_sora_credentials(&mut redis_pool.get().map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?)?;

  let sora_task_id = ig_args.sora_task_id.clone();
  let output_path = work_temp_dir.path().join("output");


  let sora_task_response = wait_for_image_gen_status(
    &sora_task_id,
    &sora_credentials,
    None,
  ).await.map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;
  // let match TaskStatus::from_str(&task_response.status) {
  //   TaskStatus::Succeeded => {
  //   },


  let generations = match TaskStatus::from_str(&sora_task_response.status) {
    TaskStatus::Succeeded => {
      let generations = sora_task_response.generations;
      if generations.is_empty() {
        return Err(ProcessSingleJobError::Other(anyhow!("No generations found in task response")));
      }
      generations
    }
    TaskStatus::Failed => {
      return Err(ProcessSingleJobError::Other(anyhow!("Task failed: {:?}", sora_task_response)));
    }
    _ => {
      return Err(ProcessSingleJobError::Other(anyhow!("Task not completed yet: {:?}", sora_task_response)));
    }
  };

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

  let batch_token = BatchGenerationToken::generate();
  // let prompt_token = PromptToken::generate();
  let remote_cloud_file_client = RemoteCloudFileClient::get_remote_cloud_file_client().await?;
  let mut entries = vec![];

  let mut maybe_first_media_file_token = None;

  for (i, generation) in generations.iter().enumerate() {
    let path = output_path.clone();


    let file_path = format!("{}/{}.png", output_path.to_str().unwrap(), generation.id.clone());

    println!("Upload File Path:{}", file_path);

    let metadata = remote_cloud_file_client.upload_file(
      Box::new(MediaImagePngDescriptor {}),
      file_path.as_ref(),
    ).await?;

    let bucket_details = match metadata.bucket_details {
      Some(val) => { val }
      None => {
        return Err(
          ProcessSingleJobError::from_anyhow_error(anyhow!("no VAE? thats a problem."))
        );
      }
    };

  // extra_file_modification_info: todo!(), // JSON ENCODED STRUCT

  // TODO(ks: 2025-04-08): This should insert the media file token and maybe additional metadata about the generation
  let (media_file_token, _id) = insert_media_file_generic_from_job(InsertFromJobArgs {
    pool: mysql_pool,
    job,
    media_class: MediaFileClass::Image,
    media_type: MediaFileType::Image, // TODO(bt,2024-04-30): This should be a specific type of image
    origin_category: MediaFileOriginCategory::Inference,
    origin_product_category: MediaFileOriginProductCategory::ImageGeneration,
    maybe_origin_model_type: Some(MediaFileOriginModelType::StorytellerStudioImageGen),
    maybe_origin_model_token: None,
    maybe_origin_filename: Some(file_path),
    maybe_batch_token: Some(&batch_token),
    maybe_prompt_token: None,
    maybe_mime_type: Some(metadata.mimetype.as_ref()),
    file_size_bytes: metadata.file_size_bytes,
    maybe_duration_millis: Some(inference_duration.as_millis() as u64),
    maybe_audio_encoding: None,
    maybe_video_encoding: None,
    maybe_frame_width: Some(1024),
    maybe_frame_height: Some(1024),
    checksum_sha2: metadata.sha256_checksum.as_str(),
    maybe_text_transcript: None,
    public_bucket_directory_hash: bucket_details.object_hash.as_str(),
    maybe_public_bucket_prefix: Some(bucket_details.prefix.as_str()),
    maybe_public_bucket_extension: Some(bucket_details.suffix.as_str()),
    maybe_extra_media_info: None,
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

  let batch_generation_entity: BatchGenerationEntity = BatchGenerationEntity::MediaFile(
    media_file_token
  );

    entries.push(batch_generation_entity);
  }

  // TODO(bt,2024-02-22): This transaction should wrap everything
  let mut transaction = mysql_pool.begin().await.map_err(|e| ProcessSingleJobError::from_anyhow_error(anyhow!(e)))?;

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
  Ok(JobSuccessResult { inference_duration, maybe_result_entity: maybe_first_media_file_token.map(|media_file_token| ResultEntity { entity_type: InferenceResultType::MediaFile, entity_token: media_file_token.to_string() }) })
}
