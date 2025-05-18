use crate::creds::fal_api_key::FalApiKey;
use crate::fal_error_plus::FalErrorPlus;
use crate::model::enqueued_request::EnqueuedRequest;
use crate::model::fal_endpoint::FalEndpoint;
use fal::endpoints::fal_ai::hunyuan3d::v2::ObjectOutput;
use fal::endpoints::fal_ai::kling_video::v1_6::pro::effects::I2VOutput;
use fal::prelude::QueueResponse;
use fal::queue::{Queue, QueueStatus};
use reqwest::Client;
use serde::de::DeserializeOwned;

pub struct QueueStatusChecker {
  api_key: FalApiKey,
}

impl QueueStatusChecker {
  pub fn new(api_key: FalApiKey) -> Self {
    Self { api_key }
  }

  pub async fn check_status(&self, request: &EnqueuedRequest) -> Result<QueueStatus, FalErrorPlus> {
    match &request.fal_endpoint {
      FalEndpoint::Hunyuan3d2Base => {
        let queue = self.make_queue::<ObjectOutput>(&request);
        let status = queue.status(false).await?;
        Ok(status)
      }
      FalEndpoint::Kling16ImageToVideo => {
        let queue = self.make_queue::<I2VOutput>(&request);
        let status = queue.status(false).await?;
        Ok(status)
      }
      FalEndpoint::Other(endpoint) => {
        Err(FalErrorPlus::UnhandledEndpoint(format!("Unsupported endpoint: {}", endpoint)))
      }
    }
  }
  
  pub async fn get_download_url(&self, request: &EnqueuedRequest) -> Result<String, FalErrorPlus> {
    match &request.fal_endpoint {
      FalEndpoint::Hunyuan3d2Base => {
        let queue = self.make_queue::<ObjectOutput>(&request);
        let status = queue.response().await?;
        Ok(status.model_mesh.url)
      }
      FalEndpoint::Kling16ImageToVideo => {
        let queue = self.make_queue::<I2VOutput>(&request);
        let status = queue.response().await?;
        Ok(status.video.url)
      }
      FalEndpoint::Other(endpoint) => {
        Err(FalErrorPlus::UnhandledEndpoint(format!("Unsupported endpoint: {}", endpoint)))
      }
    }
  }
  
  pub fn make_queue<T: DeserializeOwned>(&self, request: &EnqueuedRequest) -> Queue<T> {
    let client = Client::new();
    let endpoint = request.fal_endpoint.url();

    let payload = QueueResponse {
      request_id: request.request_id.0.clone(),
      response_url: request.response_url.clone(),
      status_url: request.status_url.clone(),
      cancel_url: request.cancel_url.clone(),
    };

    Queue::new(client, endpoint, self.api_key.0.clone(), payload)
  }
}