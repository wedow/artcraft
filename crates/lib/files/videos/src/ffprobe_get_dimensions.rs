use std::path::Path;

use errors::AnyhowResult;

pub struct VideoDimensions {
  pub width: u64,
  pub height: u64,
}

pub fn ffprobe_get_dimensions(
  video_path: impl AsRef<Path>
) -> AnyhowResult<Option<VideoDimensions>>
{
  let result = ffprobe::ffprobe(video_path)?;

  let maybe_dimensions = result.streams.iter()
      .filter(|stream| stream.codec_type.as_deref() == Some("video"))
      .find_map(|stream| {
        if let (Some(width), Some(height)) = (stream.width, stream.height) {
          Some((width, height))
        } else {
          None
        }
      });

  match maybe_dimensions {
    None => Ok(None),
    Some((width, height)) => Ok(Some(VideoDimensions {
      width: width.unsigned_abs(),
      height: height.unsigned_abs(),
    })),
  }
}
