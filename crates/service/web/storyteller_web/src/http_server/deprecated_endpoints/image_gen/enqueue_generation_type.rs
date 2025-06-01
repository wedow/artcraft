use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Debug, Deserialize, Serialize, ToSchema)]
pub enum EnqueueImageGenType {
    #[serde(rename = "upload_lora")]
    UploadLoRA,
    #[serde(rename = "upload_sd")]
    Checkpoint,
    #[serde(rename = "inference")]
    Inference,
}

impl EnqueueImageGenType {
    pub fn to_str(&self) -> &'static str {
        match self {
            Self::UploadLoRA => "upload_lora",
            Self::Checkpoint => "upload_sd",
            Self::Inference => "inference",
        }
    }

    pub fn from_str(value: &str) -> Result<Self, String> {
        match value {
            "upload_lora" => Ok(Self::UploadLoRA),
            "upload_sd" => Ok(Self::Checkpoint),
            "inference" => Ok(Self::Inference),
            _ => Err(format!("invalid value: {:?}", value)),
        }
    }

    pub fn all_variants() -> BTreeSet<Self> {
        BTreeSet::from([
            Self::UploadLoRA,
            Self::Checkpoint,
            Self::Inference
        ])
    }
}


#[cfg(test)]
mod tests {
  use super::*;

  #[test]
    fn test_to_str() {
        assert_eq!(EnqueueImageGenType::UploadLoRA.to_str(), "upload_lora");
        assert_eq!(EnqueueImageGenType::Checkpoint.to_str(), "upload_sd");
        assert_eq!(EnqueueImageGenType::Inference.to_str(), "inference");
    }

    #[test]
    fn test_from_str() {
        assert_eq!(EnqueueImageGenType::from_str("upload_lora").unwrap(), EnqueueImageGenType::UploadLoRA);
        assert_eq!(EnqueueImageGenType::from_str("upload_sd").unwrap(), EnqueueImageGenType::Checkpoint);
        assert_eq!(EnqueueImageGenType::from_str("inference").unwrap(), EnqueueImageGenType::Inference);
        assert!(EnqueueImageGenType::from_str("invalid").is_err());
    }

    #[test]
    fn test_all_variants() {
        let variants = EnqueueImageGenType::all_variants();
        assert_eq!(variants.len(), 3);
        assert!(variants.contains(&EnqueueImageGenType::UploadLoRA));
        assert!(variants.contains(&EnqueueImageGenType::Checkpoint));
        assert!(variants.contains(&EnqueueImageGenType::Inference));
    }
}