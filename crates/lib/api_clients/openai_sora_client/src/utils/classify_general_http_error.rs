use crate::sora_error::SoraError;

/// This assumes the request failed and returned a non-200.
/// The caller should check.
pub async fn classify_general_http_error(response: reqwest::Response) -> SoraError {
  let status = response.status();
  let message = match response.text().await {
    Ok(text) => text,
    Err(err) => return SoraError::ReqwestError(err),
  };
  
  /*
  
Old cookie - 

Message: {
  "error": {
    "message": "Your authentication token has expired. Please try signing in again.",
    "type": "invalid_request_error",
    "param": null,
    "code": "token_expired"
  }
}

No cookie - 

Message: {
  "error": {
    "message": "Your authentication token has expired. Please try signing in again.",
    "type": "invalid_request_error",
    "param": null,
    "code": "token_expired"
  }
}
   */

  // TODO: I *think* this is just the bearer token, not the cookie.
  let cookie_expired =
      message.contains("Your authentication token has expired. Please try signing in again.")
          || message.contains("token_expired");

  if cookie_expired {
    return SoraError::UnauthorizedCookieOrBearerExpired
  }

  if status.as_u16() == 502 {
    return SoraError::BadGateway(message);
  }

  SoraError::OtherBadStatus(anyhow::anyhow!("Upload failed with status {}: {}", status, message))
}
