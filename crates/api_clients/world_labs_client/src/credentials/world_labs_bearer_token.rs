
#[derive(Clone)]
pub struct WorldLabsBearerToken {
  /// The bearer token
  /// Without "Authorization:" header name and without "Bearer(space)" prefix.
  bearer_token: String,
}

impl WorldLabsBearerToken {
  pub fn new(mut bearer_token: String) -> Self {
    if bearer_token.starts_with("Bearer") {
      bearer_token = bearer_token
          .trim_start_matches("Bearer")
          .trim()
          .to_string();
    }
    Self { bearer_token }
  }

  pub fn as_raw_str(&self) -> &str {
    &self.bearer_token
  }

  pub fn as_raw_bytes(&self) -> &[u8] {
    self.bearer_token.as_bytes()
  }

  pub fn to_raw_string(&self) -> String {
    self.bearer_token.clone()
  }

  pub fn to_bearer_token_string(&self) -> String {
    format!("Bearer {}", self.bearer_token)
  }
}
