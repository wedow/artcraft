use fal::endpoints::fal_ai::kling_video::v1_6::pro::effects::I2VOutput;
use fal::FalError;
use fal::prelude::QueueResponse;
use fal::queue::{Queue, QueueStatus};
use reqwest::Client;
use crate::creds::fal_api_key::FalApiKey;
use crate::fal_error_plus::FalErrorPlus;
use crate::model::enqueued_request::EnqueuedRequest;
use crate::model::fal_endpoint::FalEndpoint;

pub struct QueueStatusChecker {
  api_key: FalApiKey,
}

impl QueueStatusChecker {
  pub fn new(api_key: FalApiKey) -> Self {
    Self { api_key }
  }

  pub async fn check_status(&self, request: &EnqueuedRequest) -> Result<QueueStatus, FalErrorPlus> {
    let client = Client::new();
    let endpoint = request.fal_endpoint.url();
    
    let payload = QueueResponse {
      request_id: request.request_id.0.clone(),
      response_url: request.response_url.clone(),
      status_url: request.status_url.clone(),
      cancel_url: request.cancel_url.clone(),
    };
    
    let queue ;
    
    match &request.fal_endpoint {
      FalEndpoint::Kling16ImageToVideo => {
        // TODO: Cleanup / make concise
        let f : Queue<I2VOutput> = Queue::new(client, endpoint, self.api_key.0.clone(), payload);
        queue = f;
      }
      FalEndpoint::Other(endpoint) => {
        return Err(FalErrorPlus::UnhandledEndpoint(format!("Unsupported endpoint: {}", endpoint)));
      }
    }
    
    let status = queue.status(false).await?;

    Ok(status)
  }
}