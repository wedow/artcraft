use fal_client::export::prelude::rundiffusion_fal::juggernaut_flux::pro::pro;
use crate::http_server::common_responses::common_web_error::CommonWebError;

pub fn payments_error_test(prompt: &str) -> Result<(), CommonWebError> {
  let prompt = prompt.trim().to_ascii_lowercase();
  
  if prompt.contains("test") {
    if prompt.contains("payment") {
      return Err(CommonWebError::PaymentRequired)
    }
    if prompt.contains("stripe") {
      return Err(CommonWebError::PaymentRequired)
    }
    if prompt.contains("error") {
      return Err(CommonWebError::PaymentRequired)
    }
  }
  
  if prompt.contains("payment") && prompt.contains("error") {
    return Err(CommonWebError::PaymentRequired)
  }
  
  Ok(())
}
