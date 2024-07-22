use errors::AnyhowResult;

use crate::job::job_types::gpt_sovits::gpt_sovits_inference_command::GptSovitsInferenceCommand;

pub struct GptSovitsDependencies {
  pub inference_command: GptSovitsInferenceCommand,
}


impl GptSovitsDependencies {
  pub fn setup() -> AnyhowResult<Self> {
    Ok(Self {
      inference_command: GptSovitsInferenceCommand::from_env()?,
    })
  }
}