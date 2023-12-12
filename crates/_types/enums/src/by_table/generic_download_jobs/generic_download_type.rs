use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

// TODO: Use macro-derived impls

/// Our "generic downloads" pipeline supports a wide variety of ML models and other media.
/// They are serialized in the database table `generic_download_jobs` as a VARCHAR(32).
///
/// Each type of download is identified by the following enum variants.
/// These types are present in the HTTP API and database columns as serialized here.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Debug, Deserialize, Serialize, sqlx::Type, Hash, Ord, PartialOrd)]
pub enum GenericDownloadType {
  /// NB: Note - this is hifigan for Tacotron2.
  /// Some work will be needed to unify this with other hifigan types.
  #[serde(rename = "hifigan")]
  #[sqlx(rename = "hifigan")]
  HifiGan,

  /// NB: Note - this is hifigan for SoftVC (our internal codename is "rocketvc").
  /// Some work will need to be done to unify this with other hifigan types.
  #[serde(rename = "hifigan_rocket_vc")]
  #[sqlx(rename = "hifigan_rocket_vc")]
  HifiGanRocketVc,

  /// NB: Note - this is hifigan for SoVitsSvc
  /// Some work will need to be done to unify this with other hifigan types.
  #[serde(rename = "hifigan_so_vits_svc")]
  #[sqlx(rename = "hifigan_so_vits_svc")]
  HifiGanSoVitsSvc,

  //#[serde(rename = "melgan_vocodes")]
  //#[sqlx(rename = "melgan_vocodes")]
  //MelGanVocodes,

  /// NB: Our external-facing name for "softvc" is rocketvc.
  /// I wish we could stop being stupid about this.
  #[serde(rename = "rocket_vc")]
  #[sqlx(rename = "rocket_vc")]
  RocketVc,

  /// RVC (v2) voice conversion models
  #[serde(rename = "rvc_v2")]
  #[sqlx(rename = "rvc_v2")]
  RvcV2,

  /// so-vits-svc voice conversion models
  #[serde(rename = "so_vits_svc")]
  #[sqlx(rename = "so_vits_svc")]
  SoVitsSvc,

  /// Tacotron TTS models.
  #[serde(rename = "tacotron2")]
  #[sqlx(rename = "tacotron2")]
  Tacotron2,

  /// VITS TTS models.
  #[serde(rename = "vits")]
  #[sqlx(rename = "vits")]
  Vits,

  // SD models
  #[serde(rename = "sd_15")]
  #[sqlx(rename = "sd_15")]
  StableDiffusion15,
}

