use std::time::{Duration, Instant};

use log::{error, info, warn};

use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use errors::AnyhowResult;
use filesys::file_exists::file_exists;
use jobs_common::noop_logger::NoOpLogger;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::{AvailableInferenceJob, list_available_generic_inference_jobs, ListAvailableGenericInferenceJobArgs};
use mysql_queries::queries::generic_inference::job::mark_generic_inference_job_completely_failed::mark_generic_inference_job_completely_failed;
use mysql_queries::queries::generic_inference::job::mark_generic_inference_job_failure::mark_generic_inference_job_failure;
use opentelemetry::metrics::AsyncInstrument;

use crate::OTEL_METER_NAME;
use crate::job::job_loop::clear_full_filesystem::clear_full_filesystem;
use crate::job::job_loop::process_single_job::process_single_job;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_loop::process_single_job_success_case::ProcessSingleJobSuccessCase;
use crate::job_dependencies::JobDependencies;

use opentelemetry::{global as otel, KeyValue as OtelAttribute, metrics::Unit};

// Job runner timeouts (guards MySQL)
const START_TIMEOUT_MILLIS : u64 = 500;
const INCREASE_TIMEOUT_MILLIS : u64 = 1000;

/// Pause file millis
const PAUSE_FILE_EXISTS_WAIT_MILLIS : u64 = 1000 * 30;

/// Warn on slow batch queries
const SLOW_BATCH_QUERY_NOTICE_DURATION : Duration = Duration::from_millis(3500);

pub async fn main_loop(job_dependencies: JobDependencies) {
  let mut noop_logger = NoOpLogger::new(job_dependencies.job.system.no_op_logger_millis as i64);

  let mut error_timeout_millis = START_TIMEOUT_MILLIS;
  let mut sort_by_priority = true;
  let mut sort_by_priority_count = 0;

  while !job_dependencies.job.system.application_shutdown.get() {
    if let Some(pause_file) = job_dependencies.fs.maybe_pause_file.as_deref() {
      while file_exists(pause_file) {
        warn!("Pause file exists. Pausing until deleted: {:?}", pause_file);
        std::thread::sleep(Duration::from_millis(PAUSE_FILE_EXISTS_WAIT_MILLIS));
      }
    }

    // Don't completely starve low-priority jobs
    if sort_by_priority_count >= job_dependencies.job.system.low_priority_starvation_prevention_every_nth {
      sort_by_priority_count = 0;
      sort_by_priority = false;
    }

    let maybe_scoped_model_types = job_dependencies.job.system.scoped_execution.get_scoped_model_types();

    let batch_query_start_time = Instant::now();

    let maybe_available_jobs = list_available_generic_inference_jobs(ListAvailableGenericInferenceJobArgs {
      num_records: job_dependencies.job.system.job_batch_size,
      is_debug_worker: false, // TODO
      sort_by_priority,
      maybe_scope_by_model_type: maybe_scoped_model_types,
      maybe_scope_by_job_category: None,
      mysql_pool: &job_dependencies.db.mysql_pool,
    }).await;

    let batch_query_duration = Instant::now().duration_since(batch_query_start_time);

    if batch_query_duration > SLOW_BATCH_QUERY_NOTICE_DURATION {
      warn!("Batch query took duration: {:?}", &batch_query_duration);
    }

    sort_by_priority = true;
    sort_by_priority_count += 1;

    let jobs = match maybe_available_jobs {
      Ok(jobs) => jobs,
      Err(e) => {
        error!("Error querying jobs: {:?}", e);
        std::thread::sleep(Duration::from_millis(error_timeout_millis));
        error_timeout_millis += INCREASE_TIMEOUT_MILLIS;
        continue;
      }
    };

    if jobs.is_empty() {
      let message = format!(
        "No jobs picked up from database! Querying scoped to model types: {:?}",
        maybe_scoped_model_types);

      noop_logger.log_message_after_awhile(&message);

      std::thread::sleep(Duration::from_millis(job_dependencies.job.system.job_batch_wait_millis));
      error_timeout_millis = START_TIMEOUT_MILLIS; // reset
      continue;
    }

    info!("Queried {} jobs from database", jobs.len());

    let batch_result = process_job_batch(&job_dependencies, jobs).await;

    match batch_result {
      Ok(_) => {},
      Err(e) => {
        error!("Error processing jobs: {:?}", e);
        std::thread::sleep(Duration::from_millis(error_timeout_millis));
        error_timeout_millis += INCREASE_TIMEOUT_MILLIS;
        continue;
      }
    }

    error_timeout_millis = START_TIMEOUT_MILLIS; // reset

    std::thread::sleep(Duration::from_millis(job_dependencies.job.system.job_batch_wait_millis));
  }

  warn!("Job runner main loop is shut down.");
}

