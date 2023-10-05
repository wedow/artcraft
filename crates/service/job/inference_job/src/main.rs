// Never allow these
#![forbid(private_in_public)]
#![forbid(unused_must_use)] // NB: It's unsafe to not close/check some things

// Okay to toggle
//#![forbid(unreachable_patterns)]
//#![forbid(unused_imports)]
//#![forbid(unused_mut)]
//#![forbid(unused_variables)]

// Always allow
#![allow(dead_code)]
#![allow(non_snake_case)]

// Strict AF
//#![forbid(warnings)]

#[macro_use] extern crate serde_derive;

use std::path::PathBuf;
use std::time::Duration;

use log::{info, warn};
use r2d2_redis::r2d2;
use r2d2_redis::RedisConnectionManager;
use sqlx::mysql::MySqlPoolOptions;

use bootstrap::bootstrap::{bootstrap, BootstrapArgs};
use cloud_storage::bucket_client::BucketClient;
use cloud_storage::bucket_path_unifier::BucketPathUnifier;
use concurrency::relaxed_atomic_bool::RelaxedAtomicBool;
use config::common_env::CommonEnv;
use config::shared_constants::DEFAULT_MYSQL_CONNECTION_STRING;
use config::shared_constants::DEFAULT_RUST_LOG;
use container_common::anyhow_result::AnyhowResult;
use container_common::filesystem::check_directory_exists::check_directory_exists;
use filesys::create_dir_all_if_missing::create_dir_all_if_missing;
use jobs_common::job_progress_reporter::job_progress_reporter::JobProgressReporterBuilder;
use jobs_common::job_progress_reporter::noop_job_progress_reporter::NoOpJobProgressReporterBuilder;
use jobs_common::job_progress_reporter::redis_job_progress_reporter::RedisJobProgressReporterBuilder;
use jobs_common::job_stats::JobStats;
use jobs_common::semi_persistent_cache_dir::SemiPersistentCacheDir;
use memory_caching::multi_item_ttl_cache::MultiItemTtlCache;
use memory_caching::ttl_key_counter::TtlKeyCounter;
use mysql_queries::common_inputs::container_environment_arg::ContainerEnvironmentArg;
use mysql_queries::mediators::firehose_publisher::FirehosePublisher;
use newrelic_telemetry::ClientBuilder;
use subprocess_common::docker_options::{DockerEnvVar, DockerFilesystemMount, DockerGpu, DockerOptions};

use crate::http_server::run_http_server::CreateServerArgs;
use crate::http_server::run_http_server::launch_http_server;
use crate::job::job_loop::main_loop::main_loop;
use crate::job::job_types::lipsync::sad_talker::model_downloaders::SadTalkerDownloaders;
use crate::job::job_types::lipsync::sad_talker::sad_talker_inference_command::SadTalkerInferenceCommand;
use crate::job::job_types::tts::tacotron2_v2_early_fakeyou::tacotron2_inference_command::Tacotron2InferenceCommand;
use crate::job::job_types::tts::vits::vits_inference_command::VitsInferenceCommand;
use crate::job::job_types::vc::rvc_v2::pretrained_hubert_model::PretrainedHubertModel;
use crate::job::job_types::vc::rvc_v2::rvc_v2_inference_command::RvcV2InferenceCommand;
use crate::job::job_types::vc::so_vits_svc::so_vits_svc_inference_command::SoVitsSvcInferenceCommand;
use crate::job_dependencies::{FileSystemDetails, JobCaches, JobDependencies, JobTypeDetails, JobWorkerDetails, PretrainedModels, RvcV2Details, SadTalkerDetails, SoVitsSvcDetails, Tacotron2VocodesDetails, VitsDetails};
use crate::util::common_commands::ffmpeg_logo_watermark_command::FfmpegLogoWatermarkCommand;
use crate::util::scoped_execution::ScopedExecution;
use crate::util::scoped_temp_dir_creator::ScopedTempDirCreator;

pub mod http_server;
pub mod job;
pub mod job_dependencies;
pub mod util;

// Buckets (shared config)
const ENV_ACCESS_KEY : &str = "ACCESS_KEY";
const ENV_SECRET_KEY : &str = "SECRET_KEY";
const ENV_REGION_NAME : &str = "REGION_NAME";

// Bucket names
const ENV_PRIVATE_BUCKET_NAME : &str = "PRIVATE_BUCKET_NAME";
const ENV_PUBLIC_BUCKET_NAME : &str = "PUBLIC_BUCKET_NAME";

