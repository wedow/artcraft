use crate::cloudflare_error::CloudflareError;

/// This only filters out Cloudflare errors. Any other errors will be returned as `Ok(())`.
pub fn filter_cloudflare_errors(status_code: u16, body: &str) -> Result<(), CloudflareError> {
  if status_code >= 200 && status_code < 300 {
    return Ok(());
  }

  match status_code {
    403 => {
      if body.contains("challenge-platform")
          || body.contains("challenge-error-text")
          || body.contains("cType: 'managed'")
          || body.contains("Just a moment...") {
        return Err(CloudflareError::ChallengeInterstitial403);
      }
    }
    _ => {}, // Fall-through
  }

  // TODO: This is a really bad heuristic.
  let is_cloudflare = body.contains("cloudflare")
      || body.contains("Cloudflare");

  if status_code == 301 {
    /*
      <html>
      <head><title>301 Moved Permanently</title></head>
      <body>
      <center><h1>301 Moved Permanently</h1></center>
      <hr><center>cloudflare</center>
      </body>
      </html>
     */
    if is_cloudflare {
      // TODO: Include location header.
      return Err(CloudflareError::MovedPermanently301);
    }
  }

  // let is_cloudflare = body.contains("cloudflare.com")
  //     || body.contains("Cloudflare Ray ID");

  if is_cloudflare {
    match status_code {
      502 => return Err(CloudflareError::BadGateway502),
      504 => return Err(CloudflareError::GatewayTimeout504),
      524 => return Err(CloudflareError::TimeoutOccurred524),
      _ => {}, // Fall-through
    }

    if body.contains("errorcode_504")
        || body.contains("Gateway time-out")
        || body.contains("Error code 504")
    {
      return Err(CloudflareError::GatewayTimeout504);
    }
  }

  Ok(())
}
