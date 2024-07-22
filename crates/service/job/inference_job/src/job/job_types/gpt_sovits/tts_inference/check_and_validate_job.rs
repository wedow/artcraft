use anyhow::anyhow;

use mysql_queries::payloads::generic_inference_args::generic_inference_args::InferenceCategoryAbbreviated;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use tokens::tokens::model_weights::ModelWeightToken;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;

#[derive(Serialize, Debug)]
pub struct JobArgs {
  pub input_text: String,
  pub gpt_sovits_model: ModelWeightToken,
  pub reference_free: Option<bool>,
  pub temperature: Option<f32>,
  pub target_language: Option<String>,
}

pub fn check_and_validate_job(job: &AvailableInferenceJob) -> Result<JobArgs, ProcessSingleJobError> {
  let inference_args = job.maybe_inference_args
    .as_ref()
    .map(|args| args.args.as_ref())
    .flatten();

  let inference_category = job.maybe_inference_args
    .as_ref()
    .map(|args| args.inference_category)
    .flatten();

  match inference_category {
    Some(InferenceCategoryAbbreviated::GptSovits) => {}, // Valid
    Some(InferenceCategoryAbbreviated::TextToSpeech) => {},
    _ => {
      return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("wrong inference category for job!")));
    }
  };

  // let inference_args = match inference_args {
  //   Some(args) => args,
  //   None => {
  //     return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("no inference args for job!")));
  //   }
  // };
  //
  // let inference_args = match inference_args {
  //   PolymorphicInferenceArgs::Gs(inference_args) => inference_args,
  //   _ => {
  //     return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("wrong inner args for job!")));
  //   }
  // };
  //
  let input_text = match &job.maybe_raw_inference_text {
    Some(text) => text.clone(),
    None => {
      return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("no raw inference text for job!")));
    }
  };

  let gpt_sovits_model = match &job.maybe_model_token {
    Some(token) => ModelWeightToken::new_from_str(token),
    None => {
      return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("no model token for job!")));
    }
  };


  Ok(JobArgs {
    input_text: input_text,
    gpt_sovits_model: gpt_sovits_model,
    reference_free: None,
    temperature: None,
    target_language: None,
  })
}