use anyhow::anyhow;
use base64::prelude::{BASE64_STANDARD, BASE64_URL_SAFE, BASE64_URL_SAFE_NO_PAD};
use base64::Engine;
use errors::AnyhowResult;
use mimetypes::mimetype_info::mimetype_info::MimetypeInfo;
use std::path::Path;

/// Read a file into a base64 URL-safe string.
pub fn file_to_base64_url<P: AsRef<Path>>(path: P) -> AnyhowResult<String> {
  let bytes = std::fs::read(path.as_ref())?;
  
  let mime = match MimetypeInfo::get_for_bytes(&bytes) {
    Some(mime) => mime,
    None => {
      return Err(anyhow!("could not determine mimetype"));
    },
  };

  let base64_bytes = BASE64_STANDARD.encode(&bytes);
  
  match mime.mime_type() {
    "image/png" => Ok(format!("data:image/png;base64,{}", base64_bytes)),
    "image/jpeg" => Ok(format!("data:image/jpeg;base64,{}", base64_bytes)),
    _ => Err(anyhow!("unknown or unsupported mime type: {}", mime.mime_type())),
  }
}
