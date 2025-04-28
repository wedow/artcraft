use crate::creds::credential_migration::CredentialMigrationRef;
use crate::requests::upload::upload_media_http_request::{upload_media_http_request, SoraMediaUploadResponse};
use crate::sora_error::SoraError;
use std::path::PathBuf;

/// Upload bytes.
/// The underlying reqwest lib needs to own the bytes, so we can't pass as a reference.
pub async fn sora_media_upload_from_bytes(bytes: Vec<u8>, file_name: String, creds: CredentialMigrationRef<'_>) -> Result<SoraMediaUploadResponse, SoraError> {
  let file_path = PathBuf::from(&file_name);

  // TODO: Read file magic bytes first, then fall back to this.
  let mime_type = match file_path.extension().and_then(|e| e.to_str()) {
    Some("jpg") | Some("jpeg") => "image/jpeg",
    Some("png") => "image/png",
    // Some("webp") => "image/webp",
    // Some("gif") => "image/gif",
    // Some("mp4") => "video/mp4",
    // Some("mov") => "video/quicktime",
    // Some("webm") => "video/webm",
    _ => "application/octet-stream",
  };

  Ok(upload_media_http_request(bytes, file_name, mime_type, creds).await?)
}
