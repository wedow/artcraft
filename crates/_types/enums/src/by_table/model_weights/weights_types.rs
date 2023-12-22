use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema)]
pub enum WeightsType {
    #[serde(rename = "hifigan_tt2")]
    HifiganTacotron2,
    #[serde(rename = "rvc_v2")]
    RvcV2,
    #[serde(rename = "sd_1.5")]
    StableDiffusion15,
    #[serde(rename = "sdxl")]
    StableDiffusionXL,
    #[serde(rename = "so_vits_svc")]
    SoVitsSvc,
    #[serde(rename = "tt2")]
    Tacotron2,
    #[serde(rename = "loRA")]
    LoRA,
    #[serde(rename = "vall_e")]
    VallE,
}


impl WeightsType {
    pub fn to_str(&self) -> &'static str {
        match self {
            Self::HifiganTacotron2 => "hifigan_tt2",
            Self::RvcV2 => "rvc_v2",
            Self::StableDiffusion15 => "sd_1.5",
            Self::StableDiffusionXL => "sdxl",
            Self::SoVitsSvc => "so_vits_svc",
            Self::Tacotron2 => "tt2",
            Self::LoRA => "loRA",
            Self::VallE => "vall_e",
        }
    }

    pub fn from_str(value: &str) -> Result<Self, String> {
        match value {
            "hifigan_tt2" => Ok(Self::HifiganTacotron2),
            "rvc_v2" => Ok(Self::RvcV2),
            "sd_1.5" => Ok(Self::StableDiffusion15),
            "sdxl" => Ok(Self::StableDiffusionXL),
            "so_vits_svc" => Ok(Self::SoVitsSvc),
            "tt2" => Ok(Self::Tacotron2),
            "loRA" => Ok(Self::LoRA),
            "vall_e" => Ok(Self::VallE),
            _ => Err(format!("invalid value: {:?}", value)),
        }
    }

    pub fn all_variants() -> BTreeSet<Self> {
        BTreeSet::from([
            Self::HifiganTacotron2,
            Self::RvcV2,
            Self::StableDiffusion15,
            Self::StableDiffusionXL,
            Self::SoVitsSvc,
            Self::Tacotron2,
            Self::LoRA,
            Self::VallE
        ])
    }
}

impl_enum_display_and_debug_using_to_str!(WeightsType);
impl_mysql_enum_coders!(WeightsType);
impl_mysql_from_row!(WeightsType);

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_to_str() {
        assert_eq!(WeightsType::HifiganTacotron2.to_str(), "hifigan_tt2");
        assert_eq!(WeightsType::RvcV2.to_str(), "rvc_v2");
        assert_eq!(WeightsType::StableDiffusion15.to_str(), "sd_1.5");
        assert_eq!(WeightsType::StableDiffusionXL.to_str(), "sdxl");
        assert_eq!(WeightsType::SoVitsSvc.to_str(), "so_vits_svc");
        assert_eq!(WeightsType::Tacotron2.to_str(), "tt2");
        assert_eq!(WeightsType::LoRA.to_str(), "loRA");
        assert_eq!(WeightsType::VallE.to_str(), "vall_e");
    }

    #[test]
    fn test_from_str() {
        assert_eq!(WeightsType::from_str("hifigan_tt2").unwrap(), WeightsType::HifiganTacotron2);
        assert_eq!(WeightsType::from_str("rvc_v2").unwrap(), WeightsType::RvcV2);
        assert_eq!(WeightsType::from_str("sd_1.5").unwrap(), WeightsType::StableDiffusion15);
        assert_eq!(WeightsType::from_str("sdxl").unwrap(), WeightsType::StableDiffusionXL);
        assert_eq!(WeightsType::from_str("so_vits_svc").unwrap(), WeightsType::SoVitsSvc);
        assert_eq!(WeightsType::from_str("tt2").unwrap(), WeightsType::Tacotron2);
        assert_eq!(WeightsType::from_str("loRA").unwrap(), WeightsType::LoRA);
        assert_eq!(WeightsType::from_str("vall_e").unwrap(), WeightsType::VallE);
        assert!(WeightsType::from_str("invalid").is_err());
    }

    #[test]
    fn test_all_variants() {
        let variants = WeightsType::all_variants();
        assert_eq!(variants.len(), 8);
        assert!(variants.contains(&WeightsType::HifiganTacotron2));
        assert!(variants.contains(&WeightsType::RvcV2));
        assert!(variants.contains(&WeightsType::StableDiffusion15));
        assert!(variants.contains(&WeightsType::StableDiffusionXL));
        assert!(variants.contains(&WeightsType::SoVitsSvc));
        assert!(variants.contains(&WeightsType::Tacotron2));
        assert!(variants.contains(&WeightsType::LoRA));
        assert!(variants.contains(&WeightsType::VallE));
    }
}
