use std::io::Write;
use crate::creds::fal_api_key::FalApiKey;
use crate::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::kling_video::v1_6::pro::image_to_video::{image_to_video, ProImageToVideoRequest};
use fal::prelude::Status;
use fal_client::file_to_base64_url::file_to_base64_url;
use futures::StreamExt;
use std::path::Path;
use chrono::Utc;
use fal::endpoints::fal_ai::kling_video::v1::pro::effects::I2VOutput;
use fal::queue::Queue;
use url::Url;

pub struct Kling16Args<'a, P: AsRef<Path>> {
  pub image_path: P,
  pub api_key: &'a FalApiKey,
  pub duration: Kling16Duration,
}
pub struct Kling16Response {
  pub video_url: Url,
}

#[derive(Copy, Clone, Debug)]
pub enum Kling16Duration {
  Default,
  FiveSeconds,
  TenSeconds,
}

pub async fn kling_16_image_to_video<P: AsRef<Path>>(args: Kling16Args<'_, P>) -> Result<Kling16Response, FalErrorPlus> {
  println!("Image to base64... {:?}", Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string());
  std::io::stdout().flush().unwrap();

  let image_url = file_to_base64_url(args.image_path)?;

  /*
  TODO: Handle error messages -
    FalError(FalError(Other("{\"detail\": \"Invalid Key Authorization header format. Expected '<key_id>:<key_secret>'.\"}")))
    FalError(FalError(Other("{\"detail\": \"No user found for Key ID and Secret\"}")))
  */

  let duration = match args.duration{
    Kling16Duration::Default => None,
    Kling16Duration::FiveSeconds => Some("5".to_string()),
    Kling16Duration::TenSeconds => Some("10".to_string()),
  };

  let request = ProImageToVideoRequest {
    image_url,
    prompt: "".to_string(),
    aspect_ratio: None,
    cfg_scale: None,
    duration,
    negative_prompt: None,
    tail_image_url: None,
  };

  println!("Sending request... {:?}", Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string());
  std::io::stdout().flush().unwrap();

  let result = image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue()
      .await?;
  
  let payload = result.payload;


  println!("Result... {:?} - {:?}", result, Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string());
  std::io::stdout().flush().unwrap();

  let mut stream = result.stream(true).await?;

  let mut i = 0;
  while let Some(status) = stream.next().await {
    println!("status: {:?} - {:?}", status, Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string());
    std::io::stdout().flush().unwrap();
    let status = status?;
    if status.status == Status::Completed {
      break;
    }

    if i > 5 {
      return Err(FalErrorPlus::FalError(
        fal::prelude::FalError::Other("Timed out waiting for video to be created".to_string()),
      ));
    }

    i+= 1;
  }

  let output = result.response().await?;

  let url = Url::parse(&output.video.url)?;

  println!("URL: {:?} - {:?}", url, Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string());

  Ok(Kling16Response {
    video_url: url,
  })
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::kling_16_image_to_video::{kling_16_image_to_video, Kling16Args, Kling16Duration};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use testing::test_file_path::test_file_path;

  #[tokio::test]
  #[ignore]
  async fn test_kling16_video() -> AnyhowResult<()> {
    let image = test_file_path("test_data/image/juno.jpg")?;

    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Kling16Args {
      image_path: image,
      api_key: &api_key,
      duration: Kling16Duration::Default,
    };

    let result = kling_16_image_to_video(args).await?;

    Ok(())
  }
}
