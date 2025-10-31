use crate::core::artcraft_error::ArtcraftError;
use log::error;
use std::collections::VecDeque;
use std::sync::{Arc, Mutex};

#[derive(Clone)]
pub struct GrokImagePromptQueue {
  pub prompt_queue: Arc<Mutex<VecDeque<String>>>,
}

impl GrokImagePromptQueue {
  pub fn new() -> Self {
    Self {
      prompt_queue: Arc::new(Mutex::new(VecDeque::new())),
    }
  }
  
  pub fn enqueue(&self, prompt: &str) -> Result<(), ArtcraftError> {
    match self.prompt_queue.lock() {
      Ok(mut queue) => {
        queue.push_back(prompt.to_string());
        Ok(())
      },
      Err(err) => {
        error!("Error locking prompt queue: {:?}", err);
        Err(ArtcraftError::MutexLockError)
      },
    }
  }
  
  pub fn dequeue(&self) -> Result<Option<String>, ArtcraftError> {
    match self.prompt_queue.lock() {
      Ok(mut queue) => {
        Ok(queue.pop_front())
      },
      Err(err) => {
        error!("Error locking prompt queue: {:?}", err);
        Err(ArtcraftError::MutexLockError)
      },
    }
  }

  pub fn is_empty(&self) -> Result<bool, ArtcraftError> {
    match self.prompt_queue.lock() {
      Ok(mut queue) => {
        Ok(queue.is_empty())
      },
      Err(err) => {
        error!("Error locking prompt queue: {:?}", err);
        Err(ArtcraftError::MutexLockError)
      },
    }
  }

  pub fn len(&self) -> Result<usize, ArtcraftError> {
    match self.prompt_queue.lock() {
      Ok(mut queue) => {
        Ok(queue.len())
      },
      Err(err) => {
        error!("Error locking prompt queue: {:?}", err);
        Err(ArtcraftError::MutexLockError)
      },
    }
  }
}
