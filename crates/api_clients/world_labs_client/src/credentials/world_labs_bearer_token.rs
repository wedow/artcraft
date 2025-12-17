
/*

This is issued by Google, even for email+password login:

  https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={ENTROPY}

Value:

{
    "kind": "identitytoolkit#VerifyPasswordResponse",
    "localId": "{{WorldLabsUserId}}",
    "email": "{{email@whatever.com}}",
    "displayName": "",
    "idToken": "{{BEARER_TOKEN}}",
    "registered": true,
    "refreshToken": "{{REFRESH_TOKEN}}",
    "expiresIn": "3600"
}



*/

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

  pub fn to_bearer_token_header_string(&self) -> String {
    format!("Bearer {}", self.bearer_token)
  }
}
