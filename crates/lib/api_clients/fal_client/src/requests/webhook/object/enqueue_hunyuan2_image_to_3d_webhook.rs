use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::hunyuan3d::v2::{v2, Hunyuan3DInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct Hunyuan2Args<'a, U: IntoUrl, V: IntoUrl> {
  pub image_url: U,
  pub webhook_url: V,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum Kling16Duration {
  Default,
  FiveSeconds,
  TenSeconds,
}

pub async fn enqueue_hunyuan2_image_to_3d_webhook<U: IntoUrl, V: IntoUrl>(
  args: Hunyuan2Args<'_, U, V>
) -> Result<WebhookResponse, FalErrorPlus> {
  
  let image_url = args.image_url.as_str().to_string();

  let request = Hunyuan3DInput {
    input_image_url: image_url,
    textured_mesh: Some(true),
    guidance_scale: None,
    num_inference_steps: None,
    octree_resolution: None,
    seed: None,
  };

  let result = v2(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}
