use anyhow::anyhow;

use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;

use crate::job::job_loop::job_success_result::JobSuccessResult;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::tts::vall_e_x::process_job_create_voice::process_create_voice;
use crate::job::job_types::tts::vall_e_x::process_job_inference_voice::process_inference_voice;
use crate::job::job_types::tts::vall_e_x::validate_job::validate_job;
use crate::job_dependencies::JobDependencies;

use super::validate_job::JobType;

// This will download everything get into the root host OS then ... will invoke inference using the pathes from the files invoked
pub struct VALLEXProcessJobArgs<'a> {
    pub job_dependencies: &'a JobDependencies,
    pub job: &'a AvailableInferenceJob,
}

<<<<<<< HEAD
pub async fn process_create_voice(
    args: VALLEXProcessJobArgs<'_>,
    dataset_token: String
) -> Result<JobSuccessResult, ProcessSingleJobError> {
    let deps = args.job_dependencies;
    let job = args.job;
    let mysql_pool = &deps.mysql_pool;

    // get some globals
    let mut job_progress_reporter = deps.job_progress_reporter
        .new_generic_inference(job.inference_job_token.as_str())
        .map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

    info!("token! {}", dataset_token);
    let voice_dataset_token = tokens::tokens::zs_voice_datasets::ZsVoiceDatasetToken(dataset_token);

    let creator_ip_address = &job.creator_ip_address;
    
    // let creator_user_token:UserToken;

    // match &job.maybe_creator_user_token {
    //     Some(token) => {
    //         creator_user_token = UserToken::new_from_str(token);
    //     },
    //     None => {
    //         return Err(ProcessSingleJobError::InvalidJob(anyhow!("Missing Creator User Token")));
    //     }
    // }

    // STEP 1. SETUP A TEMP DIRECTORY
    let work_temp_dir = format!("/tmp/temp_zeroshot_create_voice_{}", job.id.0);
    // NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
    let work_temp_dir = args.job_dependencies.fs.scoped_temp_dir_creator_for_work
        .new_tempdir(&work_temp_dir)
        .map_err(|e| ProcessSingleJobError::from_io_error(e))?;

    let workdir = work_temp_dir.path().to_path_buf();

    // STEP 2. Get dataset for the title for the voice
    let voice_dataset = get_dataset_by_token(&voice_dataset_token, false, &mysql_pool).await;
    let single_dataset: ZsDataset;
    match voice_dataset {
        Ok(val) => {
            match val {
                Some(val) => {
                    single_dataset = val;
                }
                None => {
                    return Err(ProcessSingleJobError::InvalidJob(anyhow!("Missing Dataset")));
                }
            }
        }
        Err(e) => {
            return Err(ProcessSingleJobError::from_anyhow_error(e));
        }
    }
    info!("Title:{} Token:{}", &single_dataset.title, &single_dataset.token);

    // STEP 3. Download dataset each audio file
    let result = list_dataset_samples_for_dataset_token(
        &voice_dataset_token,
        false,
        &mysql_pool
    ).await;
    let dataset: Vec<DatasetSampleRecordForList>;

    match result {
        Ok(val) => {
            dataset = val;
        }
        Err(e) => {
            return Err(ProcessSingleJobError::from_anyhow_error(e));
        }
    }

    info!("Dataset length info: {}", dataset.len());

    let temp_extension = String::from(".bin");
    let temp_prefix:String;

    if deps.container.is_on_prem == false {
        temp_prefix = String::from("sample_"); // this is for seed in local dev to download the samples
    } else {
        temp_prefix = String::from(BUCKET_FILE_PREFIX_CREATE);
    }

    let mut downloaded_dataset: Vec<PathBuf> = Vec::new();

    for (index, record) in dataset.iter().enumerate() {
        //https://storage.googleapis.com/dev-vocodes-public/media/5/3/3/w/8/533w8zs0fy11nv7gkcna7p7vt03h8nda/dev_zs_533w8zs0fy11nv7gkcna7p7vt03h8nda.bin <-- where the file actually is
    
        let prefix: Option<&str> = Some(&temp_prefix); // record.maybe_public_bucket_prefix.as_ref().map(|s| s.as_str());
        let extension: Option<&str> = Some(&temp_extension); //record.maybe_public_bucket_extension
            // .as_ref()
            // .map(|s| s.as_str());
        // naming
        //[2023-10-23T01:26:46Z INFO  inference_job::job::job_types::tts::vall_e_x::process_job] Upload Bucket Path: /media/9/j/6/g/c/9j6gcd3ngb70ybpsq1rv4tw3gk97ds3t/fakeyou_9j6gcd3ngb70ybpsq1rv4tw3gk97ds3t.npz
        //[2023-10-23T01:26:46Z INFO  inference_job::job::job_types::tts::vall_e_x::process_job] Upload File Path: /tmp/temp_zeroshot_create_voice_11.1BLk16qTwhuo/temp.npz

        info!(
            "Record=> hash:{} prefix:{:?} extension:{:?}",
            record.public_bucket_directory_hash,
            prefix,
            extension
        );

        let audio_media_file = MediaFileBucketPath::from_object_hash(
            &record.public_bucket_directory_hash,
            prefix,
            extension
        );

        info!(
            "Download using audio_media_file_path: {}",
            audio_media_file.to_full_object_pathbuf().to_string_lossy()
        );

        let file_name_wav = format!("{}.wav", index);
        let mut file_path = PathBuf::new();
        file_path.push(workdir.clone());
        file_path.push(file_path.clone());
        file_path.push(file_name_wav);

        info!("Downloading to path: {:?}", file_path);

        // TODO: we might want to catch the error and not include the pathes into download dataset?
        let result = deps.public_bucket_client.download_file_to_disk(
            audio_media_file.to_full_object_pathbuf(),
            &file_path
        ).await;

        if let Err(err) = result {
            error!("could not download sample: {:?}", err);
            return Err(ProcessSingleJobError::from_anyhow_error(err));
        }

        info!("FilePath to clone voice: {}", file_path.to_string_lossy());
        downloaded_dataset.push(file_path.clone());
    }

    info!("Dataset Length {}", downloaded_dataset.len());

    // STEP 4 Download the models
    info!("Download models (if not present)...");
    for downloader in deps.job_type_details.vall_e_x.downloaders.all_downloaders() {
        let result = downloader.download_if_not_on_filesystem(
            &args.job_dependencies.private_bucket_client,
            &args.job_dependencies.fs.scoped_temp_dir_creator_for_downloads
        ).await;
        if let Err(e) = result {
            error!("could not download: {:?}", e);
            return Err(ProcessSingleJobError::from_anyhow_error(e));
        }
    }

    job_progress_reporter
        .log_status("running inference")
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    let inference_start_time = Instant::now();

    // Command line arg for a list of paths to insert the container
    let audio_files = join_paths(downloaded_dataset);

    info!("Files to process: {:?}", audio_files);

    // Name of the output file
    let output_file_name = String::from("temp"); // don't use the extension... for the inference since the container will add the extension.

    let stderr_output_file = work_temp_dir.path().join("zero_shot_create_voice_err.txt");

    // Run Inference
    let command_exit_status =
        args.job_dependencies.job_type_details.vall_e_x.create_embedding_command.execute_inference(
            job::job_types::tts::vall_e_x::vall_e_x_inference_command::CreateVoiceInferenceArgs {
                output_embedding_path: &workdir,
                output_embedding_name: output_file_name.clone(),
                audio_files,
                stderr_output_file: &stderr_output_file,
            }
        );

    let inference_duration = Instant::now().duration_since(inference_start_time);


    if !command_exit_status.is_success() {
        error!("Create Embedding Failed: {:?}", command_exit_status);

        let error = ProcessSingleJobError::Other(anyhow!("CommandExitStatus: {:?}", command_exit_status));

        if let Ok(contents) = read_to_string(&stderr_output_file) {
            warn!("Captured stderr output: {}", contents);

            // Re-categorize error?
            //match categorize_error(&contents)  {
            //    Some(ProcessSingleJobError::FaceDetectionFailure) => {
            //        warn!("Face not detected in source image");
            //        error = ProcessSingleJobError::FaceDetectionFailure;
            //    }
            //    _ => {}
            //}
        }

        //thread::sleep(Duration::from_secs(300));

        // Clean up temp files
        //safe_delete_temp_file(&audio_path.filesystem_path);
        //safe_delete_temp_file(&image_path.filesystem_path);
        //safe_delete_temp_file(&usable_image_path);
        //safe_delete_temp_file(&output_video_fs_path);
        //safe_delete_temp_file(&stderr_output_file);
        //safe_delete_temp_directory(&work_temp_dir);

        return Err(error);
    }


    // STEP 4. Download dataset each audio file
    info!("Uploading Media ...");

    let result_bucket_location: MediaFileBucketPath = MediaFileBucketPath::generate_new(
        Some(BUCKET_FILE_PREFIX_CREATE),
        Some(BUCKET_FILE_EXTENSION_CREATE)
    );
    
    let result_bucket_object_pathbuf = result_bucket_location.to_full_object_pathbuf();

    // Get Finished File
    let mut finished_file = work_temp_dir.path().to_path_buf();
    //let mut finished_file = workdir;

    let output_bucket_file_name = String::from("temp.npz"); // use extension for bucket upload.
    finished_file.push(&output_bucket_file_name);

    info!("Upload Bucket Path: {:?}", result_bucket_object_pathbuf);
    info!("Upload File Path: {:?}", finished_file);

    args.job_dependencies.private_bucket_client
        .upload_filename_with_content_type(
            &result_bucket_object_pathbuf,
            &finished_file,
            &MIME_TYPE_CREATE
        )
        .await // TODO: We should check the mimetype to make sure bad payloads can't get uploaded
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    // CLEARIFY! these items
    // 1.Should this be object hash?
    let bucket_hash = result_bucket_location.get_object_hash().clone();
    // 2.As well as this what should the voice name be?
    let voice_name = single_dataset.title;

    // insert record
    let voice_token = create_voice(CreateVoiceArgs {
        dataset_token: &voice_dataset_token,
        model_category: ZsVoiceModelCategory::Tts,
        model_type: ZsVoiceModelType::VallEX,
        model_version: 0,
        model_encoding_type: ZsVoiceEncodingType::Encodec,
        voice_title: &voice_name,
        bucket_hash,
        maybe_creator_user_token: Some(&UserToken("...".to_string())),
        creator_ip_address: &creator_ip_address,
        creator_set_visibility: Visibility::Public,
        mysql_pool,
    }).await;
    
    let media_file_token = MediaFileToken::generate();

    match voice_token {
        Ok(_value) => {
            Ok(JobSuccessResult {
                maybe_result_entity: Some(ResultEntity {
                    entity_type: InferenceResultType::MediaFile,
                    entity_token: media_file_token.to_string(),
                }),
                inference_duration,
            })
        }
        Err(e) => { Err(ProcessSingleJobError::Other(e)) }
    }
}

