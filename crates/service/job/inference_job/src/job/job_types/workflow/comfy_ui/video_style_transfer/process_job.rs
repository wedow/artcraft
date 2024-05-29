use std::collections::HashMap;
use std::fs::{File, read_to_string};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

use anyhow::{anyhow, Result};
use log::{debug, error, info, warn};
use serde_json::Value;
use walkdir::WalkDir;

use buckets::public::media_files::bucket_file_path::MediaFileBucketPath;
use cloud_storage::remote_file_manager::remote_cloud_bucket_details::RemoteCloudBucketDetails;
use cloud_storage::remote_file_manager::remote_cloud_file_manager::RemoteCloudFileClient;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::by_table::prompts::prompt_type::PromptType;
use errors::AnyhowResult;
use filesys::check_file_exists::check_file_exists;
use filesys::file_exists::file_exists;
use filesys::file_size::file_size;
use filesys::path_to_string::path_to_string;
use filesys::safe_delete_temp_directory::safe_delete_temp_directory;
use filesys::safe_delete_temp_file::safe_delete_temp_file;
use filesys::safe_recursively_delete_files::safe_recursively_delete_files;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use mimetypes::mimetype_for_file::get_mimetype_for_file;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::PolymorphicInferenceArgs::Cu;
use mysql_queries::payloads::generic_inference_args::workflow_payload::NewValue;
use mysql_queries::payloads::prompt_args::encoded_style_transfer_name::EncodedStyleTransferName;
use mysql_queries::payloads::prompt_args::prompt_inner_payload::{PromptInnerPayload, PromptInnerPayloadBuilder};
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::media_files::create::insert_media_file_from_comfy_ui::{insert_media_file_from_comfy_ui, InsertArgs};
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;
use mysql_queries::queries::model_weights::get::get_weight::get_weight_by_token;
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use subprocess_common::command_runner::command_runner_args::{RunAsSubprocessArgs, StreamRedirection};
use thumbnail_generator::task_client::thumbnail_task::ThumbnailTaskBuilder;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use videos::ffprobe_get_dimensions::ffprobe_get_dimensions;

use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::workflow::comfy_ui::comfy_process_job_args::ComfyProcessJobArgs;
use crate::job::job_types::workflow::comfy_ui::video_style_transfer::comfy_ui_inference_command::{InferenceArgs, InferenceDetails};
use crate::job::job_types::workflow::comfy_ui::video_style_transfer::download_input_video::{download_input_video, DownloadInputVideoArgs};
use crate::job::job_types::workflow::comfy_ui::video_style_transfer::validate_and_save_results::{SaveResultsArgs, validate_and_save_results};
use crate::job::job_types::workflow::comfy_ui::video_style_transfer::validate_job::validate_job;
use crate::job::job_types::workflow::comfy_ui::video_style_transfer::video_paths::VideoPaths;
use crate::job::job_types::workflow::comfy_ui::video_style_transfer::write_workflow_prompt::{WorkflowPromptArgs, write_workflow_prompt};
use crate::job_dependencies::JobDependencies;
use crate::util::common_commands::ffmpeg_audio_replace_args::FfmpegAudioReplaceArgs;
use crate::util::common_commands::ffmpeg_logo_watermark_command::WatermarkArgs;

