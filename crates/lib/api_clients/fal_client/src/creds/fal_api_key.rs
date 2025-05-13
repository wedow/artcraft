
#[derive(Clone)]
pub struct FalApiKey(pub String);

impl FalApiKey {
  pub fn new(api_key: String) -> Self {
    Self(api_key)
  }
  
  pub fn from_str(api_key: &str) -> Self {
    Self(api_key.to_string())
  }
}
