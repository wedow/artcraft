use serde_derive::Deserialize;

#[derive(Debug, Deserialize)]
pub (crate) struct SentinelResponse {
  pub (crate) token: Option<String>,
  pub (crate) turnstile: Option<SentinelTurnstile>,
  
}

#[derive(Debug, Deserialize)]
pub (crate) struct SentinelTurnstile {
  pub (crate) dx: Option<String>,
}
