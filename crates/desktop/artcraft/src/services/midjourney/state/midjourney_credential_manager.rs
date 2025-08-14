use cookie_store::cookie_store::CookieStore;
use std::sync::{Arc, RwLock};

#[derive(Clone)]
pub struct MidjourneyCredentialManager {
  cookies: Arc<RwLock<CookieStore>>,
}

impl MidjourneyCredentialManager {
  pub fn new() -> Self {
    Self {
      cookies: Arc::new(RwLock::new(CookieStore::empty())),
    }
  }
  
  pub fn copy_cookie_store(&self) -> anyhow::Result<CookieStore> {
    match self.cookies.read() {
      Err(err) => Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut store) => Ok(store.clone()),
    }
  }
  
  pub fn replace_cookie_store(&self, store: CookieStore) -> anyhow::Result<()> {
    match self.cookies.write() {
      Err(err) => Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err)),
      Ok(mut current_store) => {
        *current_store = store;
        Ok(())
      }
    }
  }
}
