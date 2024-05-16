use std::collections::HashMap;
use std::fs::{File, read_to_string};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Instant;

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
use filesys::file_size::file_size;
use filesys::path_to_string::path_to_string;
use filesys::safe_delete_temp_directory::safe_delete_temp_directory;
use filesys::safe_delete_temp_file::safe_delete_temp_file;
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
use subprocess_common::command_runner::command_runner_args::RunAsSubprocessArgs;
use thumbnail_generator::task_client::thumbnail_task::ThumbnailTaskBuilder;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;

use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::workflow::comfy_ui::comfy_ui_inference_command::{InferenceArgs, InferenceDetails};
use crate::job::job_types::workflow::comfy_ui::download_input_video::{download_input_video, DownloadInputVideoArgs};
use crate::job::job_types::workflow::comfy_ui::job_outputs::JobOutputs;
use crate::job::job_types::workflow::comfy_ui::validate_job::validate_job;
use crate::job_dependencies::JobDependencies;
use crate::util::common_commands::ffmpeg_audio_replace_args::FfmpegAudioReplaceArgs;
use crate::util::common_commands::ffmpeg_logo_watermark_command::WatermarkArgs;

fn get_file_extension(mimetype: &str) -> Result<&'static str> {
    let ext = match mimetype {
        "video/mp4" => "mp4",
        "image/png" => "png",
        "image/jpeg" => "jpg",
        "image/gif" => "gif",
        _ => return Err(anyhow!("Mimetype not supported: {}", mimetype)),
    };
    Ok(ext)
}

pub struct ComfyProcessJobArgs<'a> {
    pub job_dependencies: &'a JobDependencies,
    pub job: &'a AvailableInferenceJob,
}

