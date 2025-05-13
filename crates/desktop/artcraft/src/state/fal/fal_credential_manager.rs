use errors::AnyhowResult;
use fal_client::creds::fal_api_key::FalApiKey;
use memory_store::clone_slot::CloneSlot;

#[derive(Clone)]
pub struct FalCredentialManager {
  key: CloneSlot<FalApiKey>
}

impl FalCredentialManager {
  pub fn new() -> Self {
    Self {
      key: CloneSlot::empty(),
    }
  }

  pub fn set_key(&self, key: &FalApiKey) -> AnyhowResult<()> {
    self.key.set_clone(key)
  }

  pub fn get_key(&self) -> AnyhowResult<Option<FalApiKey>> {
    self.key.get_clone()
  }
}
