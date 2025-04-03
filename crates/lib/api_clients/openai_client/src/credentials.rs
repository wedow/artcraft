use reqwest::RequestBuilder;

// NB: It appears that the sentinel may require a matching user agent.
const USER_AGENT : &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

#[derive(Clone)]
pub struct SoraCredentials {
  pub bearer_token: String,
  pub cookie: String,
  pub sentinel: String,
}

impl SoraCredentials {
  pub fn add_credential_headers_to_request(&self, request: RequestBuilder) -> RequestBuilder {
    let bearer_header = match self.bearer_token.get(0..6) {
      Some("bearer") | Some("Bearer") => self.bearer_token.clone(),
      _ => "Bearer ".to_owned() + &self.bearer_token,
    };

    println!(">>> BEARER HEADER = {}", bearer_header);
    println!(">>> COOKIE HEADER = {}", self.cookie);
    println!(">>> SENTINEL HEADER = {}", self.sentinel);

    let request = request
        .header("Authorization", bearer_header)
        .header("Cookie", &self.cookie)
        .header("OpenAI-Sentinel-Token", &self.sentinel)
        .header("User-Agent", USER_AGENT);

    request
  }
}
