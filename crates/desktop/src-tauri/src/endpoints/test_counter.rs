use std::sync::{Arc, RwLock};
use once_cell::sync::Lazy;

static COUNTER : Lazy<Arc<RwLock<u64>>> = Lazy::new(|| Arc::new(RwLock::new(0)));

#[tauri::command]
pub fn test_counter() -> u64 {
  let value : u64;
  {
    match COUNTER.write() {
      Ok(mut counter) => {
        *counter += 1;
        value = *counter;
      },
      Err(_e) => {
        value = 0;
      }
    }
  }

  println!("I was invoked from JavaScript! {:?}", value);

  value
}
