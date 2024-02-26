use std::io::{Read, Seek};
use std::time::Duration;

use log::warn;
use mp4::TrackType;

use errors::AnyhowResult;

pub struct Mp4Info {
  /// Framerate of the longest video track.
  pub framerate: f64,
  /// Duration of the entire mp4.
  pub duration_millis: u128,
}

pub fn get_mp4_info<T: Seek + Read>(reader: T, file_size: u64) -> AnyhowResult<Mp4Info> {
  let mp4 = mp4::Mp4Reader::read_header(reader, file_size)?;

  let mut framerate = 0.0;
  let mut longest_duration = Duration::from_secs(0);

  for track in mp4.tracks().values() {
    match track.track_type() {
      Ok(TrackType::Video) => {
        if track.duration() > longest_duration {
          longest_duration = track.duration();
          framerate = track.frame_rate();
        }
      }
      Err(err) => {
        warn!("Error determining track type: {:?}", err);
        continue;
      },
      _ => continue,
    }
  }

  Ok(Mp4Info {
    framerate,
    duration_millis: mp4.duration().as_millis(),
  })
}

#[cfg(test)]
pub mod tests {
  use std::fs::File;
  use std::io::BufReader;
  use std::path::PathBuf;

  use testing::test_file_path::test_file_path;

  use crate::get_mp4_info::get_mp4_info;

  fn test_file(path_from_repo_root: &str) -> PathBuf {
    // https://doc.rust-lang.org/cargo/reference/environment-variables.html
    let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    path.push(format!("../../../{}", path_from_repo_root));
    path
  }

  #[test]
  pub fn test_decode_mp4() {
    let filename = test_file_path("test_data/video/mp4/golden_sun_garoh.mp4")
        .expect("path should exist");

    let file = File::open(filename).expect("file should open");
    let size = file.metadata().expect("should be able to grab metadata").len();
    let reader = BufReader::new(file);

    let info = get_mp4_info(reader, size).expect("mp4 reader should work");

    assert_eq!(info.framerate, 30.0);
    assert_eq!(info.duration_millis, 15168);
  }
}
