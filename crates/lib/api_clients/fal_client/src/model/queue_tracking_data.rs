use fal::queue::{Queue, QueueResponse};
use reqwest::Client;
use serde::de::DeserializeOwned;
use errors::AnyhowResult;
use crate::creds::fal_api_key::FalApiKey;
use crate::model::fal_endpoint::FalEndpoint;

#[derive(Clone, Debug)]
pub struct QueueTrackingData {
  pub fal_endpoint: FalEndpoint,
  pub request_id: String,
  pub response_url: String,
  pub status_url: String,
  pub cancel_url: String,
}

impl QueueTrackingData {
  pub fn from_queue_response<R: DeserializeOwned>(queue: &Queue<R>) -> AnyhowResult<Self> {
    let fal_endpoint = FalEndpoint::Kling16ImageToVideo; // TODO: Get the endpoint from the queue response
    
    Ok(Self {
      fal_endpoint,
      request_id: queue.payload.request_id.clone(),
      response_url: queue.payload.response_url.clone(),
      status_url: queue.payload.status_url.clone(),
      cancel_url: queue.payload.cancel_url.clone(),
    })
  }
  
  pub fn to_queue_response<R: DeserializeOwned>(&self, api_key: &FalApiKey) -> AnyhowResult<Queue<R>> {
    let client = Client::new();
    let endpoint = self.fal_endpoint.url();
    let payload = QueueResponse {
      request_id: self.request_id.clone(),
      response_url: self.response_url.clone(),
      status_url: self.status_url.clone(),
      cancel_url: self.cancel_url.clone(),
    };
    Ok(Queue::new(client, endpoint, api_key.0.clone(), payload))
  }
}
