use std::path::Path;
use std::time::Duration;
use crate::credentials::grok_full_credentials::GrokFullCredentials;
use crate::datatypes::file_upload_spec::FileUploadSpec;

pub struct UploadImageAndGenerateVideoWithRetry<'a, P: AsRef<Path>> {
  pub credentials: &'a GrokFullCredentials,

  // NB: Must be owned.
  pub file: FileUploadSpec<P>,

  /// Video generation prompt
  pub prompt: Option<&'a str>,

  /// Wait for the full video to be generated before returning
  /// By default, the endpoint stays open for 30-ish seconds while
  /// the video generates and streams back JSON progress updates.
  /// If we set this to false, we'll wait for the video ID and exit
  /// the request early, before the video is finished asynchronously
  /// generating.
  pub wait_for_generation: bool,

  pub individual_request_timeout: Option<Duration>,
}
