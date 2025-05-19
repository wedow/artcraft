use errors::AnyhowResult;

/// Sora bearer tokens are JWT tokens that can be minted with a valid cookie/session.
#[derive(Clone)]
pub struct JwtBearerToken {
  raw_jwt: String,
  jwt_claims: JwtClaims,
}

impl JwtBearerToken {
  pub fn new(raw_jwt: String) -> AnyhowResult<Self> {
    let jwt_claims = lightweight_jwt_parse(&raw_jwt)?;
    Ok(Self {
      raw_jwt,
      jwt_claims,
    })
  }

  pub fn raw_jwt_str(&self) -> &str {
    &self.raw_jwt
  }

  pub fn as_bytes(&self) -> &[u8] {
    self.raw_jwt.as_bytes()
  }

  pub fn jwt_claims(&self) -> &JwtClaims {
    &self.jwt_claims
  }

  pub fn to_authorization_header_value(&self) -> String {
    match self.raw_jwt.get(0..6) {
      Some("bearer") | Some("Bearer") => self.raw_jwt.clone(),
      _ => "Bearer ".to_owned() + &self.raw_jwt,
    }
  }
}
