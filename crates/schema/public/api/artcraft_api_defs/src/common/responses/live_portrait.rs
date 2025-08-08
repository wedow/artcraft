use serde_derive::Deserialize;
use serde_derive::Serialize;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

/// Details about submitted live portrait jobs (request arguments only)
#[derive(Deserialize, Serialize, Debug, ToSchema)]
pub struct MediaFileLivePortraitDetails {
  /// Source media token
  /// This can be an image or a video media file token
  /// This is what constitutes the "portrait" or the overall final video.
  /// This video or image must contain a face.
  pub source_media_file_token: MediaFileToken,

  /// Driving media token
  /// This must be a video media file token.
  /// This drives the animation of the face, but the actor will disappear
  /// and their facial expressions will be transferred to the source.
  /// This video must contain a face.
  pub face_driver_media_file_token: MediaFileToken,
}
