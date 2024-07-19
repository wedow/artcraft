use anyhow::anyhow;

use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;

use crate::job::job_loop::job_success_result::JobSuccessResult;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::gpt_sovits::upload_model::process_gpt_sovits_upload_job::process_gpt_sovits_upload_job;
use crate::job::job_types::workflow::upload_workflow::process_upload_workflow_job::process_upload_workflow_job;
use crate::job::job_types::workflow::video_style_transfer::extract_vst_workflow_payload_from_job::extract_vst_workflow_payload_from_job;
use crate::job::job_types::workflow::video_style_transfer::process_video_style_transfer_job::process_video_style_transfer_job;
use crate::state::job_dependencies::JobDependencies;

pub async fn process_single_gpt_sovits_job(
  job_dependencies: &JobDependencies,
  job: &AvailableInferenceJob
) -> Result<JobSuccessResult, ProcessSingleJobError> {

  // First try to dispatch with the newer "job type".
  match job.job_type {
    InferenceJobType::GptSovits => {
      let job_success_result = process_gpt_sovits_upload_job(job_dependencies, job).await?;
      return Ok(job_success_result);
    }
    _ => {
      return Err(ProcessSingleJobError::Other(anyhow!("tts model type not set")))
    }
  }

  // If we couldn't dispatch with "job type", fall back to older heuristics.
  let workflow_args = extract_vst_workflow_payload_from_job(&job)?;

  let job_success_result = match workflow_args.maybe_google_drive_link {
    Some(_link) => {
      process_upload_workflow_job(job_dependencies, job).await?
    }
    None => {
      process_video_style_transfer_job(job_dependencies, job).await?
    }
  };

  Ok(job_success_result)
}