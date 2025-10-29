use crate::datatypes::file_id::FileId;
use crate::datatypes::file_upload_spec::FileUploadSpec;
use crate::datatypes::user_id::UserId;
use crate::error::grok_error::GrokError;
use crate::requests::upload_file::grok_upload_file::GrokUploadFile;
use log::info;
use std::path::Path;
use std::time::Duration;
use crate::utils::user_and_file_id_to_image_url::user_and_file_id_to_image_url;

pub struct UploadImageAndGenerateVideo<'a, P: AsRef<Path>> {
  //pub file_id: &'a FileId,
  pub user_id: &'a UserId,

  // NB: Must be owned.
  pub file: FileUploadSpec<P>,

  pub cookies: &'a str,

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

  let result = request.upload().await?;

  info!("File URI: {:?}", result.file_uri);
  info!("File Metadata ID: {:?}", result.file_id);

  let url = user_and_file_id_to_image_url(&args.user_id, &result.file_id.unwrap());
  
  info!("Uploaded URI: {:?}", url);


  info!("Creating media post...");



  Ok(ImageUploadResult {

  })
}


#[cfg(test)]
mod tests {
  use log::LevelFilter;
  use errors::AnyhowResult;
  use crate::datatypes::file_upload_spec::FileUploadSpec;
  use crate::datatypes::user_id::UserId;
  use crate::recipes::upload_image_and_generate_video::{upload_image_and_generate_video, UploadImageAndGenerateVideo};
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;

  #[tokio::test]
  #[ignore] // Client side tests only
  async fn create_media_post() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Info);

    let cookies = get_test_cookies()?;

    let user_id = UserId("85980643-ffab-4984-a3de-59a608c47d7f".to_string()); // User

    // Result: GrokUploadFileResponse { file_metadata_id:
    // Some("acdee48f-9d6f-4bc6-9d06-fcc97dd4418a"), file_uri:
    // Some("users/85980643-ffab-4984-a3de-59a608c47d7f/acdee48f-9d6f-4bc6-9d06-fcc97dd4418a/content") }

    let result = upload_image_and_generate_video(UploadImageAndGenerateVideo {
      file: FileUploadSpec::Path("/Users/bt/Pictures/Creatures/Spooky/06.1.jpg"),
      cookies: &cookies,
      individual_request_timeout: None,
      user_id: &user_id,
    }).await?;

    assert_eq!(1, 2);

    Ok(())
  }
}
