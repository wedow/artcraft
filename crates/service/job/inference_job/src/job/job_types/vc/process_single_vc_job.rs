use std::time::Duration;

use anyhow::anyhow;
use log::{error, info};

use enums::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::media_uploads::get_media_upload_for_inference::get_media_upload_for_inference;
use mysql_queries::queries::voice_conversion::inference::get_voice_conversion_model_for_inference::get_voice_conversion_model_for_inference;
use tokens::files::media_upload::MediaUploadToken;

use crate::job::job_loop::job_success_result::JobSuccessResult;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::vc::{rvc_v2, so_vits_svc};
use crate::job::job_types::vc::rvc_v2::process_job::RvcV2ProcessJobArgs;
use crate::job::job_types::vc::so_vits_svc::process_job::SoVitsSvcProcessJobArgs;
use crate::job_dependencies::JobDependencies;

pub async fn process_single_vc_job(job_dependencies: &JobDependencies, job: &AvailableInferenceJob) -> Result<JobSuccessResult, ProcessSingleJobError> {

  let model_token = match job.maybe_model_token.as_deref() {
    Some(token) => token,
    None => {
      return Err(ProcessSingleJobError::InvalidJob(
        anyhow!("No model token for job: {:?}", job.inference_job_token)));
    }
  };

  // TODO: Interrogate cache (which also depends on other flags)
  let maybe_vc_model = get_voice_conversion_model_for_inference(
    &job_dependencies.mysql_pool, model_token)
      .await
      .map_err(|err| {
        ProcessSingleJobError::Other(anyhow!("database error: {:?}", err))
      })?;

  let vc_model = match maybe_vc_model {
    None => return Err(ProcessSingleJobError::Other(anyhow!("vc model not found: {:?}", model_token))),
    Some(model) => model,
  };

  // TODO: Look for model files on filesystem

  // TODO: Attempt to grab job lock

  //let maybe_media_upload_token = job.maybe_inference_args
  //    .as_ref()
  //    .map(|args| args.args.as_ref())
  //    .flatten()
  //    .map(|args| {
  //      match args {
  //        PolymorphicInferenceArgs::TextToSpeechInferenceArgs { .. } => None,
  //        PolymorphicInferenceArgs::VoiceConversionInferenceArgs { maybe_media_token } => maybe_media_token.clone(),
  //      }
  //    })
  //    .flatten();

  let maybe_media_upload_token = job.maybe_input_source_token
      .as_deref()
      .map(MediaUploadToken::new_from_str);

  let media_upload_token = match maybe_media_upload_token {
    None => return Err(ProcessSingleJobError::Other(anyhow!("no associated media upload for vc job: {:?}", job.inference_job_token))),
    Some(token) => token,
  };

  let maybe_media_upload_result =
      get_media_upload_for_inference(&media_upload_token, &job_dependencies.mysql_pool).await;

  let media_upload = match maybe_media_upload_result {
    Ok(Some(media_upload)) => media_upload,
    Ok(None) => {
      error!("no media upload record found for token: {:?}", media_upload_token);
      return Err(ProcessSingleJobError::Other(anyhow!("no media upload record found for token: {:?}", media_upload_token)));
    },
    Err(err) => {
      error!("error fetching media upload record from db: {:?}", err);
      return Err(ProcessSingleJobError::Other(err));
    },
  };

  info!("Source media upload file size (bytes): {}", &media_upload.original_file_size_bytes);
  info!("Source media upload duration (millis): {}", &media_upload.original_duration_millis);
  info!("Source media upload duration (seconds): {}", (media_upload.original_duration_millis as f32 / 1000.0));

  let job_success_result = match vc_model.model_type {
    VoiceConversionModelType::RvcV2 => {
      rvc_v2::process_job::process_job(RvcV2ProcessJobArgs {
        job_dependencies,
        job,
        vc_model: &vc_model,
        media_upload_token: &media_upload_token,
        media_upload: &media_upload,
      }).await?
    }
    VoiceConversionModelType::SoVitsSvc => {
      so_vits_svc::process_job::process_job(SoVitsSvcProcessJobArgs {
        job_dependencies,
        job,
        vc_model: &vc_model,
        media_upload_token: &media_upload_token,
        media_upload: &media_upload,
      }).await?
    }
    VoiceConversionModelType::SoftVc => {
      // TODO: Not yet implemented.
      JobSuccessResult { maybe_result_entity: None, inference_duration: Duration::from_secs(0) }
    }
  };

  Ok(job_success_result)
}

