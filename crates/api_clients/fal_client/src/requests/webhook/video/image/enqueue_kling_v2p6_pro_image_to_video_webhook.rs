use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::kling_video::v2_6::kling_v2p6_pro_image_to_video::{kling_v2p6_pro_image_to_video, KlingV2p6ProImageToVideoInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueKlingV2p6ProImageToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,
  pub image_url: String,

  // Optional args
  pub generate_audio: Option<bool>,
  pub negative_prompt: Option<String>,
  pub duration: Option<EnqueueKlingV2p6ProImageToVideoDurationSeconds>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueKlingV2p6ProImageToVideoDurationSeconds {
  Five,
  Ten,
}

pub async fn enqueue_kling_v2p6_pro_image_to_video_webhook<R: IntoUrl>(
  args: EnqueueKlingV2p6ProImageToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|resolution| match resolution {
        EnqueueKlingV2p6ProImageToVideoDurationSeconds::Five => "5",
        EnqueueKlingV2p6ProImageToVideoDurationSeconds::Ten => "10",
      })
      .map(|resolution| resolution.to_string());

  let request = KlingV2p6ProImageToVideoInput {
    prompt: args.prompt,
    image_url: args.image_url,
    // Optionals
    duration,
    negative_prompt: args.negative_prompt,
    generate_audio: args.generate_audio,
  };

  let result = kling_v2p6_pro_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::image::enqueue_kling_v2p6_pro_image_to_video_webhook::{enqueue_kling_v2p6_pro_image_to_video_webhook, EnqueueKlingV2p6ProImageToVideoArgs, EnqueueKlingV2p6ProImageToVideoDurationSeconds};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::ERNEST_SCARED_STUPID_IMAGE_URL;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/home/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueKlingV2p6ProImageToVideoArgs {
      image_url: ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      prompt: "the man says, 'these ghosts sure are scary!' and then runs. behind him, a group of ghosts appear from the trees and chase him. the camera tracks the action. finally, the man yells, 'go away ghosts'.".to_string(),
      negative_prompt: None,
      generate_audio: Some(true),
      duration: Some(EnqueueKlingV2p6ProImageToVideoDurationSeconds::Ten),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_kling_v2p6_pro_image_to_video_webhook(args).await?;

    Ok(())
  }
}
