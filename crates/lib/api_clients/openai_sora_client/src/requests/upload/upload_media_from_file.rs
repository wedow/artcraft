use crate::creds::credential_migration::CredentialMigrationRef;
use crate::requests::upload::upload_media_http_request::{upload_media_http_request, SoraMediaUploadResponse};
use crate::sora_error::SoraError;
use std::path::Path;
use tokio::fs::File;
use tokio::io::AsyncReadExt;

/// Try to prevent buffer reallocations.
/// There's a better way to implement this.
const INITIAL_BUFFER_SIZE : usize = 1024*1024;

pub async fn sora_media_upload_from_file<P: AsRef<Path>>(file_path: P, creds: CredentialMigrationRef<'_>) -> Result<SoraMediaUploadResponse, SoraError> {
  let mut file = File::open(&file_path).await?;
  let mut buffer = Vec::with_capacity(INITIAL_BUFFER_SIZE);
  file.read_to_end(&mut buffer).await?;

  let filename = file_path.as_ref().file_name()
    .ok_or_else(|| anyhow::anyhow!("Invalid file path"))?
    .to_string_lossy()
    .to_string();

  // TODO: Read file magic bytes first, then fall back to this.
  let mime_type = match file_path.as_ref().extension().and_then(|e| e.to_str()) {
    Some("jpg") | Some("jpeg") => "image/jpeg",
    Some("png") => "image/png",
    // Some("webp") => "image/webp",
    // Some("gif") => "image/gif",
    // Some("mp4") => "video/mp4",
    // Some("mov") => "video/quicktime",
    // Some("webm") => "video/webm",
    _ => "application/octet-stream",
  };

  Ok(upload_media_http_request(buffer, filename, mime_type, creds).await?)
}

#[cfg(test)]
mod tests {
  use crate::credentials::SoraCredentials;
  use crate::creds::credential_migration::CredentialMigrationRef;
  use crate::requests::upload::upload_media_from_file::sora_media_upload_from_file;
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use testing::test_file_path::test_file_path;

  #[ignore] // You can manually run "ignore" tests in the IDE, but they won't run in CI.
  #[tokio::test]
  pub async fn manual_test() -> AnyhowResult<()> {
    let cookie = read_to_string(test_file_path("test_data/temp/cookie.txt")?)?;
    let cookie = cookie.trim().to_string();

    let bearer = read_to_string(test_file_path("test_data/temp/bearer.txt")?)?;
    let bearer = bearer.trim().to_string();

    let image_path = test_file_path("test_data/image/juno.jpg")?; // media_01jqyqgqpwf40tkcapq5bmaz5d

    let creds = SoraCredentials {
      bearer_token: bearer,
      cookie,
      sentinel: None,
    };

    let response = sora_media_upload_from_file(
      image_path,
      CredentialMigrationRef::Legacy(&creds),
    ).await?;

    println!("media: {:?}", response);

    println!("media_id: {}", response.id);
    println!("media_url: {}", response.url);

    assert!(response.id.starts_with("media_"));

    Ok(())
  }
}
