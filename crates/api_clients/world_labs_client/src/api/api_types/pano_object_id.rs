/// Type for Pano Object Ids
/// These are used to refer to worlds
/// These appear to be bare UUIDs.
#[derive(Clone, Debug)]
pub struct PanoObjectId(pub String);

impl PanoObjectId {
  pub fn from_str(s: &str) -> Self {
    Self(s.to_string())
  }
  
  pub fn as_str(&self) -> &str {
    &self.0
  }
  
  pub fn to_string(&self) -> String {
    self.0.clone()
  }
}
