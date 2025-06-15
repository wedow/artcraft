use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::flux_pro::v1_1_ultra::{v1_1_ultra, FluxProUltraTextToImageInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct FluxPro11UltraArgs<'a, U: IntoUrl> {
  pub prompt: &'a str,
  pub webhook_url: U,
  pub api_key: &'a FalApiKey,
}

pub async fn enqueue_flux_pro_11_ultra_text_to_image_webhook<U: IntoUrl>(
  args: FluxPro11UltraArgs<'_, U>
) -> Result<WebhookResponse, FalErrorPlus> {
  
  let request = FluxProUltraTextToImageInput {
    prompt: args.prompt.to_string(),
    // Maybe expose
    num_images: Some(1), // Default is 1
    aspect_ratio: None, // Default is "16:9"
    seed: None,
    raw: Some(true), // Generate less processed, more natural-looking images. Default is false.
    // Maybe abstract
    enable_safety_checker: Some(false),
    safety_tolerance: Some("5".to_string()), // 1 is most strict, 5 is most permissive
    // Constants
    output_format: Some("png".to_string()),
    sync_mode: None, // Synchronous / slow
  };
  
  let result = v1_1_ultra(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}