pub async fn process_inference_voice(
    args: VALLEXProcessJobArgs<'_>,
    voice_token: String
) -> Result<JobSuccessResult, ProcessSingleJobError> {
    let deps = args.job_dependencies;
    let job = args.job;
    let mysql_pool = &deps.mysql_pool;
    // get some globals
    let mut job_progress_reporter = deps.job_progress_reporter
        .new_generic_inference(job.inference_job_token.as_str())
        .map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

    // get job args
    let text = match job.maybe_raw_inference_text.clone() {
        Some(value) => { value }
        None => {
            return Err(ProcessSingleJobError::InvalidJob(anyhow!("Missing Text for Inference")));
        }
    };

    let voice_token = tokens::tokens::zs_voices::ZsVoiceToken(voice_token);

    // Get voice bucket hash - from voice token
    let voice_lookup_result = get_voice_by_token(&voice_token, false, &mysql_pool).await;

    let voice = match voice_lookup_result {
        Ok(Some(voice)) => voice,
        Ok(None) => {
            warn!("Voice not found: {:?}", voice_token);
            return Err(ProcessSingleJobError::Other(anyhow!("Voice not found: {:?}", voice_token)));
        }
        Err(err) => {
            warn!("Error looking up voice: {:?}", err);
            return Err(ProcessSingleJobError::Other(anyhow!("Error looking up voice: {:?}", err)));
        }
    };

    // Need to download the models
    info!("Download models (if not present)...");

    for downloader in deps.job_type_details.vall_e_x.downloaders.all_downloaders() {
        let result = downloader.download_if_not_on_filesystem(
            &args.job_dependencies.private_bucket_client,
            &args.job_dependencies.fs.scoped_temp_dir_creator_for_downloads
        ).await;

        if let Err(e) = result {
            error!("could not download: {:?}", e);
            return Err(ProcessSingleJobError::from_anyhow_error(e));
        }
    }

    // Might not need this for inference.
    // let creator_user_token:UserToken;
    // match &job.maybe_creator_user_token {
    //     Some(token) => {
    //         creator_user_token = UserToken::new_from_str(token);
    //     },
    //     None => {
    //         return Err(ProcessSingleJobError::InvalidJob(anyhow!("Missing Creator User Token")));
    //     }
    // }

    // run inference
    let work_temp_dir = format!("/tmp/temp_zeroshot_inference_{}", job.id.0);

    // NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
    let work_temp_dir = args.job_dependencies.fs.scoped_temp_dir_creator_for_work
        .new_tempdir(&work_temp_dir)
        .map_err(|e| ProcessSingleJobError::from_io_error(e))?;

    let workdir = work_temp_dir.path().to_path_buf();

    let file_name = format!("{}_weights.npz", &voice.title);

    // USE THIS LATER SINCE it requires specific typing ...
    let voiceFile = download_voice_embedding_from_hash(
        &voice.bucket_hash,
        &file_name,
        &deps.private_bucket_client,
        &workdir
    ).await?;

    println!("voicefile path! {}", voiceFile.filesystem_path.to_string_lossy());

    // Download embeddings file using embedding token
    // Create a temp dir to download things to
    job_progress_reporter
        .log_status("running inference")
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    let inference_start_time = Instant::now();

    let output_file_name = String::from("output.wav");

    // Run Inference
    let command_exit_status =
        args.job_dependencies.job_type_details.vall_e_x.inference_command.execute_inference(
            InferenceArgs {
                input_embedding_path: &workdir,
                input_embedding_name: file_name,
                input_text: String::from(text), // text
                output_file_name: output_file_name.clone(), // output file name in the output folder
                stderr_output_file: String::from("zero_shot_inference.txt"),
            }
        );

    let inference_duration = Instant::now().duration_since(inference_start_time);

    // upload audio to bucket
    info!("Uploading media ...");

    let result_bucket_location = MediaFileBucketPath::generate_new(
        Some(BUCKET_FILE_PREFIX),
        Some(BUCKET_FILE_EXTENSION)
    );

    let result_bucket_object_pathbuf = result_bucket_location.to_full_object_pathbuf();

    // Finished file path
    let mut finished_file = work_temp_dir.path().to_path_buf();
    finished_file.push(&output_file_name);

    info!("Upload Bucket Path: {:?}", result_bucket_object_pathbuf);
    info!("Upload File Path: {:?}", finished_file);

    args.job_dependencies.public_bucket_client
        .upload_filename_with_content_type(
            &result_bucket_object_pathbuf,
            &finished_file,
            &MIME_TYPE
        )
        .await 
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    // ==================== UPLOAD AUDIO TO BUCKET ====================
    info!("Calculating sha256...");

    let file_checksum = sha256_hash_file(&finished_file).map_err(|err| {
        ProcessSingleJobError::Other(anyhow!("Error hashing file: {:?}", err))
    })?;

    let file_size_bytes = file_size(&finished_file).map_err(|err|
        ProcessSingleJobError::Other(err)
    )?;

    job_progress_reporter.log_status("done").map_err(|e| ProcessSingleJobError::Other(e))?;

    // insert into db the record
    let (media_file_token, id) = insert_media_file_from_zero_shot(InsertArgs {
        pool: &args.job_dependencies.mysql_pool,
        job: &job,
        maybe_mime_type: Some(&MIME_TYPE),
        file_size_bytes,
        sha256_checksum: &file_checksum,
        public_bucket_directory_hash: result_bucket_location.get_object_hash(),
        maybe_public_bucket_prefix: Some(BUCKET_FILE_PREFIX),
        maybe_public_bucket_extension: Some(BUCKET_FILE_EXTENSION),
        is_on_prem: args.job_dependencies.container.is_on_prem,
        worker_hostname: &args.job_dependencies.container.hostname,
        worker_cluster: &args.job_dependencies.container.cluster_name,
    }).await.map_err(|e| ProcessSingleJobError::Other(e))?;

    info!(
        "Job {:?} complete success! Downloaded, ran inference, and uploaded. Saved model record: {}, Result Token: {}",
        job.id,
        id,
        &media_file_token
    );

    Ok(JobSuccessResult {
        maybe_result_entity: Some(ResultEntity {
            entity_type: InferenceResultType::MediaFile,
            entity_token: media_file_token.to_string(),
        }),
        inference_duration,
    })
}
=======


>>>>>>> master
// query using the token then grab the bucket hash
pub async fn process_job(
    args: VALLEXProcessJobArgs<'_>
) -> Result<JobSuccessResult, ProcessSingleJobError> {
    let job = args.job;

    // get args token
    let jobArgs = validate_job(&job)?; // bubbles error up

    match jobArgs.job_type {
        JobType::Create => {
            if let Some(voice_dataset_token) = jobArgs.voice_dataset_token {
                process_create_voice(args, voice_dataset_token).await
            } else {
                Err(ProcessSingleJobError::Other(anyhow!("Missing Dataset Token?")))
            }
        }
        JobType::Inference => {
            if let Some(voice_token) = jobArgs.voice_token {
                process_inference_voice(args, voice_token).await
            } else {
                Err(ProcessSingleJobError::Other(anyhow!("Missing Voice Token?")))
            }
        }
    }
}