pub async fn process_job(args: ComfyProcessJobArgs<'_>) -> Result<JobSuccessResult, ProcessSingleJobError> {
    let job = args.job;
    let deps = args.job_dependencies;

    let mut job_progress_reporter = args.job_dependencies
        .clients
        .job_progress_reporter
        .new_generic_inference(job.inference_job_token.as_str())
        .map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

    let model_dependencies = args
        .job_dependencies
        .job
        .job_specific_dependencies
        .maybe_comfy_ui_dependencies
        .as_ref()
        .ok_or_else(|| ProcessSingleJobError::JobSystemMisconfiguration(Some("Missing ComfyUI dependencies".to_string())))?;

    // ==================== UNPACK + VALIDATE INFERENCE ARGS ==================== //
    // check for lack of maybe_json_modifications

    let job_args = validate_job(job)?;

    // ==================== TEMP DIR ==================== //

    let work_temp_dir = format!("temp_comfy_inference{}", job.id.0);

    // NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
    let work_temp_dir = args.job_dependencies
        .fs
        .scoped_temp_dir_creator_for_work
        .new_tempdir(&work_temp_dir)
        .map_err(|e| ProcessSingleJobError::from_io_error(e))?;

    // ===================== DOWNLOAD REQUIRED MODELS IF NOT EXIST ===================== //

    let root_comfy_path = model_dependencies.inference_command.mounts_directory.clone();

    let remote_cloud_file_client = RemoteCloudFileClient::get_remote_cloud_file_client().await;
    let remote_cloud_file_client = match remote_cloud_file_client {
        Ok(res) => {
            res
        }
        Err(_) => {
            return Err(ProcessSingleJobError::from(anyhow!("failed to get remote cloud file client")));
        }
    };

    // Download workflow to ComfyRunner
    let workflow_dir = root_comfy_path.join("prompt");
    // make folder if not exist
    if !workflow_dir.exists() {
        std::fs::create_dir_all(&workflow_dir).map_err(|err| ProcessSingleJobError::IoError(err))?;
    }

    let mut workflow_path = workflow_dir.join("prompt.json").to_str().unwrap().to_string();

    // download workflow if not none
    match job_args.workflow_source {
        Some(workflow_token) => {
            let retrieved_workflow_record =  get_weight_by_token(
                workflow_token,
                false,
                &deps.db.mysql_pool
            ).await?.ok_or_else(|| ProcessSingleJobError::Other(anyhow!("Workflow not found")))?;

            let bucket_details = RemoteCloudBucketDetails {
                object_hash: retrieved_workflow_record.public_bucket_hash,
                prefix: retrieved_workflow_record.maybe_public_bucket_prefix.unwrap(),
                suffix: retrieved_workflow_record.maybe_public_bucket_extension.unwrap(),
            };
            remote_cloud_file_client.download_file(bucket_details, workflow_path.clone()).await?;
            info!("Downloaded workflow to {:?}", workflow_path);
        }
        _ => { }
    }

    let maybe_args = job.maybe_inference_args
        .as_ref()
        .map(|args| args.args.as_ref())
        .flatten();

    let poly_args = match maybe_args {
        None => return Err(ProcessSingleJobError::Other(anyhow!("ComfyUi args not found"))),
        Some(args) => args,
    };

    let comfy_args = match poly_args {
        Cu(args) => args,
        _ => return Err(ProcessSingleJobError::Other(anyhow!("ComfyUi args not found"))),
    };

    info!("Workflow args: {:?}", comfy_args);


    // ==================== WRITE WORKFLOW PROMPT ==================== //

    workflow_path = write_workflow_prompt(WorkflowPromptArgs {
        workflow_path: &workflow_path,
        comfy_args: &comfy_args,
        model_dependencies: &model_dependencies,
        maybe_positive_prompt: comfy_args.positive_prompt.as_deref(),
        maybe_negative_prompt: comfy_args.negative_prompt.as_deref(),
    })?;

    // ==================== QUERY AND DOWNLOAD FILES ==================== //

    // Download Lora model if specified
    let mut maybe_lora_path: Option<PathBuf> = None;

    match job_args.maybe_lora_model {
        Some(lora_model_weight_token) => {
            let lora_dir = root_comfy_path.join("models").join("loras");
            // make if not exist
            if !lora_dir.exists() {
                std::fs::create_dir_all(&lora_dir)
                    .map_err(|err| ProcessSingleJobError::IoError(err))?;
            }

            info!("Querying lora model by token: {:?} ...", &lora_model_weight_token);

            let retrieved_lora_record =  get_weight_by_token(
                lora_model_weight_token,
                true,
                &deps.db.mysql_pool
            ).await?.ok_or_else(|| {
                error!("Lora model not found: {:?}", lora_model_weight_token);
                ProcessSingleJobError::Other(anyhow!("Lora model not found: {:?}", lora_model_weight_token))
            })?;

            let bucket_details = RemoteCloudBucketDetails {
                object_hash: retrieved_lora_record.public_bucket_hash,
                prefix: retrieved_lora_record.maybe_public_bucket_prefix.unwrap(),
                suffix: retrieved_lora_record.maybe_public_bucket_extension.unwrap(),
            };

            let lora_filename = "lora.safetensors";
            let lora_path = lora_dir.join(lora_filename).to_str().unwrap().to_string();
            remote_cloud_file_client.download_file(bucket_details, lora_path.clone()).await?;
            maybe_lora_path = Some(lora_path.parse().unwrap());
            info!("Downloaded Lora model to {:?}", lora_path);
            maybe_lora_path = Some(lora_path.parse().unwrap());
        }
        None => {}
    }

    let input_dir = root_comfy_path.join("input");

    if !input_dir.exists() {
        std::fs::create_dir_all(&input_dir)
            .map_err(|err| ProcessSingleJobError::IoError(err))?;
    }

    // Keep track of all the video files we generate
    info!("Root comfy path: {:?}", &root_comfy_path);
    info!("Job output path will be (fix this code! the job shouldn't set this path!): {:?}", &job_args.output_path);

    let mut videos = VideoPaths::new(&root_comfy_path, job_args.output_path);

    // TODO(bt,2024-04-20): Clean up this mess.

    // ==================== DOWNLOAD VIDEO ==================== //

    let download_video = download_input_video(DownloadInputVideoArgs {
        job_args: &job_args,
        videos: &videos,
        mysql_pool: &deps.db.mysql_pool,
        remote_cloud_file_client: &remote_cloud_file_client,
    }).await?;

    info!("Downloaded video!");

    videos.debug_print_paths_after_download();

    if let Ok(Some(dimensions)) = ffprobe_get_dimensions(&videos.original_video_path) {
        info!("Download video dimensions: {}x{}", dimensions.width, dimensions.height);
    }

    // ========================= PROCESS VIDEO ======================== //

    let target_fps = comfy_args.target_fps.unwrap_or(24);

    let trim_start_millis = comfy_args.trim_start_milliseconds
        .or_else(|| comfy_args.trim_start_seconds.map(|s| s as u64 * 1_000))
        .unwrap_or(0);

    let trim_end_millis = comfy_args.trim_end_milliseconds
        .or_else(|| comfy_args.trim_end_seconds.map(|s| s as u64 * 1_000))
        .unwrap_or(3_000);

    info!("trim start millis: {trim_start_millis}");
    info!("trim end millis: {trim_end_millis}");
    info!("target FPS: {target_fps}");

    let skip_process_video = comfy_args.skip_process_video.unwrap_or(false);

    if skip_process_video {
        info!("Skipping video trim / resample...");
        info!("(This might break if we need to copy the video path. Salt's code implicitly expects videos to be in certain places, but doesn't allow passing of config, and that's horrible.)");

        std::fs::copy(&videos.original_video_path, &videos.trimmed_resampled_video_path)
            .map_err(|err| {
                error!("Error copying video (1): {:?}", err);
                ProcessSingleJobError::IoError(err)
            })?;

        std::fs::copy(&videos.original_video_path, &videos.comfy_output_video_path)
            .map_err(|err| {
                error!("Error copying video (2): {:?}", err);
                ProcessSingleJobError::IoError(err)
            })?;

    } else {
        info!("Calling video trim / resample...");
        info!("Script: {:?}", &model_dependencies.inference_command.processing_script);

        // shell out to python script
        let output = Command::new("python3")
            .stdout(Stdio::inherit()) // NB: This should emit to the rust job's stdout
            .stderr(Stdio::inherit()) // NB: This should emit to the rust job's stderr
            .arg(path_to_string(&model_dependencies.inference_command.processing_script))
            .arg(path_to_string(&videos.original_video_path))
            .arg(format!("{:?}", trim_start_millis))
            .arg(format!("{:?}", trim_end_millis))
            .arg(format!("{:?}", target_fps))
            .output()
            .map_err(|e| {
                error!("Error running inference: {:?}", e);
                ProcessSingleJobError::Other(e.into())
            })?;

        // check if the command was successful
        if !output.status.success() {
            // print stdout and stderr
            error!("Video processing failed: {:?}", output.status);
            error!("stdout: {}", String::from_utf8_lossy(&output.stdout));
            error!("stderr: {}", String::from_utf8_lossy(&output.stderr));
            return Err(ProcessSingleJobError::Other(anyhow!("Command failed: {:?}", output.status)));
        }

        info!("Finished video trim / resample.");

        // NB: The process video script implicitly saves the above video as "input.mp4"
        // Comfy sometimes overwrites this, so we need to make a copy.
        std::fs::copy(&videos.comfy_input_video_path, &videos.trimmed_resampled_video_path)
            .map_err(|err| {
                error!("Error copying trimmed video: {:?}", err);
                ProcessSingleJobError::IoError(err)
            })?;
    }

    videos.debug_print_paths_after_trim();

    if let Ok(Some(dimensions)) = ffprobe_get_dimensions(&videos.trimmed_resampled_video_path) {
        info!("Trimmed / resampled video dimensions: {}x{}", dimensions.width, dimensions.height);
    }

    // make outputs dir if not exist
    let output_dir = root_comfy_path.join("output");
    if !output_dir.exists() {
        std::fs::create_dir_all(&output_dir)
            .map_err(|err| ProcessSingleJobError::IoError(err))?;
    }

    // ==================== RUN COMFY INFERENCE ==================== //

    info!("Ready for ComfyUI inference...");

    job_progress_reporter.log_status("running inference")
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    info!("Running ComfyUI inference...");

    let stderr_output_file = work_temp_dir.path().join("stderr.txt");
    let stdout_output_file = work_temp_dir.path().join("stdout.txt");

    let positive_prompt_file = work_temp_dir.path().join("positive_prompt.txt");
    let negative_prompt_file = work_temp_dir.path().join("negative_prompt.txt");

    let inference_details;

    // NB: We're rolling forward to a world where the JSON modifications are performed on the Python side.
    //let python_side_orchestration = comfy_args.rollout_python_workflow_args.unwrap_or(false);
    const PYTHON_SIDE_ORCHESTRATION: bool = true;

    if PYTHON_SIDE_ORCHESTRATION {
        let maybe_positive_prompt_filename = comfy_args.positive_prompt
            .as_deref()
            .map(|prompt| {
                std::fs::write(&positive_prompt_file, prompt)
                    .map(|_| positive_prompt_file.as_path())
                    .map_err(|e| ProcessSingleJobError::IoError(e))
            })
            .transpose()?;

        let maybe_negative_prompt_filename = comfy_args.negative_prompt
            .as_deref()
            .map(|prompt| {
                std::fs::write(&negative_prompt_file, prompt)
                    .map(|_| negative_prompt_file.as_path())
                    .map_err(|e| ProcessSingleJobError::IoError(e))
            })
            .transpose()?;

        inference_details = InferenceDetails::NewPythonArgs {
            maybe_style: comfy_args.style_name,
            maybe_positive_prompt_filename,
            maybe_negative_prompt_filename,
        }
    } else {
        inference_details = InferenceDetails::OldRustArgs {
            prompt_location: PathBuf::from(&workflow_path),
        }
    }

    let inference_start_time = Instant::now();

    let command_exit_status = model_dependencies
        .inference_command
        .execute_inference(InferenceArgs {
            stderr_output_file: &stderr_output_file,
            stdout_output_file: &stdout_output_file,
            inference_details,
            face_detailer_enabled: comfy_args.use_face_detailer.unwrap_or(false),
            upscaler_enabled: comfy_args.use_upscaler.unwrap_or(false),
            lipsync_enabled: comfy_args.lipsync_enabled.unwrap_or(false),
            maybe_strength: comfy_args.strength,
        });

    let inference_duration = Instant::now().duration_since(inference_start_time);

    info!("Inference command exited with status: {:?}", command_exit_status);

    info!("Inference took duration to complete: {:?}", &inference_duration);

    // check stdout for success and check if file exists
    if let Ok(contents) = read_to_string(&stdout_output_file) {
        info!("Captured stduout output: {}", contents);
    }

    videos.debug_print_paths_after_comfy();

    if let Ok(Some(dimensions)) = ffprobe_get_dimensions(&videos.comfy_output_video_path) {
        info!("Comfy output video dimensions: {}x{}", dimensions.width, dimensions.height);
    }

    // ==================== CHECK OUTPUT FILE ======================== //

    if let Err(err) = check_file_exists(&videos.comfy_output_video_path) {
        error!("Output file does not  exist: {:?}", err);

        error!("Inference failed: {:?}", command_exit_status);

        if let Ok(contents) = read_to_string(&stderr_output_file) {
            warn!("Captured stderr output: {}", contents);
        }

        safe_delete_temp_file(&stderr_output_file);
        safe_delete_temp_file(&stdout_output_file);
        safe_delete_temp_directory(&work_temp_dir);
        safe_delete_temp_file(&workflow_path);

        // TODO(bt,2024-04-21): Not sure we want to delete the LoRA?
        if let Some(lora_path) = maybe_lora_path {
            safe_delete_temp_file(&lora_path);
        }

        safe_delete_temp_file(&videos.comfy_input_video_path);
        safe_delete_temp_file(&videos.trimmed_resampled_video_path);
        safe_delete_temp_file(&videos.original_video_path);

        let output_dir = root_comfy_path.join("output");
        safe_recursively_delete_files(&output_dir);

        return Err(ProcessSingleJobError::Other(anyhow!("Output file did not exist: {:?}",
            &videos.comfy_output_video_path)));
    }

    // ==================== COPY BACK AUDIO ==================== //

    const RESTORE_AUDIO : bool = true;

    if RESTORE_AUDIO {
        info!("Restoring audio...");

        let output_video_fs_path_restored = videos.comfy_output_video_path.with_extension("_restored.mp4");

        let command_exit_status = model_dependencies
            .ffmpeg_command_runner
            .run_with_subprocess(RunAsSubprocessArgs {
                args: Box::new(&FfmpegAudioReplaceArgs {
                    input_video_file: &videos.comfy_output_video_path,
                    input_audio_file: &videos.trimmed_resampled_video_path,
                    output_video_file: &output_video_fs_path_restored,
                }),
                stderr: StreamRedirection::None,
                stdout: StreamRedirection::None,
            });

        let mut use_restored_audio = true;

        // NB: Don't fail the entire command if audio restoration fails
        if let Err(err) = check_file_exists(&output_video_fs_path_restored) {
            use_restored_audio = false;
            error!("Audio copy failed: {:?}", err);
        }

        if !command_exit_status.is_success() {
            use_restored_audio = false;
            error!("Audio copy failed: {:?} ; we'll save the non-audio copy.", command_exit_status);
        }

        if use_restored_audio {
            info!("Success generating restored audio file: {:?}", output_video_fs_path_restored);
            videos.audio_restored_video_path = Some(output_video_fs_path_restored);
        }
    }

    // ==================== OPTIONAL WATERMARK ==================== //

    // TODO(bt, 2024-03-01): Interrogate account for premium
    // TODO(bt, 2024-04-21): Combine this ffmpeg processing with the previous step
    const REMOVE_WATERMARK : bool = false;

    if !REMOVE_WATERMARK {
        info!("Adding watermark...");

        let output_video_fs_path_watermark = videos.comfy_output_video_path.with_extension("_watermark.mp4");

        let command_exit_status = model_dependencies
            .ffmpeg_watermark_command
            .execute(WatermarkArgs {
                video_path: videos.video_to_watermark(),
                maybe_override_logo_path: None,
                alpha: 0.6,
                scale: 0.1, // NB: 0.1 is good for the Storyteller logo @ 2653x512 placed on 1024x576 output.
                output_path: &output_video_fs_path_watermark,
            });

        let mut use_watermarked_file = true;

        // NB: Don't fail the entire command if watermarking fails.
        if let Err(err) = check_file_exists(&output_video_fs_path_watermark) {
            use_watermarked_file = false;
            error!("Watermarking failed: {:?}", err);
        }

        if !command_exit_status.is_success() {
            use_watermarked_file = false;
            error!("Watermark failed: {:?} ; we'll save the non-watermarked copy.", command_exit_status);
        }

        if use_watermarked_file {
            info!("Success generating watermarked file: {:?}", output_video_fs_path_watermark);
            videos.watermarked_video_path = Some(output_video_fs_path_watermark);
        }
    }

    videos.debug_print_paths_after_post_processing();

    if let Ok(Some(dimensions)) = ffprobe_get_dimensions(&videos.get_final_video_to_upload()) {
        info!("Final video upload dimensions: {}x{}", dimensions.width, dimensions.height);
    }

    // ==================== VALIDATE AND SAVE RESULTS ======================== //

    let media_file_token = validate_and_save_results(SaveResultsArgs {
        job,
        deps: &deps,
        job_args: &job_args,
        comfy_args,
        videos: &videos,
        job_progress_reporter: &mut job_progress_reporter,
        download_video,
        inference_duration,
    }).await?;

    // ==================== (OPTIONAL) DEBUG SLEEP ==================== //

    if let Some(sleep_millis) = comfy_args.sleep_millis {
        info!("Sleeping for millis: {sleep_millis}");
        thread::sleep(Duration::from_millis(sleep_millis));
    }

    // ==================== CLEANUP/ DELETE TEMP FILES ==================== //

    info!("Cleaning up temporary files...");

    safe_delete_temp_file(&stderr_output_file);
    safe_delete_temp_file(&stdout_output_file);
    safe_delete_temp_file(&videos.original_video_path);
    safe_delete_temp_file(&videos.trimmed_resampled_video_path);
    safe_delete_temp_file(&videos.comfy_output_video_path);
    safe_delete_temp_file(videos.video_to_watermark());
    safe_delete_temp_file(videos.get_final_video_to_upload());
    safe_delete_temp_file(videos.get_non_watermarked_video_to_upload());

    // TODO(bt,2024-03-01): Do we really want to delete the workflow, models, etc.?

    safe_delete_temp_file(&workflow_path);

    // TODO(bt,2024-04-21): Not sure we want to delete the LoRA?
    if let Some(lora_path) = maybe_lora_path {
        safe_delete_temp_file(lora_path);
    }

    let output_dir = root_comfy_path.join("output");
    safe_recursively_delete_files(&output_dir);

    // NB: We should be using a tempdir, but to make absolutely certain we don't overflow the disk...
    safe_delete_temp_directory(&work_temp_dir);

    // ==================== DONE ==================== //

    info!("ComfyUI Done.");

    job_progress_reporter.log_status("done")
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    info!("Result video media token: {:?}", &media_file_token);

    info!("Job {:?} complete success!", args.job.id);

    Ok(JobSuccessResult {
        maybe_result_entity: Some(ResultEntity {
            entity_type: InferenceResultType::MediaFile,
            entity_token: media_file_token.to_string(),
        }),
        inference_duration,
    })
}
