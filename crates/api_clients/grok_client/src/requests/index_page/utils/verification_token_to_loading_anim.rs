use crate::error::grok_client_error::GrokClientError;
use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use log::error;

#[derive(Debug, Clone)]
pub struct LoadingAnim(pub(crate) String);

/// The verification token comes from the index HTML.
pub fn verification_token_to_loading_anim(verification_token: &str) -> Result<LoadingAnim, GrokClientError> {
  let decoded_bytes = BASE64_STANDARD.decode(verification_token)
      .map_err(|err| {
        error!("Failed to decode verification token: {} ; err = {:?}", verification_token, err);
        GrokClientError::FailedToDecodeVerificationToken(err)
      })?;

  // This arbitrary algorithm is used by Grok.
  // See https://github.com/realasfngl/Grok-Api

  let byte = decoded_bytes.get(5)
      .map(|byte| *byte)
      .ok_or(GrokClientError::InvalidVerificationTokenBytes)?;

  let anim = byte % 4;

  Ok(LoadingAnim(format!("loading-x-anim-{}", anim)))
}

#[cfg(test)]
mod tests {
  use crate::requests::index_page::utils::verification_token_to_loading_anim::verification_token_to_loading_anim;

  #[test]
  fn test() {
    assert_eq!(&verification_token_to_loading_anim("aezWdJW6+WJhvtMA1faxopO11Q1JRcM6j7JcW/R0gO09CQhO7GzIs760yo1A0MnF").unwrap().0, "loading-x-anim-2");
    assert_eq!(&verification_token_to_loading_anim("wROL4+VivbPuVc37N+4VNq0K3cEMW0bPKuToO6JWxJ9fzsP3Rsn2eC8DDDZFFlov").unwrap().0, "loading-x-anim-2");
    assert_eq!(&verification_token_to_loading_anim("ckWUvquxT8AdPRpdjXTeNkkXRfKiGGnQFH3Hq4aznsUrSsjtDSI4JcO59j7U/+VQ").unwrap().0, "loading-x-anim-1");
  }
}
