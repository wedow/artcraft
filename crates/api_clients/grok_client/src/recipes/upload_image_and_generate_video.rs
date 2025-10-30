use crate::datatypes::file_id::FileId;
use crate::datatypes::file_upload_spec::FileUploadSpec;
use crate::datatypes::user_id::UserId;
use crate::error::grok_error::GrokError;
use crate::requests::upload_file::grok_upload_file::GrokUploadFile;
use log::{error, info};
use std::path::Path;
use std::time::Duration;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::requests::create_media_post::grok_create_media_post::{GrokCreateMediaPost, MediaPostType};
use crate::requests::index_page::pieces::baggage::Baggage;
use crate::requests::index_page::pieces::sentry_trace::SentryTrace;
use crate::requests::index_page::pieces::svg_path_data::SvgPathData;
use crate::requests::index_page::pieces::verification_token::VerificationToken;
use crate::requests::index_page::pieces::xsid_numbers::XsidNumbers;
use crate::requests::like_media::grok_like_media::GrokLikeMediaPost;
use crate::requests::video_gen_chat_conversation::grok_video_gen_chat_conversation::{GrokVideoGenChatConversationBuilder, VideoMediaPostType};
use crate::utils::user_and_file_id_to_image_url::user_and_file_id_to_image_url;

pub struct UploadImageAndGenerateVideo<'a, P: AsRef<Path>> {
  pub cookies: &'a str,
  pub baggage: &'a Baggage,
  pub sentry_trace: &'a SentryTrace,
  pub verification_token: &'a VerificationToken,
  pub svg_data: &'a SvgPathData,
  pub numbers: &'a XsidNumbers,

  //pub file_id: &'a FileId,
  pub user_id: &'a UserId,

  // NB: Must be owned.
  pub file: FileUploadSpec<P>,

  pub prompt: Option<&'a str>,

  pub individual_request_timeout: Option<Duration>,
}

pub struct ImageUploadResult {
}

pub async fn upload_image_and_generate_video<P: AsRef<Path>>(args: UploadImageAndGenerateVideo<'_, P>) -> Result<ImageUploadResult, GrokError> {

  info!("Uploading file to Grok...");

  let request = GrokUploadFile {
    //file: FileSpec::Path("/Users/bt/dev/storyteller/storyteller-rust/test_data/image/mochi.jpg"),
    file: args.file,
    cookie: args.cookies.to_string(),
    request_timeout: args.individual_request_timeout,
  };

  let upload_result = request.upload().await?;

  info!("File URI: {:?}", upload_result.file_uri);
  info!("File Metadata ID: {:?}", upload_result.file_id);

  let upload_file_id = match &upload_result.file_id {
    Some(id) => id,
    None => {
      error!("Previous file upload failed. Cannot continue.");
      return Err(GrokGenericApiError::UploadFailed.into());
    }
  };

  let url = user_and_file_id_to_image_url(&args.user_id, &upload_file_id);

  info!("Uploaded URI: {:?}", url);

  info!("Creating media post...");

  let request = GrokCreateMediaPost {
    user_id: args.user_id,
    file_id: upload_file_id,
    media_type: MediaPostType::UserUploadedImage,
    cookie: args.cookies,
    request_timeout: args.individual_request_timeout,
  };

  let _post_result = request.send().await?;

  info!("Posted Image.");

  info!("Generate video...");

  let request = GrokVideoGenChatConversationBuilder {
    user_id: &args.user_id,
    file_id: &upload_file_id,
    media_type: VideoMediaPostType::UserUploadedImage,
    cookie: args.cookies,
    prompt: args.prompt,
    request_timeout: args.individual_request_timeout,
    baggage: &args.baggage,
    sentry_trace: &args.sentry_trace,
    verification_token: &args.verification_token,
    svg_data: &args.svg_data,
    numbers: &args.numbers,
  };

  // TODO: Get URL
  let video_gen_result = request.send().await?;

  info!("Video Generation Enqueued");

  info!("Liking media...");

  let request = GrokLikeMediaPost {
    file_id: &upload_file_id,
    cookie: args.cookies,
    request_timeout: args.individual_request_timeout,
    baggage: &args.baggage,
    sentry_trace: &args.sentry_trace,
    verification_token: &args.verification_token,
    svg_data: &args.svg_data,
    numbers: &args.numbers,
  };

  let _like_result = request.send().await?;

  info!("Media Liked");

  Ok(ImageUploadResult {
  })
}


#[cfg(test)]
mod tests {
  use log::LevelFilter;
  use errors::AnyhowResult;
  use crate::datatypes::file_upload_spec::FileUploadSpec;
  use crate::datatypes::user_id::UserId;
  use crate::recipes::request_client_secrets::{request_client_secrets, RequestClientSecretsArgs};
  use crate::recipes::upload_image_and_generate_video::{upload_image_and_generate_video, UploadImageAndGenerateVideo};
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;

  // Result: GrokUploadFileResponse { file_metadata_id:
  // Some("acdee48f-9d6f-4bc6-9d06-fcc97dd4418a"), file_uri:
  // Some("users/85980643-ffab-4984-a3de-59a608c47d7f/acdee48f-9d6f-4bc6-9d06-fcc97dd4418a/content") }

  #[tokio::test]
  #[ignore] // Client side tests only
  async fn test_upload_image_and_generate_video() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Info);

    let cookies = get_test_cookies()?;

    let user_id = UserId("85980643-ffab-4984-a3de-59a608c47d7f".to_string()); // User

    let secrets = request_client_secrets(RequestClientSecretsArgs {
      cookies: &cookies,
    }).await?;

    println!("Verification Token: {:?}", secrets.verification_token);
    println!("Sentry Trace: {:?}", secrets.sentry_trace);
    println!("Numbers: {:?}", secrets.numbers);
    println!("Svg Path: {:?}", secrets.svg_path_data);
    println!("Baggage: {:?}", secrets.baggage);

    let result = upload_image_and_generate_video(UploadImageAndGenerateVideo {
      cookies: &cookies,
      user_id: &user_id,
      baggage: &secrets.baggage,
      sentry_trace: &secrets.sentry_trace,
      verification_token: &secrets.verification_token,
      svg_data: &secrets.svg_path_data,
      numbers: &secrets.numbers,
      file: FileUploadSpec::Path("/Users/bt/Pictures/People/Ernest/0c120fb0-d6f3-11ec-9737-6f3f233a88c2.jpg"),
      prompt: Some("A man in the forest runs away from a spooky ghost"),
      individual_request_timeout: None,
    }).await?;

    assert_eq!(1, 2);

    Ok(())
  }
}
