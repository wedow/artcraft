use artcraft_api_defs::common::responses::live_portrait::MediaFileLivePortraitDetails;
use mysql_queries::payloads::media_file_extra_info::media_file_extra_info::MediaFileExtraInfo;
use utoipa::ToSchema;

/// Details about submitted live portrait jobs (request arguments only)
#[derive(Serialize, ToSchema)]
pub struct MediaFileLivePortraitDetailsBuilder {
}

impl MediaFileLivePortraitDetailsBuilder {
  /// Extract from database JSON payload
  pub fn maybe_from_extra_info(info: &MediaFileExtraInfo) -> Option<MediaFileLivePortraitDetails> {
    let lp =
        if let MediaFileExtraInfo::L(live_portrait_args) = info {
          live_portrait_args
        } else {
          return None;
        };

    lp.maybe_portrait_media_token
        .as_ref()
        .zip(lp.maybe_driver_video_media_token.as_ref())
        .map(|(portrait, driver) | {
          MediaFileLivePortraitDetails {
            source_media_file_token: portrait.clone(),
            face_driver_media_file_token: driver.clone(),
          }
        })
  }
}
