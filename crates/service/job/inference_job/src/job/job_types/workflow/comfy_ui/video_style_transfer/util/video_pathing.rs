use std::path::{Path, PathBuf};

use anyhow::anyhow;

use mysql_queries::queries::media_files::get::batch_get_media_files_by_tokens::MediaFilesByTokensRecord;
use mysql_queries::queries::media_files::get::get_media_file::MediaFile;
use tokens::tokens::media_files::MediaFileToken;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::workflow::comfy_ui::video_style_transfer::util::comfy_dirs::ComfyDirs;

/// Keep track of where we download videos to and where they end up after processing.
pub struct VideoDownloads {
  /// The main video
  pub input_video: PrimaryInputVideoAndPaths,

  // Secondary videos that provide enrichment signals.
  pub maybe_depth: Option<SecondaryInputVideoAndPaths>,
  pub maybe_normal: Option<SecondaryInputVideoAndPaths>,
  pub maybe_outline: Option<SecondaryInputVideoAndPaths>,
}

/// This is the primary input video for style transfer.
pub struct PrimaryInputVideoAndPaths {
  /// Media file record.
  pub record: MediaFile,

  /// Filesystem path of the downloaded original video
  /// This is the input.
  pub original_download_path: PathBuf,

  // TODO: Rename back to `trimmed_resampled...`
  /// Filesystem path of the trimmed and resampled video
  /// This is the first output we generate.
  /// We'll use this downstream once it's available.
  pub maybe_processed_path: Option<PathBuf>,  //pub trimmed_resampled_video_path: PathBuf,

  /// Filesystem path of the trimmed audio
  pub trimmed_audio_path: PathBuf,

  /// This is the input into Comfy.
  /// This is typically the `trimmed_resampled_video_path`, but since Comfy
  /// can overwrite the source, we'll keep a separate copy of that file for
  /// later downstream sound restoration (since comfy wipes sound).
  pub comfy_input_video_path: PathBuf,

  /// Filesystem path of the style transfer output
  /// This is the main purpose of the job, and the second output we generate.
  pub comfy_output_video_path: PathBuf,

  /// Filesystem path of the audio-restored output
  /// This is the third output we generate.
  /// We'll want to upload this as a result, if available.
  pub audio_restored_video_path: Option<PathBuf>,

  /// Watermarked final result
  /// This is the fourth output we generate.
  /// We'll want to upload this as a result, if available.
  pub watermarked_video_path: Option<PathBuf>,

  // Nasty hack to reuse this elsewhere.
  pub comfy_input_dir: PathBuf,
}


/// This is for the secondary depth, normal, and outline videos.
/// We attach metadata as these videos progress through the system (if they're present).
pub struct SecondaryInputVideoAndPaths {
  /// Media file record.
  pub record: MediaFilesByTokensRecord,

  /// Filesystem path of the downloaded original video
  pub original_download_path: PathBuf,

  /// Filesystem path of the trimmed and resampled video
  pub maybe_processed_path: Option<PathBuf>,
}

// Adapter enum
// pub enum VideoMediaFileRecord {
//   // Records returned by single lookup
//   Single(MediaFile),
//   // Records returned by batch query
//   Bulk(MediaFilesByTokensRecord),
// }

pub trait CommonVideoPathing {
  fn original_video_path(&self) -> &Path;
}

impl CommonVideoPathing for PrimaryInputVideoAndPaths {
  fn original_video_path(&self) -> &Path {
    self.original_download_path.as_path()
  }
}

impl CommonVideoPathing for SecondaryInputVideoAndPaths {
  fn original_video_path(&self) -> &Path {
    self.original_download_path.as_path()
  }
}

impl PrimaryInputVideoAndPaths {
  pub fn new(media_file_record: MediaFile, comfy_dirs: &ComfyDirs, job_output_path: &str) -> Self {
    let original_video_path = comfy_dirs.comfy_input_dir.join("video.mp4");
    let trimmed_resampled_video_path = comfy_dirs.comfy_input_dir.join("trimmed.mp4");
    let trimmed_audio_path = comfy_dirs.comfy_input_dir.join("trimmed.wav");
    let comfy_input_video_path = comfy_dirs.comfy_input_dir.join("input.mp4");
    let comfy_output_video_path = comfy_dirs.comfy_output_dir.join(job_output_path); // TODO: This sucks.

    Self {
      record: media_file_record,
      original_download_path: original_video_path,
      maybe_processed_path: Some(trimmed_resampled_video_path),
      trimmed_audio_path,
      comfy_input_video_path,
      comfy_output_video_path,
      audio_restored_video_path: None,
      watermarked_video_path: None,
      comfy_input_dir: comfy_dirs.comfy_input_dir.clone(),
    }
  }

  pub fn video_to_watermark(&self) -> &PathBuf {
    // Try to use the audio-restored video if it's available
    self.audio_restored_video_path.as_ref()
        .unwrap_or(&self.comfy_output_video_path)
  }

  pub fn get_final_video_to_upload(&self) -> &PathBuf {
    // This is the video to upload as the result and save in the media_files table.
    self.watermarked_video_path.as_ref()
        .or(self.audio_restored_video_path.as_ref())
        .unwrap_or(&self.comfy_output_video_path)
  }

  pub fn get_non_watermarked_video_to_upload(&self) -> &PathBuf {
    // We'll upload this for internal use and for premium users.
    // Same as "video_to_watermark()"
    self.audio_restored_video_path.as_ref()
        .unwrap_or(&self.comfy_output_video_path)
  }
}

// impl VideoMediaFileRecord {
//   pub fn token(&self) -> &MediaFileToken {
//     match self {
//       VideoMediaFileRecord::Single(m) => &m.token,
//       VideoMediaFileRecord::Bulk(m) => &m.token,
//     }
//   }
//
//   pub fn maybe_title(&self) -> Option<&str> {
//     match self {
//       VideoMediaFileRecord::Single(m) => m.maybe_title.as_deref(),
//       VideoMediaFileRecord::Bulk(m) => m.maybe_title.as_deref(),
//     }
//   }
//
//   pub fn maybe_style_transfer_source_media_file_token(&self) -> Result<Option<&MediaFileToken>, ProcessSingleJobError> {
//     // TODO(bt,2024-07-09): Future proofing this to deliberately explode in case I query the
//     //  primary input media files with the bulk query.
//     match self {
//       VideoMediaFileRecord::Single(m) => Ok(m.maybe_style_transfer_source_media_file_token.as_ref()),
//       VideoMediaFileRecord::Bulk(_m) => Err(ProcessSingleJobError::Other(anyhow!("bad refactor?: failed to query foreign key"))),
//     }
//   }
//
//   pub fn maybe_scene_source_media_file_token(&self) -> Result<Option<&MediaFileToken>, ProcessSingleJobError> {
//     // TODO(bt,2024-07-09): Future proofing this to deliberately explode in case I query the
//     //  primary input media files with the bulk query.
//     match self {
//       VideoMediaFileRecord::Single(m) => Ok(m.maybe_scene_source_media_file_token.as_ref()),
//       VideoMediaFileRecord::Bulk(_m) => Err(ProcessSingleJobError::Other(anyhow!("bad refactor?: failed to query foreign key"))),
//     }
//   }
// }
