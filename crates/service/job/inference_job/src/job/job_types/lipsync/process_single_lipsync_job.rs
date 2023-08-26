use anyhow::anyhow;
use crate::job::job_loop::job_success_result::JobSuccessResult;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::vc::rvc_v2::process_job::RvcV2ProcessJobArgs;
use crate::job::job_types::vc::so_vits_svc::process_job::SoVitsSvcProcessJobArgs;
use crate::job::job_types::vc::{rvc_v2, so_vits_svc};
use crate::job_dependencies::JobDependencies;
use enums::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::voice_conversion::inference::get_voice_conversion_model_for_inference::get_voice_conversion_model_for_inference;
use std::time::Duration;
use log::{error, info};
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use mysql_queries::queries::media_uploads::get_media_upload_for_inference::get_media_upload_for_inference;
use tokens::files::media_upload::MediaUploadToken;

pub async fn process_single_lipsync_job(job_dependencies: &JobDependencies, job: &AvailableInferenceJob) -> Result<JobSuccessResult, ProcessSingleJobError> {

  let job_success_result = match job.maybe_model_type {
    Some(InferenceModelType::SadTalker) => {
      //rvc_v2::process_job::process_job(RvcV2ProcessJobArgs {
      //  job_dependencies,
      //  job,
      //  vc_model: &vc_model,
      //  media_upload_token: &media_upload_token,
      //  media_upload: &media_upload,
      //}).await?
      return Err(ProcessSingleJobError::Other(anyhow!("not yet implemented")))
    }
    Some(model_type) => return Err(ProcessSingleJobError::Other(anyhow!("wrong model type: {:?}", model_type))),
    None => return Err(ProcessSingleJobError::Other(anyhow!("no model type in record"))),
  };

  Ok(job_success_result)
}