/// NB: Legacy API for older code.
impl GenericDownloadType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::HifiGan => "hifigan",
      Self::HifiGanRocketVc => "hifigan_rocket_vc",
      Self::HifiGanSoVitsSvc => "hifigan_so_vits_svc",
      Self::RocketVc => "rocket_vc",
      Self::RvcV2 => "rvc_v2",
      Self::SoVitsSvc => "so_vits_svc",
      Self::Tacotron2 => "tacotron2",
      Self::Vits => "vits",
      Self::StableDiffusion15 => "sd_15"
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "hifigan" => Ok(Self::HifiGan),
      "hifigan_rocket_vc" => Ok(Self::HifiGanRocketVc),
      "hifigan_so_vits_svc" => Ok(Self::HifiGanSoVitsSvc),
      "rocket_vc" => Ok(Self::RocketVc),
      "rvc_v2" => Ok(Self::RvcV2),
      "so_vits_svc" => Ok(Self::SoVitsSvc),
      "tacotron2" => Ok(Self::Tacotron2),
      "vits" => Ok(Self::Vits),
      "sd_15" => Ok(Self::StableDiffusion15),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::HifiGan,
      Self::HifiGanRocketVc,
      Self::HifiGanSoVitsSvc,
      Self::RocketVc,
      Self::RvcV2,
      Self::SoVitsSvc,
      Self::Tacotron2,
      Self::Vits,
      Self::StableDiffusion15,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::generic_download_jobs::generic_download_type::GenericDownloadType;
  use crate::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(GenericDownloadType::HifiGan, "hifigan");
    assert_serialization(GenericDownloadType::HifiGanRocketVc, "hifigan_rocket_vc");
    assert_serialization(GenericDownloadType::HifiGanSoVitsSvc, "hifigan_so_vits_svc");
    assert_serialization(GenericDownloadType::RocketVc, "rocket_vc");
    assert_serialization(GenericDownloadType::RvcV2, "rvc_v2");
    assert_serialization(GenericDownloadType::SoVitsSvc, "so_vits_svc");
    assert_serialization(GenericDownloadType::Tacotron2, "tacotron2");
    assert_serialization(GenericDownloadType::Vits, "vits");
    assert_serialization(GenericDownloadType::StableDiffusion15, "sd_15");
  }

  #[test]
  fn to_str() {
    assert_eq!(GenericDownloadType::HifiGan.to_str(), "hifigan");
    assert_eq!(GenericDownloadType::HifiGanRocketVc.to_str(), "hifigan_rocket_vc");
    assert_eq!(GenericDownloadType::HifiGanSoVitsSvc.to_str(), "hifigan_so_vits_svc");
    assert_eq!(GenericDownloadType::RocketVc.to_str(), "rocket_vc");
    assert_eq!(GenericDownloadType::RvcV2.to_str(), "rvc_v2");
    assert_eq!(GenericDownloadType::SoVitsSvc.to_str(), "so_vits_svc");
    assert_eq!(GenericDownloadType::Tacotron2.to_str(), "tacotron2");
    assert_eq!(GenericDownloadType::Vits.to_str(), "vits");
    assert_eq!(GenericDownloadType::StableDiffusion15.to_str(), "sd_15");
  }

  #[test]
  fn from_str() {
    assert_eq!(GenericDownloadType::from_str("hifigan").unwrap(), GenericDownloadType::HifiGan);
    assert_eq!(GenericDownloadType::from_str("hifigan_rocket_vc").unwrap(), GenericDownloadType::HifiGanRocketVc);
    assert_eq!(GenericDownloadType::from_str("hifigan_so_vits_svc").unwrap(), GenericDownloadType::HifiGanSoVitsSvc);
    assert_eq!(GenericDownloadType::from_str("rocket_vc").unwrap(), GenericDownloadType::RocketVc);
    assert_eq!(GenericDownloadType::from_str("rvc_v2").unwrap(), GenericDownloadType::RvcV2);
    assert_eq!(GenericDownloadType::from_str("so_vits_svc").unwrap(), GenericDownloadType::SoVitsSvc);
    assert_eq!(GenericDownloadType::from_str("tacotron2").unwrap(), GenericDownloadType::Tacotron2);
    assert_eq!(GenericDownloadType::from_str("vits").unwrap(), GenericDownloadType::Vits);
    assert_eq!(GenericDownloadType::from_str("sd_15").unwrap(), GenericDownloadType::StableDiffusion15);
  }

  #[test]
  fn all_variants() {
    // Static check
    let mut variants = GenericDownloadType::all_variants();
    assert_eq!(variants.len(), 9);
    assert_eq!(variants.pop_first(), Some(GenericDownloadType::HifiGan));
    assert_eq!(variants.pop_first(), Some(GenericDownloadType::HifiGanRocketVc));
    assert_eq!(variants.pop_first(), Some(GenericDownloadType::HifiGanSoVitsSvc));
    assert_eq!(variants.pop_first(), Some(GenericDownloadType::RocketVc));
    assert_eq!(variants.pop_first(), Some(GenericDownloadType::RvcV2));
    assert_eq!(variants.pop_first(), Some(GenericDownloadType::SoVitsSvc));
    assert_eq!(variants.pop_first(), Some(GenericDownloadType::Tacotron2));
    assert_eq!(variants.pop_first(), Some(GenericDownloadType::Vits));
    assert_eq!(variants.pop_first(), Some(GenericDownloadType::StableDiffusion15));
    assert_eq!(variants.pop_first(), None);

    // Generated check
    use strum::IntoEnumIterator;
    assert_eq!(GenericDownloadType::all_variants().len(), GenericDownloadType::iter().len());
  }
}
