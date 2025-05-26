use crate::creds::fal_api_key::FalApiKey;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::model::enqueued_request::EnqueuedRequest;
use crate::model::fal_endpoint::FalEndpoint;
use anyhow::anyhow;
use fal::endpoints::fal_ai::flux_pro::v1_1_ultra::Output;
use fal::endpoints::fal_ai::hunyuan3d::v2::ObjectOutput;
use fal::endpoints::fal_ai::kling_video::v1_6::pro::effects::I2VOutput;
use fal::endpoints::fal_ai::minimax::image_to_video::VideoOutput;
use fal::endpoints::fal_ai::recraft_v3::TextToImageOutput;
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
      FalEndpoint::FluxProUltraTextToImage => {
        let queue = self.make_queue::<Output>(&request);
        let status = queue.status(false).await?;
        Ok(status)
      }
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
      FalEndpoint::Minimax01ImageToVideo => {
        let queue = self.make_queue::<VideoOutput>(&request); // Assuming Minimax uses the same output type
        let status = queue.status(false).await?;
        Ok(status)
      }
      FalEndpoint::RecraftV3TextToImage => {
        let queue = self.make_queue::<TextToImageOutput>(&request);
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
      FalEndpoint::FluxProUltraTextToImage => {
        let queue = self.make_queue::<Output>(&request);
        let response = queue.response().await?;
        // TODO(bt,2025-05-26): Handle multiple images
        Ok(response.images.first()
            .ok_or_else(|| FalErrorPlus::AnyhowError(anyhow!("No images returned")))?
            .url.clone())
      }
      FalEndpoint::Hunyuan3d2Base => {
        let queue = self.make_queue::<ObjectOutput>(&request);
        let response = queue.response().await?;
        Ok(response.model_mesh.url)
      }
      FalEndpoint::Kling16ImageToVideo => {
        let queue = self.make_queue::<I2VOutput>(&request);
        let response = queue.response().await?;
        Ok(response.video.url)
      }
      FalEndpoint::Minimax01ImageToVideo => {
        let queue = self.make_queue::<VideoOutput>(&request); // Assuming Minimax uses the same output type
        let response = queue.response().await?;
        Ok(response.video.url)
      }
      FalEndpoint::RecraftV3TextToImage => {
        let queue = self.make_queue::<TextToImageOutput>(&request);
        let response = queue.response().await?;
        Ok(response.images.first()
            .ok_or_else(|| FalErrorPlus::AnyhowError(anyhow!("No images returned")))?
            .url.clone())
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