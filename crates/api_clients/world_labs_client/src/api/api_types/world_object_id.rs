/// Type for World IDs.
/// These are used to refer to worlds
/// These appear to be bare UUIDs.
#[derive(Clone, Debug)]
pub struct WorldObjectId(pub String);

impl WorldObjectId {
  pub fn as_str(&self) -> &str {
    &self.0
  }
}