// TODO: A common interface/trait for each submodule (tts, webvc) to declare how to determine if the job is "ready".
//  This probably returns a struct or enum with some measure of how many GB need to be downloaded.

async fn process_job_batch(job_dependencies: &JobDependencies, jobs: Vec<AvailableInferenceJob>) -> AnyhowResult<()> {
  let job_count = jobs.len();
  let meter = otel::meter(OTEL_METER_NAME);
  // TODO: total_duration as histogram for min/max/avg/percentiles
  let job_duration_metric = meter.i64_observable_gauge("job_duration").with_unit(Unit::new("ms")).init();

  for (i, job) in jobs.into_iter().enumerate() {
    let start_time = Instant::now();
    let result = process_single_job(job_dependencies, &job).await;

    match result {
      Ok(success_case) => {
        info!("Job loop iteration ({i} of {job_count} batch) \"success\": {:?}", success_case);

        let increment_success_count = match success_case {
          ProcessSingleJobSuccessCase::JobCompleted => true,
          ProcessSingleJobSuccessCase::JobTemporarilySkippedFilesAbsent => false,
          ProcessSingleJobSuccessCase::JobSkippedForRoutingTagMismatch => false,
          ProcessSingleJobSuccessCase::LockNotObtained => false,
        };

        if increment_success_count {
          let stats = job_dependencies.job.info.job_stats.increment_success_count().ok();
          warn!("Success stats: {:?}", stats);
        }
      },
      Err(err) => {
        error!(
          r#"Failure to process job ({i} of {job_count} batch): {:?} -
            {:?}
          "#,job.inference_job_token, err);
        let _r = handle_error(&job_dependencies, &job, err).await?;
      }
    }
    let job_duration = Instant::now().duration_since(start_time);;
    job_duration_metric.observe(job_duration.as_millis() as i64,
      &[
        // TODO: need job_ prefix?
        OtelAttribute::new("job_id", format!("{:?}", job.id)),
        OtelAttribute::new("job_inference_category", job.inference_category.to_str()),
        OtelAttribute::new("job_inference_token", job.inference_job_token.as_str().to_owned()),
      ]
    )
  }

  Ok(())
}

#[derive(Eq,PartialEq)]
enum JobFailureClass {
  // Jobs that can be retried
  TransientFailure,
  // Jobs that cannot be retried and must be marked dead
  PermanentFailure,
}

#[derive(Eq,PartialEq)]
enum ContainerHealth {
  // No impact to container health
  Ignore,
  // Increment the container health failure counter
  IncrementContainerFailCount,
}

async fn handle_error(job_dependencies: &&JobDependencies, job: &AvailableInferenceJob, error: ProcessSingleJobError) -> AnyhowResult<()> {
  let (
    job_failure_class,
    container_health_report,
    internal_failure_reason,
    maybe_public_failure_reason, // TODO(bt,2023-10-11): Remove this column in favor of "frontend_failure_category".
    maybe_frontend_failure_category
  ) = match error {
    // Permanent failures
    ProcessSingleJobError::KeepAliveElapsed =>
      (
        JobFailureClass::PermanentFailure,
        ContainerHealth::Ignore,
        "keepalive elapsed".to_string(),
        None,
        Some(FrontendFailureCategory::KeepAliveElapsed),
      ),
    ProcessSingleJobError::InvalidJob(ref err) =>
      (
        JobFailureClass::PermanentFailure,
        ContainerHealth::Ignore,
        format!("InvalidJob: {:?}", err),
        Some("invalid job"),
        None,
      ),
    ProcessSingleJobError::NotYetImplemented =>
      (
        JobFailureClass::PermanentFailure,
        ContainerHealth::Ignore,
        "not yet implemented".to_string(),
        None,
        Some(FrontendFailureCategory::NotYetImplemented),
      ),
    ProcessSingleJobError::FaceDetectionFailure =>
      (
        JobFailureClass::PermanentFailure,
        ContainerHealth::Ignore,
        "face not detected".to_string(),
        None,
        Some(FrontendFailureCategory::FaceNotDetected),
      ),
    ProcessSingleJobError::ModelDeleted =>
      (
        JobFailureClass::PermanentFailure,
        ContainerHealth::Ignore,
        "model deleted".to_string(),
        None,
        None,
      ),
    // Non-permanent failures
    ProcessSingleJobError::FilesystemFull =>
      (
        JobFailureClass::TransientFailure,
        ContainerHealth::IncrementContainerFailCount,
        "worker filesystem full".to_string(),
        None, // User doesn't need to know the filesystem is full
        Some(FrontendFailureCategory::RetryableWorkerError),
      ),
    ProcessSingleJobError::Other(ref err) =>
      (
        JobFailureClass::TransientFailure,
        ContainerHealth::IncrementContainerFailCount,
        format!("OtherErr: {:?}", err),
        None, // Obviously don't tell the user about errors even we're not sure about
        Some(FrontendFailureCategory::RetryableWorkerError),
      ),
    ProcessSingleJobError::IoError(ref err) =>
      (
        JobFailureClass::TransientFailure,
        ContainerHealth::IncrementContainerFailCount,
        format!("IoError: {:?}", err),
        None, // Obviously don't tell the user about errors even we're not sure about
        Some(FrontendFailureCategory::RetryableWorkerError),
      ),
    ProcessSingleJobError::JobSystemMisconfiguration(ref maybe_reason) =>
      (
        JobFailureClass::TransientFailure,
        ContainerHealth::IncrementContainerFailCount,
        format!("job system misconfiguration error: {:?}", maybe_reason),
        None, // Obviously don't tell the user about errors even we're not sure about
        Some(FrontendFailureCategory::RetryableWorkerError),
      ),
  };

  if container_health_report == ContainerHealth::IncrementContainerFailCount {
    // NB: We only increment the fail count for events that may indicate the job server is stuck.
    let stats = job_dependencies.job.info.job_stats.increment_failure_count().ok();
    warn!("Failure stats: {:?}", stats);
  }

  match job_failure_class {
    JobFailureClass::PermanentFailure => {
      let _r = mark_generic_inference_job_completely_failed(
        &job_dependencies.db.mysql_pool,
        &job,
        maybe_public_failure_reason,
        Some(&internal_failure_reason),
        maybe_frontend_failure_category,
      ).await;
    }
    JobFailureClass::TransientFailure => {
      let _r = mark_generic_inference_job_failure(
        &job_dependencies.db.mysql_pool,
        &job,
        maybe_public_failure_reason,
        &internal_failure_reason,
        maybe_frontend_failure_category,
        job_dependencies.job.system.job_max_attempts
      ).await;
    }
  }

  match error {
    // Post failure handling
    ProcessSingleJobError::FilesystemFull => {
      warn!("Clearing full filesystem...");
      clear_full_filesystem(&job_dependencies.fs.semi_persistent_cache)?;
    }
    // No-op
    ProcessSingleJobError::Other(_) => {}
    ProcessSingleJobError::InvalidJob(_) => {}
    ProcessSingleJobError::KeepAliveElapsed => {}
    ProcessSingleJobError::NotYetImplemented => {}
    ProcessSingleJobError::FaceDetectionFailure => {}
    ProcessSingleJobError::JobSystemMisconfiguration(_) => {}
    ProcessSingleJobError::ModelDeleted => {}
    ProcessSingleJobError::IoError(_) => {}
  }

  Ok(())
}
