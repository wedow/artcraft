use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum CloudflareError {
  /// Cloudflare wants to verify the request with a CAPTCHA challenge.
  ChallengeInterstitial403,
  
  /// Cloudflare could not form a connection to the backend server.
  GatewayTimeout504,

  /// Cloudflare formed a TCP connection to the backend server, but no payload was delivered before timeout
  TimeoutOccurred524,
}

impl Error for CloudflareError {}

impl Display for CloudflareError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::ChallengeInterstitial403 => {
        write!(f, "Cloudflare Challenge Interstitial (403); Cloudflare wants to verify the request with a CAPTCHA challenge.")
      }
      Self::GatewayTimeout504 => {
        write!(f, "Cloudflare Gateway Timeout (504); This is likely a backend server issue.")
      }
      Self::TimeoutOccurred524 => {
        write!(f, "Cloudflare Timeout (524); This is likely a backend server issue. Cloudflare connected, but did not receive a response from the server in time.")
      }
    }
  }
}