fn recursively_delete_files_in(path: &Path) -> std::io::Result<()> {
    for entry in WalkDir::new(path) {
        let entry = entry?;
        if entry.path().is_file() {
            safe_delete_temp_file(entry.path());
        }
    }
    Ok(())
}


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

    let mut should_insert_prompt_record = false;
    let mut maybe_style_name = None;
    let mut maybe_positive_prompt = None;
    let mut maybe_negative_prompt = None;

    // ==================== EXTRACT TEXT PROMPTS ==================== //

    if let Some(style_name) = comfy_args.style_name {
        should_insert_prompt_record = true;
        maybe_style_name = Some(style_name);
    }

    if let Some(prompt) = comfy_args.positive_prompt.as_deref() {
        should_insert_prompt_record = true;
        maybe_positive_prompt = Some(prompt.to_string());
    }

    if let Some(prompt) = comfy_args.negative_prompt.as_deref() {
        should_insert_prompt_record = true;
        maybe_negative_prompt = Some(prompt.to_string());
    }

    // ==================== WRITE WORKFLOW PROMPT ==================== //
    let mut json_modifications = None;
    if let Some(modifications) = comfy_args.maybe_json_modifications.clone() {
        // Old-style prompt modifications method
        json_modifications = Some(modifications);
    } else if let Some(style_name) = &comfy_args.style_name {
        // New-style prompt modifications method
        let style_path = model_dependencies.inference_command.styles_directory.join(style_name.to_filename());
        info!("style_path: {:?}", style_path);

        let style_json_content = read_to_string(&style_path).map_err(|e| ProcessSingleJobError::Other(anyhow!("error reading style json: {:?}", e)))?;
        let style_json: Value = serde_json::from_str(&style_json_content).map_err(|e| ProcessSingleJobError::Other(anyhow!("error parsing style json: {:?}", e)))?;

        let mapping_name = style_json.get("mapping_name").and_then(|v| v.as_str())
            .ok_or(ProcessSingleJobError::Other(anyhow!("Failed to get or convert mapping_name from style.json")))?;
        let mapping_path = model_dependencies.inference_command.mappings_directory.join(mapping_name);
        let mapping_json_content = read_to_string(&mapping_path).map_err(|e| ProcessSingleJobError::Other(anyhow!("error reading mapping json: {:?}", e)))?;
        let mapping_json: Value = serde_json::from_str(&mapping_json_content).map_err(|e| ProcessSingleJobError::Other(anyhow!("error parsing mapping json: {:?}", e)))?;

        let workflow_name = style_json.get("workflow_api_name").and_then(|v| v.as_str())
            .ok_or(ProcessSingleJobError::Other(anyhow!("Failed to get or convert workflow_api_name from style.json")))?;
        let workflow_original_location = model_dependencies.inference_command.workflows_directory.join(workflow_name);

        std::fs::copy(&workflow_original_location, &workflow_path).map_err(|e| ProcessSingleJobError::Other(anyhow!("error copying workflow: {:?}", e)))?;

        let style_modifications = style_json.get("modifications").ok_or(ProcessSingleJobError::Other(anyhow!("Failed to get modifications from style.json")))?;
        let positive_prompt = maybe_positive_prompt.as_deref();
        let maybe_negative_prompt = maybe_negative_prompt.as_deref();

        json_modifications = Some(get_style_modifications(style_modifications, &mapping_json, &positive_prompt, &maybe_negative_prompt));

    } else {
        return Err(ProcessSingleJobError::Other(anyhow!("No style nor json modifications provided")));
    }

    workflow_path = apply_jsonpath_modifications(json_modifications.unwrap(), &workflow_path)?;

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
    let mut videos = JobOutputs::new(&root_comfy_path, job_args.output_path);

    // TODO(bt,2024-04-20): Clean up this mess.

    // ==================== DOWNLOAD VIDEO ==================== //

    let download_video = download_input_video(DownloadInputVideoArgs {
        job_args: &job_args,
        videos: &videos,
        mysql_pool: &deps.db.mysql_pool,
        remote_cloud_file_client: &remote_cloud_file_client,
    }).await?;

    info!("Downloaded video!");

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

    info!("Calling video trim / resample...");

    let video_processing_script = model_dependencies.inference_command.processing_script.clone();

    // shell out to python script
    let output = Command::new("python3")
        .arg(video_processing_script)
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

    let inference_start_time = Instant::now();

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

    let command_exit_status = model_dependencies
        .inference_command
        .execute_inference(InferenceArgs {
            stderr_output_file: &stderr_output_file,
            stdout_output_file: &stdout_output_file,
            inference_details,
            face_detailer_enabled: comfy_args.use_face_detailer.unwrap_or(false),
            upscaler_enabled: comfy_args.use_upscaler.unwrap_or(false),
            maybe_strength: comfy_args.strength,
        });


    let inference_duration = Instant::now().duration_since(inference_start_time);

    info!("Inference command exited with status: {:?}", command_exit_status);

    info!("Inference took duration to complete: {:?}", &inference_duration);

    // check stdout for success and check if file exists
    if let Ok(contents) = read_to_string(&stdout_output_file) {
        info!("Captured stduout output: {}", contents);
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

        safe_delete_temp_file(&videos.trimmed_resampled_video_path);
        safe_delete_temp_file(&videos.original_video_path);

        let output_dir = root_comfy_path.join("output");
        recursively_delete_files_in(&output_dir).unwrap();

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
                maybe_stderr_output_file: None,
                maybe_stdout_output_file: None,
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
            .execute_inference(WatermarkArgs {
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


    // ==================== GET METADATA ==================== //

    info!("Interrogating result file size ...");

    let final_video = videos.get_final_video_to_upload();

    let file_size_bytes = file_size(final_video)
        .map_err(|err| ProcessSingleJobError::Other(err))?;

    info!("Interrogating result mimetype ...");

    let mimetype = get_mimetype_for_file(final_video)
        .map_err(|err| ProcessSingleJobError::from_io_error(err))?
        .map(|mime| mime.to_string())
        .ok_or(ProcessSingleJobError::Other(anyhow!("Mimetype could not be determined")))?;

    // create ext from mimetype
    let ext = get_file_extension(mimetype.as_str())
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    // Extension is really a "suffix" and should have the leading period to act as an extension.
    let ext = if ext.starts_with(".") {
        ext.to_string()
    } else {
        format!(".{ext}")
    };

    const PREFIX: &str = "storyteller_";

    //// determine media type from mime type
    //let media_type = match mimetype.as_str() {
    //    "video/mp4" => MediaFileType::Video,
    //    "image/png" => MediaFileType::Image,
    //    "image/jpeg" => MediaFileType::Image,
    //    _ => return Err(ProcessSingleJobError::Other(anyhow!("Mimetype not supported: {}", mimetype))),
    //};

    info!("Calculating sha256...");

    let file_checksum = sha256_hash_file(final_video)
        .map_err(|err| {
            ProcessSingleJobError::Other(anyhow!("Error hashing file: {:?}", err))
        })?;

    // ==================== UPLOAD VIDEO TO BUCKET ==================== //

    job_progress_reporter.log_status("uploading result")
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    let result_bucket_location = MediaFileBucketPath::generate_new(
        Some(PREFIX),
        Some(&ext));

    let result_bucket_object_pathbuf = result_bucket_location.to_full_object_pathbuf();

    info!("Output file destination bucket path: {:?}", &result_bucket_object_pathbuf);

    info!("Uploading media ...");

    args.job_dependencies.buckets.public_bucket_client.upload_filename_with_content_type(
        &result_bucket_object_pathbuf,
        &final_video,
        &mimetype) // TODO: We should check the mimetype to make sure bad payloads can't get uploaded
        .await
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    // generate thumbnail using thumbnail service
    let thumbnail_types = match mimetype.as_str() {
        "video/mp4" => vec!["image/gif", "image/jpeg"],
        _ => vec![],
    };

    info!("Generating thumbnail tasks...");

    for output_type in thumbnail_types {
        let thumbnail_task_result = ThumbnailTaskBuilder::new()
            .with_bucket(&*args.job_dependencies.buckets.public_bucket_client.bucket_name())
            .with_path(&*path_to_string(result_bucket_object_pathbuf.clone()))
            .with_source_mimetype(mimetype.as_str())
            .with_output_mimetype(output_type)
            .with_output_suffix("thumb")
            .with_output_extension(get_file_extension(output_type).unwrap())
            .with_event_id(&job.id.0.to_string())
            .send()
            .await;

        match thumbnail_task_result {
            Ok(thumbnail_task) => {
                debug!("Thumbnail task created: {:?}", thumbnail_task);
            },
            Err(e) => {
                error!("Failed to create thumbnail task: {:?}", e);
            }
        }
    }

    // Also upload the non-watermarked copy
    info!("Uploading non-watermarked copy...");

    let result = args.job_dependencies.buckets.public_bucket_client.upload_filename_with_content_type(
        &result_bucket_object_pathbuf.with_extension("no_watermark.mp4"),
        &videos.get_non_watermarked_video_to_upload(),
        &mimetype) // TODO: We should check the mimetype to make sure bad payloads can't get uploaded
        .await;

    if let Err(err) = result {
        error!("Failed to upload non-watermarked copy: {:?}", err);
    }

    // ==================== CLEANUP/ DELETE TEMP FILES ==================== //

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
        safe_delete_temp_file(&lora_path);
    }

    let output_dir = root_comfy_path.join("output");
    recursively_delete_files_in(&output_dir).unwrap();

    // NB: We should be using a tempdir, but to make absolutely certain we don't overflow the disk...
    safe_delete_temp_directory(&work_temp_dir);

    // ==================== SAVE RECORDS ==================== //

    // create a json detailing the args used to create the media
    let args_json = serde_json::to_string(&job_args)
        .map_err(|e| ProcessSingleJobError::Other(e.into()))?;

    info!("Saving ComfyUI result (media_files table record) ...");

    // NB: We do this to avoid deep-frying the video.
    // This also lets us hide the engine renders from users.
    // This shouldn't ever become a deeply nested tree of children, but rather a single root
    // with potentially many direct children.
    let style_transfer_source_media_file_token = download_video
        .input_video_media_file
        .maybe_style_transfer_source_media_file_token
        .as_ref()
        .unwrap_or_else(|| &download_video.input_video_media_file.token);

    let prompt_token = PromptToken::generate();

    let (media_file_token, id) = insert_media_file_from_comfy_ui(InsertArgs {
        pool: &args.job_dependencies.db.mysql_pool,
        job: &job,
        maybe_mime_type: Some(&mimetype),
        maybe_title: download_video.input_video_media_file.maybe_title.as_deref(),
        maybe_style_transfer_source_media_file_token: Some(&style_transfer_source_media_file_token),
        maybe_scene_source_media_file_token: download_video.input_video_media_file.maybe_scene_source_media_file_token.as_ref(),
        file_size_bytes,
        sha256_checksum: &file_checksum,
        maybe_prompt_token: Some(&prompt_token),
        public_bucket_directory_hash: result_bucket_location.get_object_hash(),
        maybe_public_bucket_prefix: Some(PREFIX),
        maybe_public_bucket_extension: Some(&ext),
        is_on_prem: args.job_dependencies.job.info.container.is_on_prem,
        worker_hostname: &args.job_dependencies.job.info.container.hostname,
        worker_cluster: &args.job_dependencies.job.info.container.cluster_name,
        extra_file_modification_info: Some(&args_json),
    })
        .await
        .map_err(|e| {
            error!("Error saving media file record: {:?}", e);
            ProcessSingleJobError::Other(e)
        })?;

    if should_insert_prompt_record {
        info!("Saving prompt record");

        let mut other_args_builder = PromptInnerPayloadBuilder::new();

        if let Some(style_name) = maybe_style_name {
            info!("building PromptInnerPayload with style_name = {:?}", style_name);
            other_args_builder.set_style_name(style_name);
        }

        if comfy_args.use_face_detailer.unwrap_or(false) {
            other_args_builder.set_used_face_detailer(true);
        }

        if comfy_args.use_upscaler.unwrap_or(false) {
            other_args_builder.set_used_upscaler(true);
        }

        let maybe_other_args = other_args_builder.build();

        info!("maybe other prompt args: {:?}", maybe_other_args);

        // NB: Don't fail the job if the query fails.
        let prompt_result = insert_prompt(InsertPromptArgs {
            maybe_apriori_prompt_token: Some(&prompt_token),
            prompt_type: PromptType::ComfyUi,
            maybe_creator_user_token: job.maybe_creator_user_token_typed.as_ref(),
            maybe_positive_prompt: maybe_positive_prompt.as_deref(),
            maybe_negative_prompt: maybe_negative_prompt.as_deref(),
            maybe_other_args: maybe_other_args.as_ref(),
            creator_ip_address: &job.creator_ip_address,
            mysql_executor: &args.job_dependencies.db.mysql_pool,
            phantom: Default::default(),
        }).await;

        if let Err(err) = prompt_result {
            error!("No prompt result token? something has failed: {:?} (we'll ignore this error)", err);
        }
    }

    info!("ComfyUI Done.");

    job_progress_reporter.log_status("done")
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    info!("Job {:?} complete success! Downloaded, ran inference, and uploaded. Saved model record: {}, Result Token: {}",
        job.id, id, &media_file_token);

    Ok(JobSuccessResult {
        maybe_result_entity: Some(ResultEntity {
            entity_type: InferenceResultType::MediaFile,
            entity_token: media_file_token.to_string(),
        }),
        inference_duration,
    })
}

fn apply_jsonpath_modifications(modifications: HashMap<String, NewValue>, workflow_path: &str) -> AnyhowResult<String> {

    info!("Prompt modifications: #{:?}", modifications);

    // Load prompt.json
    info!("Loading prompt file: {:?}", workflow_path);
    let prompt_file = File::open(workflow_path)?;
    let mut prompt_json: Value = serde_json::from_reader(prompt_file)?;

    // Modify json
    for (path, new_value) in modifications
        .iter()
        .map(|(k, v)| (k.as_str(), v))
    {
        prompt_json = replace_json_value(prompt_json, path, new_value)
            .map_err(|e| anyhow!("error replacing prompt json: {:?}", e))?;
    }

    // Save prompt.json
    let workflow_parent_dir = Path::new(workflow_path).parent().unwrap();
    let prompt_filepath = workflow_parent_dir.join("prompt.json");
    let prompt_file = File::create(&prompt_filepath)
        .map_err(|e| anyhow!("error creating prompt file: {:?}", e))?;
    info!("Saving prompt file: {:?}", prompt_file);
    serde_json::to_writer(prompt_file, &prompt_json)?;

    Ok(prompt_filepath.to_str().unwrap().to_string())
}


fn get_style_modifications(style_json: &Value, mapping_json: &Value, pos_in: &Option<&str>, neg_in: &Option<&str>) -> HashMap<String, NewValue> {
    let mut modifications = HashMap::new();
    let mut new_style_json = style_json.clone();

    // Loras have to be processed differently
    if let Some(loras) = style_json.get("loras").and_then(|l| l.as_array()) {
        if loras.len() > 8 {
            panic!("Too many loras, max is 8");
        }

        for (index, lora) in loras.iter().enumerate() {
            if let (Some(name), Some(strength)) = (lora.get("name"), lora.get("strength")) {
                new_style_json[format!("lora_{}_strength", index + 1)] = strength.clone();
                new_style_json[format!("lora_{}_name", index + 1)] = name.clone();
            }
        }
    }

    if let Some(pos) = pos_in {
        new_style_json["positive_prompt"] = Value::String(format!("{}, {}",pos, style_json["positive_prompt"].as_str().unwrap()));
    }
    if let Some(neg) = neg_in {
        new_style_json["negative_prompt"] = Value::String(format!("{}, {}",neg, style_json["negative_prompt"].as_str().unwrap()));
    }

    for (key, value) in new_style_json.as_object().unwrap() {
        if key == "loras" { continue; }

        let mapping_key = format!("$.{}", key);
        if let Ok(mapping_values) = jsonpath_lib::select(mapping_json, &mapping_key) {
            if let Some(mapping_value) = mapping_values.get(0).and_then(|v| v.as_str()) {
                modifications.insert(mapping_value.to_string(), NewValue::from_json(value));
            } else {
                println!("No mapping found for key '{}'", key);
            }
        }
    }

    modifications
}


fn replace_json_value(json: Value, path: &str, new_value: &NewValue) -> AnyhowResult<Value> {
    // First, attempt to read the value at the specified path
    let results = jsonpath_lib::select(&json, path).map_err(|err| {
        anyhow!("Invalid jsonpath '{}': {:?}", path, err)
    })?;

    // If the path does not exist or returns no results, return an error
    if results.is_empty() {
        return Err(anyhow!("Path '{}' does not exist in the provided JSON.", path));
    }

    // If the path exists, proceed with the replacement
    // Assuming replace_with returns a Result, handle it appropriately
    jsonpath_lib::replace_with(json, path, &mut |_| {
        match new_value {
            NewValue::String(s) => Some(Value::String(s.clone())),
            NewValue::Float(f) => serde_json::Number::from_f64(*f as f64)
                .map(Value::Number) // Convert Option to Some(Value::Number) if Some, else None
                .or_else(|| Some(Value::Null)), // If None, use Value::Null instead
            NewValue::Int(i) => Some(Value::Number(serde_json::Number::from(*i))),
            NewValue::Bool(b) => Some(Value::Bool(*b)),
        }
    }).map_err(|err| {
        anyhow!("Failed to replace json value at path '{}': {:?}", path, err)
    })
}