// HTTP sidecar
const ENV_TTS_INFERENCE_SIDECAR_HOSTNAME: &str = "TTS_INFERENCE_SIDECAR_HOSTNAME";

//#[tokio::main]
#[actix_web::main]
async fn main() -> AnyhowResult<()> {

  let container_environment = bootstrap(BootstrapArgs {
    app_name: "inference-job",
    default_logging_override: Some(DEFAULT_RUST_LOG),
    config_search_directories: &[".", "./config", "crates/service/job/inference_job/config"],
  })?;

  info!("Hostname: {}", &container_environment.hostname);

  // NB: These are non-standard env vars we're injecting ourselves.
  let _k8s_node_name = easyenv::get_env_string_optional("K8S_NODE_NAME");
  let _k8s_pod_name = easyenv::get_env_string_optional("K8S_POD_NAME");

  // Bucket stuff (shared)
  let access_key = easyenv::get_env_string_required(ENV_ACCESS_KEY)?;
  let secret_key = easyenv::get_env_string_required(ENV_SECRET_KEY)?;
  let region_name = easyenv::get_env_string_required(ENV_REGION_NAME)?;

  // Private and Public Buckets
  let private_bucket_name = easyenv::get_env_string_required(ENV_PRIVATE_BUCKET_NAME)?;
  let public_bucket_name = easyenv::get_env_string_required(ENV_PUBLIC_BUCKET_NAME)?;

  let bucket_timeout = easyenv::get_env_duration_seconds_or_default("BUCKET_TIMEOUT_SECONDS",
    Duration::from_secs(60 * 5));

  let private_bucket_client = BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &private_bucket_name,
    None,
    Some(bucket_timeout),
  )?;

  let public_bucket_client = BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &public_bucket_name,
    None,
    Some(bucket_timeout),
  )?;

  // Where we download models and resources to (typically a shared NFS volume in prod).
  let temp_directory_downloads = easyenv::get_env_pathbuf_or_default(
    "TEMP_DIR_DOWNLOADS",
    PathBuf::from("/tmp/downloads")
  );

  // Where we store scratch files for workloads (temporary processing).
  let temp_directory_work = easyenv::get_env_pathbuf_or_default(
    "TEMP_DIR_WORK",
    PathBuf::from("/tmp/work")
  );

  if !container_environment.server_environment.is_deployed_in_production() {
    warn!("Creating temporary directories for non-production / development only!");
    create_dir_all_if_missing(&temp_directory_downloads)?;
    create_dir_all_if_missing(&temp_directory_work)?;
  }

  check_directory_exists(&temp_directory_downloads)?;
  check_directory_exists(&temp_directory_work)?;

  let semi_persistent_cache =
      SemiPersistentCacheDir::configured_root(&temp_directory_downloads);

  // TODO(bt,2023.05.22): create_all_paths() for some subset of jobs.
  info!("Creating pod semi-persistent cache dirs...");
  semi_persistent_cache.create_custom_vocoder_model_path()?;
  semi_persistent_cache.create_tts_pretrained_vocoder_model_path()?;
  semi_persistent_cache.create_tts_synthesizer_model_path()?;
  semi_persistent_cache.create_voice_conversion_model_path()?;

  let db_connection_string =
      easyenv::get_env_string_or_default(
        "MYSQL_URL",
        DEFAULT_MYSQL_CONNECTION_STRING);

  info!("Connecting to database...");

  let mysql_pool = MySqlPoolOptions::new()
      .max_connections(2)
      .connect(&db_connection_string)
      .await?;

  let common_env = CommonEnv::read_from_env()?;

  let waveglow_vocoder_model_filename = easyenv::get_env_string_or_default(
    "TTS_WAVEGLOW_VOCODER_MODEL_FILENAME", "waveglow.pth");

  let hifigan_vocoder_model_filename = easyenv::get_env_string_or_default(
    "TTS_HIFIGAN_VOCODER_MODEL_FILENAME", "hifigan.pth");

  let hifigan_superres_vocoder_model_filename = easyenv::get_env_string_or_default(
    "TTS_HIFIGAN_SUPERRES_VOCODER_MODEL_FILENAME", "hifigan_superres.pth");

  let sidecar_max_synthesizer_models = easyenv::get_env_num(
    "SIDECAR_MAX_SYNTHESIZER_MODELS", 3)?;

  // Set to "0" to always treat low priority the same as high priority
  let low_priority_starvation_prevention_every_nth= easyenv::get_env_num(
    "LOW_PRIORITY_STARVATION_PREVENTION_EVERY_NTH", 3)?;

  let firehose_publisher = FirehosePublisher {
    mysql_pool: mysql_pool.clone(), // NB: MySqlPool is clone/send/sync safe
  };

  let license_key = easyenv::get_env_string_required("NEWRELIC_API_KEY")?;

  let newrelic_disabled = easyenv::get_env_bool_or_default("IS_NEWRELIC_DISABLED", false);

  let newrelic_client = ClientBuilder::new(&license_key).build().unwrap();

  let maybe_minimum_priority = easyenv::get_env_string_optional("MAYBE_MINIMUM_PRIORITY")
      .map(|priority_string| {
        priority_string.parse::<u8>()
      })
      .transpose()?;

  info!("Using 'MAYBE_MINIMUM_PRIORITY' of {:?}", maybe_minimum_priority);

  let is_debug_worker = easyenv::get_env_bool_or_default("IS_DEBUG_WORKER", false);

  info!("Is debug worker? {}", is_debug_worker);

  // Optionally report job progress to the user via Redis (for now)
  // We want to turn this off in the on-premises workers since we're not tunneling to the production Redis.
  

  let job_progress_reporter : Box<dyn JobProgressReporterBuilder> = match easyenv::get_env_string_optional("REDIS_FOR_JOB_PROGRESS") {
    None => {
      warn!("Redis for job progress status reports is DISABLED! Users will not see in-flight details of inference progress.");
      Box::new(NoOpJobProgressReporterBuilder {})
    },
    Some(redis_connection_string) => {
      info!("Connecting to Redis to use for reporting job progress... {}", redis_connection_string);
      let redis_manager = RedisConnectionManager::new(redis_connection_string)?;
      let redis_pool = r2d2::Pool::builder().build(redis_manager)?;

      Box::new(RedisJobProgressReporterBuilder::from_redis_pool(redis_pool))
    }
  };

  let maybe_keepalive_redis_pool =
      match easyenv::get_env_string_optional("REDIS_FOR_KEEPALIVE_URL") {
        None => None,
        Some(redis_url) => {
          let redis_manager = RedisConnectionManager::new(redis_url)?;
          let redis_pool = r2d2::Pool::builder().build(redis_manager)?;
          Some(redis_pool)
        }
      };

  // NB: Threading eats the Ctrl-C signal, so we're going to send application shutdown across
  // threads with an atomic bool.
  let application_shutdown = RelaxedAtomicBool::new(false);

  let job_stats = JobStats::new();

  let create_server_args = CreateServerArgs {
    container_environment: container_environment.clone(),
    job_stats: job_stats.clone(),
  };

  let job_dependencies = JobDependencies {
    scoped_execution: ScopedExecution::new_from_env()?,
    fs: FileSystemDetails {
      temp_directory_downloads: temp_directory_downloads.clone(),
      temp_directory_work: temp_directory_work.clone(),
      maybe_pause_file: easyenv::get_env_pathbuf_optional("PAUSE_FILE"),
      scoped_temp_dir_creator_for_downloads: ScopedTempDirCreator::for_directory(&temp_directory_downloads),
      scoped_temp_dir_creator_for_work: ScopedTempDirCreator::for_directory(&temp_directory_work),
      semi_persistent_cache,
    },
    mysql_pool,
    maybe_redis_pool: None, // TODO(bt, 2023-01-11): See note in JobDependencies
    maybe_keepalive_redis_pool,
    job_progress_reporter,
    public_bucket_client,
    private_bucket_client,
    job_stats,
    newrelic_client,
    newrelic_disabled,
    worker_details: JobWorkerDetails {
      is_debug_worker,
    },
    caches: JobCaches {
      tts_model_record_cache: MultiItemTtlCache::create_with_duration(
        easyenv::get_env_duration_seconds_or_default(
          "TTS_MODEL_RECORD_CACHE_SECONDS",
          Duration::from_secs(60*5)
        ),
      ),
      vc_model_record_cache: MultiItemTtlCache::create_with_duration(
        easyenv::get_env_duration_seconds_or_default(
        "VC_MODEL_RECORD_CACHE_SECONDS",
        Duration::from_secs(60)
        ),
      ),
      model_cache_counter: TtlKeyCounter::create_with_duration(
        easyenv::get_env_duration_seconds_or_default(
          "TTL_KEY_COUNTER_CACHE_SECONDS",
          Duration::from_secs(60 * 5)
        ),
      ),
    },
    cold_filesystem_cache_starvation_threshold:
      easyenv::get_env_num("COLD_FILESYSTEM_CACHE_STARVATION_THRESHOLD", 3)?,
    bucket_path_unifier: BucketPathUnifier::default_paths(),
    firehose_publisher,
    job_batch_wait_millis: common_env.job_batch_wait_millis,
    job_max_attempts: common_env.job_max_attempts as u16,
    job_batch_size: common_env.job_batch_size,
    no_op_logger_millis: common_env.no_op_logger_millis,
    sidecar_max_synthesizer_models,
    low_priority_starvation_prevention_every_nth,
    maybe_minimum_priority,
    job_type_details: JobTypeDetails {
      tacotron2_old_vocodes: Tacotron2VocodesDetails {
        inference_command: Tacotron2InferenceCommand::from_env()?,
        waveglow_vocoder_model_filename,
        hifigan_vocoder_model_filename,
        hifigan_superres_vocoder_model_filename,
      },
      vits: VitsDetails {
        inference_command: vits_inference_command()?,
      },
      so_vits_svc: SoVitsSvcDetails {
        inference_command: SoVitsSvcInferenceCommand::from_env()?,
      },
      rvc_v2: RvcV2Details {
        inference_command: RvcV2InferenceCommand::from_env()?,
      },
      sad_talker: SadTalkerDetails {
        downloaders: SadTalkerDownloaders::build_all_from_env(),
        inference_command: SadTalkerInferenceCommand::from_env()?,
        ffmpeg_watermark_command: FfmpegLogoWatermarkCommand::from_env()?,
      },
    },
    pretrained_models: PretrainedModels {
      rvc_v2_hubert: PretrainedHubertModel::from_env(),
    },
    container: container_environment.clone(),
    container_db: ContainerEnvironmentArg {
      hostname: container_environment.hostname,
      cluster_name: container_environment.cluster_name,
    },
    application_shutdown: application_shutdown.clone(),
  };

  std::thread::spawn(move || {
    let actix_runtime = actix_web::rt::System::new();
    let http_server_handle = launch_http_server(create_server_args);

    actix_runtime.block_on(http_server_handle)
        .expect("HTTP server should not exit.");

    warn!("Server thread is shut down.");
    application_shutdown.set(true);
  });

  main_loop(job_dependencies).await;

  Ok(())
}

