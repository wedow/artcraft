use anyhow::anyhow;
use crate::job::job_loop::determine_dependency_status::determine_dependency_status;
use crate::job::job_loop::job_success_result::ResultEntity;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_loop::process_single_job_success_case::ProcessSingleJobSuccessCase;
use crate::job::job_types::tts::process_single_tts_job::process_single_tts_job;
use crate::job::job_types::vc::process_single_vc_job::process_single_vc_job;
use crate::job_dependencies::JobDependencies;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::generic_inference::job::mark_generic_inference_job_pending_and_grab_lock::mark_generic_inference_job_pending_and_grab_lock;
use mysql_queries::queries::generic_inference::job::mark_generic_inference_job_successfully_done::mark_generic_inference_job_successfully_done;
use r2d2_redis::redis::Commands;
use redis_common::redis_keys::RedisKeys;
use std::time::Instant;
use crate::job::job_types::lipsync::process_single_lipsync_job::process_single_lipsync_job;

pub async fn process_single_job(
  job_dependencies: &JobDependencies,
  job: &AvailableInferenceJob,
) -> Result<ProcessSingleJobSuccessCase, ProcessSingleJobError> {
  let mut force_execution = false;

  // Some jobs have "routing tags". These ensure that jobs only execute on certain hosts.
  // This is typically for debugging or development.
  if let Some(routing_tag) = job.maybe_routing_tag.as_deref() {
    let routing_tag = routing_tag.to_lowercase();
    let hostname = job_dependencies.container.hostname.to_ascii_lowercase();

    if hostname.starts_with(&routing_tag) {
      info!("Job has routing tag ({}) for execution on this host ({})", routing_tag, hostname);
      force_execution = true;
    } else {
      info!("Job routing tag ({}) doesn't match hostname ({}); skipping...", routing_tag, hostname);
      return Ok(ProcessSingleJobSuccessCase::JobSkippedForRoutingTagMismatch);
    }
  }

  // TODO(bt,2023-07-23): Re-review the following. It looks sus.
  // TODO(bt,2023-07-23): Re-review the following. It looks sus.
  // TODO(bt,2023-07-23): Re-review the following. It looks sus.
  // TODO(bt,2023-07-23): Re-review the following. It looks sus.
  let dependency_status = determine_dependency_status(job_dependencies, job)
      .await
      .map_err(|err| ProcessSingleJobError::Other(anyhow!("database or cache error: {:?}", err)))?;

  if !force_execution && !dependency_status.models_already_on_filesystem {
    match dependency_status.maybe_model_token {
      None => {} // No model token, proceed
      Some(model_token) => {
        let count = job_dependencies
            .caches
            .model_cache_counter
            .increment_count(&model_token)
            .map_err(|err| ProcessSingleJobError::Other(anyhow!("cache counter increment error: {:?}", err)))?;

        if count < job_dependencies.cold_filesystem_cache_starvation_threshold {
          warn!("model file is not present in the filesystem cache: {:?}, skipping iteration # {} (will continue after {})",
            model_token, count, job_dependencies.cold_filesystem_cache_starvation_threshold);
          return Ok(ProcessSingleJobSuccessCase::JobTemporarilySkippedFilesAbsent);
        }
      }
    }
  }

  // ==================== ATTEMPT TO GRAB JOB LOCK ==================== //

  let lock_acquired = mark_generic_inference_job_pending_and_grab_lock(
    &job_dependencies.mysql_pool,
    job.id,
    &job_dependencies.container_db,
  ).await
      .map_err(|err| ProcessSingleJobError::Other(anyhow!("database error: {:?}", err)))?;

  if !lock_acquired {
    warn!("Could not acquire job lock for: {}", &job.id.0);
    return Ok(ProcessSingleJobSuccessCase::LockNotObtained)
  }

  process_single_job_wrap_with_logs(job_dependencies, job).await
}

async fn process_single_job_wrap_with_logs(
  job_dependencies: &JobDependencies,
  job: &AvailableInferenceJob,
) -> Result<ProcessSingleJobSuccessCase, ProcessSingleJobError> {

  println!("\n  ----------------------------------------- JOB START -----------------------------------------  \n");

  info!("Beginning work on job ({}): {:?}", job.id.0, job.inference_job_token);
  info!("Job category: {:?}", job.inference_category);
  info!("Job model type: {:?}", job.maybe_model_type);
  info!("Job model token: {:?}", job.maybe_model_token);

  let result = do_process_single_job(job_dependencies, job).await;

  println!("\n  ----------------------------------------- JOB END -----------------------------------------  \n");

  result
}

