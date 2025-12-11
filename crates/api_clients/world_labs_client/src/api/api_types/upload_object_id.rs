/// Type for Upload IDs.
/// These are used to upload images.
/// These appear to be bare UUIDs.
#[derive(Clone, Debug)]
pub struct UploadObjectId(pub String);

impl UploadObjectId {
  pub fn as_str(&self) -> &str {
    &self.0
  }
}