fn vits_inference_command() -> AnyhowResult<VitsInferenceCommand> {
  let root_directory = easyenv::get_env_string_required(
    "VITS_INFERENCE_ROOT_DIRECTORY")?;

  let inference_script = easyenv::get_env_string_or_default(
    "VITS_INFERENCE_SCRIPT",
    "infer_ts_job.py");

  let maybe_venv_command = easyenv::get_env_string_optional(
    "VITS_INFERENCE_MAYBE_VENV_COMMAND");

  let maybe_python_interpreter = easyenv::get_env_string_optional(
    "VITS_INFERENCE_MAYBE_PYTHON_INTERPRETER");

  let maybe_huggingface_dataset_cache = easyenv::get_env_string_optional(
    "HF_DATASETS_CACHE");

  let maybe_nltk_data_cache = easyenv::get_env_string_optional(
    "NLTK_DATA");

  let mut docker_env_vars = Vec::new();

  if let Some(cache_dir) = maybe_huggingface_dataset_cache.as_deref() {
    docker_env_vars.push(DockerEnvVar::new("HF_DATASETS_CACHE", cache_dir));
    docker_env_vars.push(DockerEnvVar::new("HF_HOME", cache_dir));
  }

  if let Some(cache_dir) = maybe_nltk_data_cache.as_deref() {
    docker_env_vars.push(DockerEnvVar::new("NLTK_DATA", cache_dir));
    docker_env_vars.push(DockerEnvVar::new("NLTK_DATA_PATH", cache_dir));
  }

  let maybe_docker_env_vars =
      if docker_env_vars.is_empty() { None } else { Some(docker_env_vars) };

  let maybe_docker_options = easyenv::get_env_string_optional(
    "VITS_INFERENCE_MAYBE_DOCKER_IMAGE_SHA")
      .map(|image_name| {
        DockerOptions {
          image_name,
          maybe_bind_mount: Some(DockerFilesystemMount::tmp_to_tmp()),
          maybe_environment_variables: maybe_docker_env_vars,
          maybe_gpu: Some(DockerGpu::All),
        }
      });

  Ok(VitsInferenceCommand::new(
    root_directory,
    inference_script,
    maybe_python_interpreter.as_deref(),
    maybe_venv_command.as_deref(),
    maybe_huggingface_dataset_cache.as_deref(),
    maybe_nltk_data_cache.as_deref(),
    maybe_docker_options,
  ))
}
