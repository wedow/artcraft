use errors::AnyhowResult;
use crate::sora_image_gen::common::{ImageSize, NumImages, SoraImageGenResponse};
use crate::sora_image_gen::raw_sora_image_gen::{call_sora_image_gen, OperationType, RawSoraImageGenRequest, VideoGenType};

pub struct SoraImageGenSimpleRequest {
  pub prompt: String,
  pub num_images: NumImages,
  pub image_size: ImageSize,
  pub session_bearer_token: String,
}

pub async fn sora_image_gen_simple(request: SoraImageGenSimpleRequest) -> AnyhowResult<SoraImageGenResponse> {
  let session_bearer_token = request.session_bearer_token;

  let request = RawSoraImageGenRequest {
    r#type: VideoGenType::ImageGen,
    operation: OperationType::SimpleCompose,
    prompt: request.prompt,
    n_variants: request.num_images.as_count(),
    width: request.image_size.as_width(),
    height: request.image_size.as_height(),
    n_frames: 1,
    inpaint_items: vec![],
  };

  // TODO: Error handling.
  let result = call_sora_image_gen(request, &session_bearer_token).await?;

  Ok(SoraImageGenResponse {
    task_id: result.id,
  })
}

#[cfg(test)]
mod tests {
  use errors::AnyhowResult;
  use crate::sora_image_gen::common::{ImageSize, NumImages};
  use crate::sora_image_gen::sora_image_gen_simple::{sora_image_gen_simple, SoraImageGenSimpleRequest};

  #[ignore]
  #[tokio::test]
  pub async fn test() -> AnyhowResult<()> {
    let token = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE5MzQ0ZTY1LWJiYzktNDRkMS1hOWQwLWY5NTdiMDc5YmQwZSIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS92MSJdLCJjbGllbnRfaWQiOiJhcHBfTTFuUTN0UjV2VzdYOWpMMnBFNmdIOGRLNCIsImV4cCI6MTc0Mzk1MzE0MSwiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS9hdXRoIjp7InVzZXJfaWQiOiJ1c2VyLTl3ZjZKRmRnUlNKTGp2U0o1M0xOQWJWOCJ9LCJodHRwczovL2FwaS5vcGVuYWkuY29tL3Byb2ZpbGUiOnsiZW1haWwiOiJlY2hlbG9uQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwiaWF0IjoxNzQzMDg5MTQxLCJpc3MiOiJodHRwczovL2F1dGgub3BlbmFpLmNvbSIsImp0aSI6ImY1YTI2ZjA3LWIxOGQtNDNlOS1iYWEwLWE0ZGY1YzZjY2NlNyIsIm5iZiI6MTc0MzA4OTE0MSwicHdkX2F1dGhfdGltZSI6MTc0MzA4OTE0MDM5OSwic2NwIjpbIm9wZW5pZCIsImVtYWlsIiwicHJvZmlsZSIsIm9mZmxpbmVfYWNjZXNzIl0sInNlc3Npb25faWQiOiJhdXRoc2Vzc19adTMxZnRXTnY0NUwyY3lsMlpha2xuQ1AiLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExNjAxMTIwNzQ5MjM5NTIwMDM5NiJ9.4YjMmpz803PbjlNj3ilR-n_fp0cZFPTRG3drCgLZ1pwrn0inPO6KpZTyGBG6alrVsnhiQfjDE8Bnt5mw1ybDS5V93NHTaBO3vd5SO2kTAHPmp1AmevyA2R8sO0z2NElul5DRZ8kueqrqMX3495aOWZ1khyG2GmOkdA8MOj09nXbUn6y1Y7tn7lfJre8_YUpplXIUEv8dLUap_hVRDGixqYvhuTC3an8fRFDQELnEXOdLv8eDECXgVn_acukSvzOIIc55mAl_jfbf-XVR5_WI1Uwn1RK6JQt5m5KhyMRpndhmCGNSAb8YFShbV1LzUaRapqAQ1AaRcpuzHBQANJ_GgZL89qTUe3Fuj7u8r3WrHnZlnXewAm7LzBUKfKHBWZoSYTyhR5iw5OQhHEvQFQhOtkVmx7HSrQDz7sZCMEbQqLz8HdsJk9PV4eKZeMz-9m1ySl8kF7Pu8hJXLzJ64zX5LlJGXHCnS3DXJ4DQjw7knxnbB-iUFMXNCtOMjbeYrnTzm43A94l_xNkeaBQZLu608kI4FzUl7QFfXdYhfjAN4Czj_sH1N85M2s1db5FEU48r3BV0RSrfVgxi-tEPw-cfE-eV-GoTKp5uQyN7Tx_5gxQJNxMnn9ixYg6neYLEcvVlvCNkOfhVBqxRzTQGjqvCnrhmESMtD3esP96nwVWXuoQ";
    let response = sora_image_gen_simple(SoraImageGenSimpleRequest {
      prompt: "A cat and a dog play chess".to_string(),
      num_images: NumImages::One,
      image_size: ImageSize::Square,
      session_bearer_token: token.to_string(),
    }).await?;

    println!("task_id: {}", response.task_id);

    assert!(response.task_id.starts_with("task_"));
    Ok(())
  }
}