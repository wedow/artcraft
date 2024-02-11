use std::collections::HashMap;
use std::fs::{File, read_to_string};
use std::path::{Path, PathBuf};
use std::time::Instant;

use anyhow::anyhow;
use log::{error, info, warn};
use serde_json::Value;
use tokio::io::AsyncWriteExt;
use walkdir::WalkDir;

use buckets::public::media_files::bucket_file_path::MediaFileBucketPath;
use cloud_storage::remote_file_manager::remote_cloud_bucket_details::RemoteCloudBucketDetails;
use cloud_storage::remote_file_manager::remote_cloud_file_manager::RemoteCloudFileClient;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use enums::by_table::media_files::media_file_type::MediaFileType;
use filesys::check_file_exists::check_file_exists;
use filesys::file_size::file_size;
use filesys::path_to_string::path_to_string;
use filesys::safe_delete_temp_directory::safe_delete_temp_directory;
use filesys::safe_delete_temp_file::safe_delete_temp_file;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use mimetypes::mimetype_for_file::get_mimetype_for_file;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::PolymorphicInferenceArgs::Cu;
use mysql_queries::payloads::generic_inference_args::workflow_payload::NewValue;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::media_files::create::insert_media_file_from_comfy_ui::{insert_media_file_from_comfy_ui, InsertArgs};
use mysql_queries::queries::media_files::get_media_file::get_media_file;
use mysql_queries::queries::model_weights::get::get_weight::get_weight_by_token;

use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::workflow::comfy_ui::comfy_ui_inference_command::InferenceArgs;
use crate::job::job_types::workflow::comfy_ui::validate_job::validate_job;
use crate::job_dependencies::JobDependencies;

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

