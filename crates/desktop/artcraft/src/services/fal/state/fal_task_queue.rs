use crate::services::fal::state::fal_generation_type::FalGenerationType;
use chrono::{DateTime, Utc};
use errors::AnyhowResult;
use fal_client::model::enqueued_request::EnqueuedRequest;
use fal_client::model::fal_request_id::FalRequestId;
use indexmap::IndexMap;
use std::collections::HashSet;
use std::sync::{Arc, RwLock};

#[derive(Clone)]
pub struct FalTaskDetails {
  pub enqueue_time: DateTime<Utc>,
  pub enqueued_request: EnqueuedRequest,
  pub generation_type: Option<FalGenerationType>,
}

impl FalTaskDetails {
  pub fn for_request(request: EnqueuedRequest) -> Self {
    Self {
      enqueue_time: Utc::now(),
      generation_type: FalGenerationType::from_fal_endpoint(&request.fal_endpoint),
      enqueued_request: request,
    }
  }
}

#[derive(Clone)]
pub struct FalTaskQueue {
  // Insertion-order map of task IDs to task details
  queue: Arc<RwLock<IndexMap<FalRequestId, FalTaskDetails>>>
}

impl FalTaskQueue {
  pub fn new() -> Self {
    Self {
      queue: Arc::new(RwLock::new(IndexMap::new()))
    }
  }

  /// Determine if queue is empty
  /// This is an O(1) operation.
  pub fn is_empty(&self) -> AnyhowResult<bool> {
    match self.queue.read() {
      Err(err) => {
        Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err))
      }
      Ok(lock) => Ok(lock.is_empty())
    }
  }

  /// Get length of set
  /// This is an O(1) operation.
  pub fn len(&self) -> AnyhowResult<usize> {
    match self.queue.read() {
      Err(err) => {
        Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err))
      }
      Ok(lock) => Ok(lock.len())
    }
  }
  
  /// Get the task at an index.
  /// This is an O(1) operation.
  pub fn get_index(&self, i: usize) -> AnyhowResult<Option<FalTaskDetails>> {
    match self.queue.read() {
      Err(err) => {
        Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err))
      }
      Ok(lock) => {
        if i >= lock.len() {
          Ok(None)
        } else {
          match lock.get_index(i) {
            None => Ok(None),
            Some((_key, value)) => {
              Ok(Some(value.clone()))
            }
          }
        }
      }
    }
  }

  /// Determine if the key is in the queue
  /// This is an O(1) operation.
  pub fn contains_key(&self, request_id: &FalRequestId) -> AnyhowResult<bool> {
    match self.queue.read() {
      Err(err) => {
        Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err))
      }
      Ok(lock) => Ok(lock.contains_key(request_id))
    }
  }

  /// Get the first enqueued task
  /// This is an O(1) operation.
  pub fn first(&self) -> AnyhowResult<Option<FalTaskDetails>> {
    match self.queue.read() {
      Err(err) => {
        Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err))
      }
      Ok(lock) => match lock.first() {
        None => Ok(None),
        Some((request_id, task_details)) => Ok(Some(task_details.clone()))
      }
    }
  }

  /// Get the last enqueued task
  /// This is an O(1) operation.
  pub fn last(&self) -> AnyhowResult<Option<FalTaskDetails>> {
    match self.queue.read() {
      Err(err) => {
        Err(anyhow::anyhow!("Failed to acquire read lock: {:?}", err))
      }
      Ok(lock) => match lock.last() {
        None => Ok(None),
        Some((request_id, task_details)) => Ok(Some(task_details.clone()))
      }
    }
  }

  /// Insert a new task. If a task already exists, we update its value.
  /// This is an O(1) operation.
  pub fn insert(&self, request: &EnqueuedRequest) -> AnyhowResult<Option<FalTaskDetails>> {
    match self.queue.write() {
      Err(err) => {
        Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err))
      }
      Ok(mut lock) => {
        // NB: Probably fine to compute TaskDetails here for now. We may eventually expose this if we include additional info.
        let task_details = FalTaskDetails::for_request(request.clone());
        Ok(lock.insert(request.request_id.clone(), task_details))
      }
    }
  }

  /// Remove a task by ID.
  /// This is an O(n) operation.
  pub fn remove(&self, request_id: &FalRequestId) -> AnyhowResult<Option<FalTaskDetails>> {
    match self.queue.write() {
      Err(err) => {
        Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err))
      }
      Ok(mut lock) => {
        Ok(lock.shift_remove(request_id))
      }
    }
  }

  /// Remove a list of tasks by ID.
  /// This is an O(n) operation.
  pub fn remove_list(&self, request_ids: &[&FalRequestId]) -> AnyhowResult<()> {
    match self.queue.write() {
      Err(err) => {
        Err(anyhow::anyhow!("Failed to acquire write lock: {:?}", err))
      }
      Ok(mut lock) => {
        // TODO: Cleaner way to do this?
        let mut set : HashSet<&FalRequestId, _> = HashSet::with_capacity(request_ids.len());
        set.extend(request_ids);
        lock.retain(|k, v| !set.contains(k));
        Ok(())
      }
    }
  }
}
