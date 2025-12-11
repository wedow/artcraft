/// Type for World IDs.
/// These are used to refer to worlds
/// These appear to be bare UUIDs.
#[derive(Clone, Debug)]
pub struct WorldId(pub String);

impl WorldId {
  pub fn as_str(&self) -> &str {
    &self.0
  }
}