async fn do_process_single_job(
  job_dependencies: &JobDependencies,
  job: &AvailableInferenceJob,
) -> Result<ProcessSingleJobSuccessCase, ProcessSingleJobError> {

  // TODO(bt, 2023-07-23): Redis pool management probably belongs at near the outermost loop.
  let mut maybe_keepalive_redis = job_dependencies
      .maybe_keepalive_redis_pool
      .as_ref()
      .map(|redis| redis.get())
      .transpose()
      .map_err(|err| ProcessSingleJobError::Other(anyhow!("redis pool error: {:?}", err)))?;

  // TODO(bt, 2023-01-11): Restore an optional status logger
  //let mut redis_logger = RedisJobStatusLogger::new_generic_download(&mut redis, job.download_job_token.as_str());

  let job_start_time = Instant::now();

  // ==================== HANDLE KEEPALIVE (OPTIONAL) ==================== //

  if job.is_keepalive_required {
    match &mut maybe_keepalive_redis {
      None => {
        warn!("Keepalive is required for this job, but we do not have Redis configured to check!")
      }
      Some(redis) => {
        let keepalive_key =
            RedisKeys::generic_inference_keepalive(job.inference_job_token.as_str());

        let _ : Option<String> = match redis.get(&keepalive_key) {
          Ok(None) => {
            // NB: There's a chance that we're racing the keepalive function.
            // As a second check, we'll compare the database clock versus the `created_at`.
            // If the delta is small, we'll allow it.
            let delta = job.database_clock.signed_duration_since(job.created_at);
            let delta = delta.num_seconds();

            if delta < 60 && delta > -60 {
              warn!("could not get redis keepalive, but time was within delta seconds: {}", delta);
              None // Allow it
            } else {
              warn!("Job keepalive elapsed: {:?}", job.inference_job_token);
              return Err(ProcessSingleJobError::KeepAliveElapsed)
            }
          },
          Ok(Some(value)) => Some(value),
          Err(e) => {
            error!("redis keepalive key check error: {:?}", e);
            None // Fail open
          },
        };
      }
    }
  }

  // ==================== SETUP TEMP DIRS ==================== //

  let temp_dir = format!("temp_{}", job.id.0);
  let temp_dir = job_dependencies.fs.scoped_temp_dir_creator_for_downloads.new_tempdir(&temp_dir)
      .map_err(|err| ProcessSingleJobError::Other(anyhow!("filesystem error: {:?}", err)))?;

  let _p = temp_dir.path(); // TODO: Just so the build doesn't complain about unused. Remove.

  // ==================== HANDLE DIFFERENT INFERENCE TYPES ==================== //

  let mut maybe_result_entity : Option<ResultEntity>;

  let job_success_result = match job.inference_category {
    InferenceCategory::LipsyncAnimation => {
      process_single_lipsync_job(job_dependencies, job).await?
    }
    InferenceCategory::TextToSpeech => {
      process_single_tts_job(job_dependencies, job).await?
    }
    InferenceCategory::VoiceConversion => {
      process_single_vc_job(job_dependencies, job).await?
    }
  };

  let maybe_entity_type = job_success_result.maybe_result_entity
      .as_ref()
      .map(|result_entity| result_entity.entity_type);

  let maybe_entity_token = job_success_result.maybe_result_entity
      .as_ref()
      .map(|result_entity| result_entity.entity_token.as_str());

  // =====================================================

  let job_duration = Instant::now().duration_since(job_start_time);
  let inference_duration = job_success_result.inference_duration;

  info!("Job inference took duration to complete: {:?}", &inference_duration);
  info!("Job took duration to complete: {:?}", &job_duration);

  info!("Marking job complete...");

  mark_generic_inference_job_successfully_done(
    &job_dependencies.mysql_pool,
    job,
    maybe_entity_type,
    maybe_entity_token,
    job_duration,
    inference_duration,
  ).await
      .map_err(|err| ProcessSingleJobError::Other(anyhow!("database error: {:?}", err)))?;

  info!("Saved model record: {} - {}", job.id.0, &job.inference_job_token);

  // TODO(bt, 2023-01-11): Need to publish that the job finished.
  //  Publish the *correct type* of event.
  //job_dependencies.firehose_publisher.publish_generic_download_finished(
  //  &job.maybe_creator_user_token,
  //  entity_token.as_deref())
  //    .await
  //    .map_err(|e| {
  //      warn!("error publishing event: {:?}", e);
  //      anyhow!("error publishing event")
  //    })?;

  // TODO(bt, 2023-01-11): Restore optional Redis logging
  //redis_logger.log_status("done")?;

  info!("Job done: {} : {:?}", job.id.0, job.inference_job_token);

  Ok(ProcessSingleJobSuccessCase::JobCompleted)
}