#[derive(Serialize, Deserialize, Debug)]
struct Remote {
    bucket: String,
    path: String,
    #[serde(rename = "type")]
    type_: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct HttpCallback {
    url: String,
    method: String,
    headers: HashMap<String, String>,
    #[serde(default)]
    json: HashMap<String, Value>,
}

#[derive(Serialize, Deserialize, Debug)]
struct ThumbnailTask {
    event_id: String,
    input: Remote,
    output: Remote,
    #[serde(skip_serializing_if = "Option::is_none")]
    callback: Option<HttpCallback>,
    #[serde(default)]
    tags: Vec<HashMap<String, String>>,
}

async fn send_thumbnail_task(task: &ThumbnailTask, url: &str) -> Result<(), ReqwestError> {
    let client = reqwest::Client::new();
    client.post(url)
        .json(task)
        .send()
        .await?
        .error_for_status()?; // This ensures we get an error back if the response status is not 2xx.
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

    async fn download_file(file_url: String, dep_path: PathBuf) -> Result<(), anyhow::Error> {
        // Send a GET request to the file_url
        let response = reqwest::get(&file_url).await?;

        // Ensure the request was successful
        if response.status().is_success() {
            // Get the byte stream of the file
            let bytes = response.bytes().await?;

            // Ensure the parent directory exists
            if let Some(parent) = dep_path.parent() {
                // Skip errors (for example if the directory already exists)
                let _ = tokio::fs::create_dir_all(&parent).await;
            }

            // Create or open the file at dep_path asynchronously
            let mut file = tokio::fs::File::create(&dep_path).await?;

            // Write the bytes to the file asynchronously
            file.write_all(&bytes).await?;
            println!("File downloaded successfully.");
        } else {
            println!("Failed to download the file.");
        }

        Ok(())
    }

    let comfy_deps = match args.job_dependencies.job.job_specific_dependencies.maybe_comfy_ui_dependencies {
        Some(ref deps) => deps,
        None => return Err(ProcessSingleJobError::from(anyhow!("no comfy deps"))),
    };

    let all_models = &args.job_dependencies.job.job_specific_dependencies.maybe_comfy_ui_dependencies;
    match all_models {
        Some(models) => {
            for model in &models.dependency_tokens.comfy {
                let mut dep_path = model_dependencies.inference_command.mounts_directory.clone();
                dep_path = dep_path.join(model.location.clone());
                info!("Checking if path exists: {:?}", dep_path);
                if !dep_path.exists() {
                    warn!("Path does not exist: {:?}", dep_path);
                    download_file(model.url.clone(), dep_path.clone()).await.map_err(|e| ProcessSingleJobError::Other(e))?;
                    info!("Downloaded model to {:?}", dep_path);
                }
            }
        }
        None => {
            info!("No models specified to download")
        }
    }

    // Download workflow to ComfyRunner
    let workflow_dir = root_comfy_path.join("prompt");
    // make folder if not exist
    if !workflow_dir.exists() {
        std::fs::create_dir_all(&workflow_dir).unwrap();
    }

    let workflow_path = workflow_dir.join("prompt.json").to_str().unwrap().to_string();

    //let retrieved_workflow_record =  get_weight_by_token(
    //    job_args.workflow_source,
    //    false,
    //    &deps.db.mysql_pool
    //).await?.unwrap();

    //let bucket_details = RemoteCloudBucketDetails {
    //    object_hash: retrieved_workflow_record.public_bucket_hash,
    //    prefix: retrieved_workflow_record.maybe_public_bucket_prefix.unwrap(),
    //    suffix: retrieved_workflow_record.maybe_public_bucket_extension.unwrap(),
    //};
    //remote_cloud_file_client.download_file(bucket_details, workflow_path.clone()).await?;

    info!("Downloading workflow {:?}", &comfy_deps.workflow_bucket_path);
    info!("Downloading workflow to {:?}", workflow_path);

    args.job_dependencies
        .buckets
        .public_bucket_client
        .download_file_to_disk(&comfy_deps.workflow_bucket_path, &workflow_path)
        .await
        .map_err(|err| {
            error!("could not download workflow: {:?}", err);
            ProcessSingleJobError::from_anyhow_error(anyhow!("could not download workflow: {:?}", err))
        })?;

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

    // Apply modifications if they exist
    if let Some(modifications) = comfy_args.maybe_json_modifications.clone() {
        // Load prompt.json
        let prompt_file = File::open(&workflow_path).unwrap();
        let mut prompt_json: Value = serde_json::from_reader(prompt_file).unwrap();
        // Modify json
        for (path, new_value) in modifications {
            prompt_json = replace_json_value(prompt_json, &path, new_value).map_err(|e| ProcessSingleJobError::Other(e))?;
        }
        // Save prompt.json
        let prompt_file = File::create(&workflow_path).unwrap();
        serde_json::to_writer(prompt_file, &prompt_json).unwrap();
    }


    // ==================== QUERY AND DOWNLOAD FILES ==================== //

    // Download SD model if specified
    let mut maybe_sd_path: Option<PathBuf> = None;
    match job_args.maybe_sd_model {
        Some(sd_model) => {
            let sd_dir = root_comfy_path.join("models").join("checkpoints");
            // make if not exist
            if !sd_dir.exists() {
                std::fs::create_dir_all(&sd_dir).unwrap();
            }
            let retrieved_sd_record =  get_weight_by_token(
                sd_model,
                false,
                &deps.db.mysql_pool
            ).await?.ok_or_else(|| ProcessSingleJobError::Other(anyhow!("SD model not found")))?;

            let bucket_details = RemoteCloudBucketDetails {
                object_hash: retrieved_sd_record.public_bucket_hash,
                prefix: retrieved_sd_record.maybe_public_bucket_prefix.unwrap(),
                suffix: retrieved_sd_record.maybe_public_bucket_extension.unwrap(),
            };
            let sd_filename = "model.safetensors";
            let sd_path = sd_dir.join(sd_filename).to_str().unwrap().to_string();
            remote_cloud_file_client.download_file(bucket_details, sd_path.clone()).await?;
            maybe_sd_path = Some(sd_path.parse().unwrap());
            info!("Downloaded SD model to {:?}", sd_path);
            maybe_sd_path = Some(sd_path.parse().unwrap());
        }
        None => {}
    }
    // Download Lora model if specified
    let mut maybe_lora_path: Option<PathBuf> = None;
    match job_args.maybe_lora_model {
        Some(lora_model) => {
            let lora_dir = root_comfy_path.join("models").join("loras");
            // make if not exist
            if !lora_dir.exists() {
                std::fs::create_dir_all(&lora_dir).unwrap();
            }
            let retrieved_lora_record =  get_weight_by_token(
                lora_model,
                false,
                &deps.db.mysql_pool
            ).await?.ok_or_else(|| ProcessSingleJobError::Other(anyhow!("Lora model not found")))?;
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
    // Download Input file if specified
    let mut maybe_input_path: Option<PathBuf> = None;
    match job_args.maybe_input_file {
        Some(input_file) => {
            let input_dir = root_comfy_path.join("input");
            // make if not exist
            if !input_dir.exists() {
                std::fs::create_dir_all(&input_dir).unwrap();
            }
            let retrieved_input_record =  get_media_file(
                input_file,
                false,
                &deps.db.mysql_pool
            ).await?.ok_or_else(|| ProcessSingleJobError::Other(anyhow!("Input file not found")))?;

            let media_file_bucket_path = MediaFileBucketPath::from_object_hash(
                &retrieved_input_record.public_bucket_directory_hash,
                retrieved_input_record.maybe_public_bucket_prefix.as_deref(),
                retrieved_input_record.maybe_public_bucket_extension.as_deref());

            //let input_filename = format!("input.{}", retrieved_input_record.maybe_public_bucket_extension.unwrap());
            let input_filename = "input.mp4".to_string();
            let input_path = path_to_string(input_dir.join(input_filename));

            //let bucket_details = RemoteCloudBucketDetails {
            //    object_hash: retrieved_input_record.public_bucket_directory_hash,
            //    prefix: retrieved_input_record.maybe_public_bucket_prefix.unwrap(),
            //    suffix: retrieved_input_record.maybe_public_bucket_extension.clone().unwrap(),
            //};
            //// Download to "input.EXTENSION"
            //remote_cloud_file_client.download_file(bucket_details, input_path.clone()).await?;

            remote_cloud_file_client.download_media_file(&media_file_bucket_path, input_path.clone()).await?;

            info!("Downloaded input file to {:?}", input_path);
            maybe_input_path = Some(input_path.parse().unwrap());
        }
        None => {}
    }

    // make outputs dir if not exist
    let output_dir = root_comfy_path.join("output");
    if !output_dir.exists() {
        std::fs::create_dir_all(&output_dir).unwrap();
    }

    // ==================== SETUP FOR INFERENCE ==================== //

    info!("Ready for ComfyUI inference...");

    job_progress_reporter.log_status("running inference")
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    info!("Running ComfyUI inference...");

    // ==================== RUN INFERENCE SCRIPT ==================== //

    let stderr_output_file = work_temp_dir.path().join("stderr.txt");
    let stdout_output_file = work_temp_dir.path().join("stdout.txt");

    let inference_start_time = Instant::now();

    let prompt_path = PathBuf::from(&workflow_path);

    let command_exit_status = model_dependencies
        .inference_command
        .execute_inference(InferenceArgs {
            stderr_output_file: &stderr_output_file,
            stdout_output_file: &stdout_output_file,
            prompt_location: &prompt_path,
        });

    let inference_duration = Instant::now().duration_since(inference_start_time);

    info!("Inference took duration to complete: {:?}", &inference_duration);

    // ==================== GET OUTPUT FILE ======================== //
    let mut output_file = root_comfy_path.join("output");
    output_file = output_file.join(job_args.output_path);

    // ==================== CHECK ALL FILES EXIST AND GET METADATA ==================== //

    // check stdout for success and check if file exists
    let stdout_output = read_to_string(&stdout_output_file).unwrap();
    // check for "Prompt executed" in stdout (comfyui only outputs this for success)
    if !stdout_output.contains("Prompt executed") || check_file_exists(&output_file).is_err() {
        error!("Inference failed: {:?}", command_exit_status);

        error!("Captured stdout output: {}", stdout_output);
        error!("Captured stderr output: {}", read_to_string(&stderr_output_file).unwrap());

        let error = ProcessSingleJobError::Other(anyhow!("CommandExitStatus: {:?}", command_exit_status));

        if let Ok(contents) = read_to_string(&stderr_output_file) {
            warn!("Captured stderr output: {}", contents);
        }

        safe_delete_temp_file(&stderr_output_file);
        safe_delete_temp_file(&stdout_output_file);
        safe_delete_temp_directory(&work_temp_dir);
        safe_delete_temp_file(&workflow_path);
        if let Some(sd_path) = maybe_sd_path {
            safe_delete_temp_file(&sd_path);
        }
        if let Some(lora_path) = maybe_lora_path {
            safe_delete_temp_file(&lora_path);
        }
        if let Some(input_path) = maybe_input_path {
            safe_delete_temp_file(&input_path);
        }
        let output_dir = root_comfy_path.join("output");
        recursively_delete_files_in(&output_dir).unwrap();

        return Err(error);
    }

    info!("Interrogating result file size ...");

    let file_size_bytes = file_size(&output_file)
        .map_err(|err| ProcessSingleJobError::Other(err))?;

    info!("Interrogating result mimetype ...");

    let mimetype = get_mimetype_for_file(&output_file)
        .map_err(|err| ProcessSingleJobError::from_io_error(err))?
        .map(|mime| mime.to_string())
        .ok_or(ProcessSingleJobError::Other(anyhow!("Mimetype could not be determined")))?;

    // create ext from mimetype
    let ext = match mimetype.as_str() {
        "video/mp4" => "mp4",
        "image/png" => "png",
        "image/jpeg" => "jpg",
        _ => return Err(ProcessSingleJobError::Other(anyhow!("Mimetype not supported: {}", mimetype))),
    };

    // create prefix from mimetype
    let prefix = match mimetype.as_str() {
        "video/mp4" => "video",
        "image/png" => "image",
        "image/jpeg" => "image",
        _ => return Err(ProcessSingleJobError::Other(anyhow!("Mimetype not supported: {}", mimetype))),
    };

    // determine media type from mime type
    let media_type = match mimetype.as_str() {
        "video/mp4" => MediaFileType::Video,
        "image/png" => MediaFileType::Image,
        "image/jpeg" => MediaFileType::Image,
        _ => return Err(ProcessSingleJobError::Other(anyhow!("Mimetype not supported: {}", mimetype))),
    };

    info!("Calculating sha256...");

    let file_checksum = sha256_hash_file(&output_file)
        .map_err(|err| {
            ProcessSingleJobError::Other(anyhow!("Error hashing file: {:?}", err))
        })?;

    // ==================== UPLOAD VIDEO TO BUCKET ==================== //

    job_progress_reporter.log_status("uploading result")
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    let result_bucket_location = MediaFileBucketPath::generate_new(
        Some(prefix),
        Some(ext));

    let result_bucket_object_pathbuf = result_bucket_location.to_full_object_pathbuf();

    info!("Output file destination bucket path: {:?}", &result_bucket_object_pathbuf);

    info!("Uploading media ...");

    args.job_dependencies.buckets.public_bucket_client.upload_filename_with_content_type(
        &result_bucket_object_pathbuf,
        &output_file,
        &mimetype) // TODO: We should check the mimetype to make sure bad payloads can't get uploaded
        .await
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    // ==================== DELETE TEMP FILES ==================== //

    safe_delete_temp_file(&stderr_output_file);
    safe_delete_temp_file(&stdout_output_file);
    safe_delete_temp_file(&workflow_path);
    if let Some(sd_path) = maybe_sd_path {
        safe_delete_temp_file(&sd_path);
    }
    if let Some(lora_path) = maybe_lora_path {
        safe_delete_temp_file(&lora_path);
    }
    if let Some(input_path) = maybe_input_path {
        safe_delete_temp_file(&input_path);
    }

    let output_dir = root_comfy_path.join("output");
    recursively_delete_files_in(&output_dir).unwrap();

    // NB: We should be using a tempdir, but to make absolutely certain we don't overflow the disk...
    safe_delete_temp_directory(&work_temp_dir);

    // ==================== SAVE RECORDS ==================== //

    info!("Saving ComfyUI result (media_files table record) ...");

    let (media_file_token, id) = insert_media_file_from_comfy_ui(InsertArgs {
        pool: &args.job_dependencies.db.mysql_pool,
        job: &job,
        maybe_mime_type: Some(&mimetype),
        file_size_bytes,
        sha256_checksum: &file_checksum,
        public_bucket_directory_hash: result_bucket_location.get_object_hash(),
        maybe_public_bucket_prefix: Some(prefix),
        maybe_public_bucket_extension: Some(ext),
        is_on_prem: args.job_dependencies.job.info.container.is_on_prem,
        worker_hostname: &args.job_dependencies.job.info.container.hostname,
        worker_cluster: &args.job_dependencies.job.info.container.cluster_name,
        media_file_type: media_type,
    })
        .await
        .map_err(|e| ProcessSingleJobError::Other(e))?;

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

fn replace_json_value(json: Value, path: &str, new_value: NewValue) -> anyhow::Result<Value> {
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
        match &new_value {
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
