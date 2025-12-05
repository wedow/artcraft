use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::kling_video::v2_6::kling_v2p6_pro_text_to_video::{kling_v2p6_pro_text_to_video, KlingV2p6ProTextToVideoInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueKlingV2p6ProTextToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,

  // Optional args
  pub generate_audio: Option<bool>,
  pub negative_prompt: Option<String>,
  pub duration: Option<EnqueueKlingV2p6ProTextToVideoDurationSeconds>,
  pub aspect_ratio: Option<EnqueueKlingV2p6ProTextToVideoAspectRatio>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueKlingV2p6ProTextToVideoDurationSeconds {
  Five,
  Ten,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueKlingV2p6ProTextToVideoAspectRatio {
  Square,
  SixteenByNine,
  NineBySixteen,
}

pub async fn enqueue_kling_v2p6_pro_text_to_video_webhook<R: IntoUrl>(
  args: EnqueueKlingV2p6ProTextToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|resolution| match resolution {
        EnqueueKlingV2p6ProTextToVideoDurationSeconds::Five => "5",
        EnqueueKlingV2p6ProTextToVideoDurationSeconds::Ten => "10",
      })
      .map(|s| s.to_string());
  
  let aspect_ratio = args.aspect_ratio
      .map(|aspect| match aspect {
        EnqueueKlingV2p6ProTextToVideoAspectRatio::Square => "1:1",
        EnqueueKlingV2p6ProTextToVideoAspectRatio::SixteenByNine => "16:9",
        EnqueueKlingV2p6ProTextToVideoAspectRatio::NineBySixteen => "9:16",
      })
      .map(|s| s.to_string());

  let request = KlingV2p6ProTextToVideoInput {
    prompt: args.prompt,
    // Optionals
    generate_audio: args.generate_audio,
    duration,
    aspect_ratio,
    negative_prompt: args.negative_prompt,
    // Constants
    cfg_scale: None,
  };

  let result = kling_v2p6_pro_text_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use crate::requests::webhook::video::text::enqueue_kling_v2p6_pro_text_to_video_webhook::{enqueue_kling_v2p6_pro_text_to_video_webhook, EnqueueKlingV2p6ProTextToVideoArgs, EnqueueKlingV2p6ProTextToVideoAspectRatio, EnqueueKlingV2p6ProTextToVideoDurationSeconds};

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/home/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueKlingV2p6ProTextToVideoArgs {
      prompt: "a humanoid lizard creature walks around on the surface of an alien planet. the sky is purple and there are yellow plants. The lizard says, 'You should consider day trading'. Suddenly a giant t-rex comes in from off screen and eats the lizard creature.".to_string(),
      negative_prompt: None,
      aspect_ratio: Some(EnqueueKlingV2p6ProTextToVideoAspectRatio::SixteenByNine),
      duration: Some(EnqueueKlingV2p6ProTextToVideoDurationSeconds::Ten),
      generate_audio: Some(true),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_kling_v2p6_pro_text_to_video_webhook(args).await?;

    Ok(())
  }
}
