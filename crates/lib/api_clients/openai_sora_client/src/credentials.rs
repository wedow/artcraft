use reqwest::RequestBuilder;
use errors::AnyhowResult;
// NB: It appears that the sentinel may require a matching user agent.
pub (crate) const USER_AGENT : &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

#[derive(Clone)]
pub struct SoraCredentials {
  pub bearer_token: String,
  pub cookie: String,
  pub sentinel: Option<String>,
}

impl SoraCredentials {
  pub fn authorization_header_value(&self) -> String {
    match self.bearer_token.get(0..6) {
      Some("bearer") | Some("Bearer") => self.bearer_token.clone(),
      _ => "Bearer ".to_owned() + &self.bearer_token,
    }
  }

  pub fn from_env() -> AnyhowResult<Self> {
    let bearer = std::env::var("SORA_BEARER_TOKEN")?;
    let cookie = std::env::var("SORA_COOKIE")?;
    let sentinel = std::env::var("SORA_SENTINEL").ok();

    Ok(Self { bearer_token: bearer, cookie, sentinel })
  }

  pub fn add_credential_headers_to_request(&self, request: RequestBuilder) -> RequestBuilder {
    let bearer_header = self.authorization_header_value();

    let mut request = request
        .header("User-Agent", USER_AGENT)
        .header("Cookie", &self.cookie)
        .header("Authorization", bearer_header);

    if let Some(sentinel) = &self.sentinel {
      request = request.header("OpenAI-Sentinel-Token", sentinel);
    }

    request
  }
}
