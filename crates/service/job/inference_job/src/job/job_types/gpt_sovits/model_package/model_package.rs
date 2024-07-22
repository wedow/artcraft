use std::collections::{BTreeSet, HashSet};

use once_cell::sync::Lazy;

use buckets::public::weight_files::bucket_file_path::WeightFileBucketPath;

pub const SUFFIX: &str = ".bin";

static ALLOWED_TYPES_GPT : Lazy<HashSet<&'static str>> = Lazy::new(|| {
  HashSet::from([
    "ckpt",
  ])
});

static ALLOWED_TYPES_SOVITS : Lazy<HashSet<&'static str>> = Lazy::new(|| {
  HashSet::from([
    "pth",
  ])
});

static ALLOWED_TYPES_REF_AUDIO : Lazy<HashSet<&'static str>> = Lazy::new(|| {
  HashSet::from([
    "wav",
  ])
});

#[derive(Debug, Clone, Ord, PartialOrd, Eq, PartialEq)]
pub enum GptSovitsPackageFileType {
  GptModel,
  SovitsCheckpoint,
  ReferenceAudio,
}

impl GptSovitsPackageFileType {
  pub fn for_extension(extension: &str) -> Option<Self> {
    if ALLOWED_TYPES_GPT.contains(extension) {
      Some(GptSovitsPackageFileType::GptModel)
    } else if ALLOWED_TYPES_SOVITS.contains(extension) {
      Some(GptSovitsPackageFileType::SovitsCheckpoint)
    } else if ALLOWED_TYPES_REF_AUDIO.contains(extension) {
      Some(GptSovitsPackageFileType::ReferenceAudio)
    } else {
      None
    }
  }

  pub fn extension_is_allowed(&self, extension: &str) -> bool {
    match self {
      GptSovitsPackageFileType::GptModel => ALLOWED_TYPES_GPT.contains(extension),
      GptSovitsPackageFileType::SovitsCheckpoint => ALLOWED_TYPES_SOVITS.contains(extension),
      GptSovitsPackageFileType::ReferenceAudio => ALLOWED_TYPES_REF_AUDIO.contains(extension),
    }
  }


  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::GptModel,
      Self::SovitsCheckpoint,
      Self::ReferenceAudio,
    ])
  }

  pub fn package_identifier(&self) -> &str {
    match self {
      GptSovitsPackageFileType::GptModel => "gpt_model",
      GptSovitsPackageFileType::SovitsCheckpoint => "sovits_checkpoint",
      GptSovitsPackageFileType::ReferenceAudio => "reference_audio",
    }
  }

  pub fn get_expected_package_suffix(&self) -> String {
    format!(".{}{}", self.package_identifier(), SUFFIX)
  }
}

#[derive(Debug)]
pub enum GptSovitsPackageError {
  InvalidArchive,
  InvalidGPTModel(String),
  InvalidSovitsCheckpoint(String),
  InvalidReferenceAudio(String),
  UploadError,
  TooManyFiles,
  ExtractionError,
  FileError,
}

pub struct GptSovitsPackageFile {
  pub public_upload_path: WeightFileBucketPath,
  pub sha256_checksum: String,
  pub file_size_bytes: u64,
}

pub struct GptSovitsPackageDetails {
  pub gpt_model: GptSovitsPackageFile,
  pub sovits_checkpoint: GptSovitsPackageFile,
  pub reference_audio: GptSovitsPackageFile,
}

