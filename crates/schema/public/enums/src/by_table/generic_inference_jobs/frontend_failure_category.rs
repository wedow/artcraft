use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `generic_inference_jobs` table in `VARCHAR(32)` field `frontend_failure_category`.
///
/// When jobs fail (permanently or transiently), we need to inform the frontend of the reason,
/// because perhaps there's something the user can do to change their input.
///
/// The previous "VARCHAR(32) failure_reason" column was a text-based message that could not be
/// localized or made user friendly. This `frontend_failure_category` exists to provide well-defined
/// failure categories to the frontend that can easily be localized and indicated consistently in
/// the UI.
///
/// Another benefit is that we'll surface all of the various types of failure and perhaps eventually
/// come to handle some in a cross-cutting way.
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema)]
pub enum FrontendFailureCategory {
  /// When a face is not detected in the image used for animation.
  /// For SadTalker (and possibly Wav2Lip)
  #[serde(rename = "face_not_detected")]
  FaceNotDetected,

  /// The user stepped away from their device and expected the workload to finish.
  /// Some workloads require that the user keep their browser open.
  #[serde(rename = "keep_alive_elapsed")]
  KeepAliveElapsed,

  /// This is mostly for developers -- a feature isn't complete somewhere in the code.
  /// Big oops if errors of this class make it to production.
  #[serde(rename = "not_yet_implemented")]
  NotYetImplemented,

  /// Tell the user that some kind of transient error happened. They don't need to know
  /// exactly what happened. We'll retry their workload in any case.
  #[serde(rename = "retryable_worker_error")]
  RetryableWorkerError,

  /// Model content rules were violated
  /// Eg. Seedance 2 will report: "your input text violates platform rules. please modify and try again"
  #[serde(rename = "model_rules_violation")]
  ModelRulesViolation,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(FrontendFailureCategory);
impl_mysql_enum_coders!(FrontendFailureCategory);

/// NB: Legacy API for older code.
impl FrontendFailureCategory {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::FaceNotDetected => "face_not_detected",
      Self::KeepAliveElapsed => "keep_alive_elapsed",
      Self::NotYetImplemented => "not_yet_implemented",
      Self::RetryableWorkerError => "retryable_worker_error",
      Self::ModelRulesViolation => "model_rules_violation",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "face_not_detected" => Ok(Self::FaceNotDetected),
      "keep_alive_elapsed" => Ok(Self::KeepAliveElapsed),
      "not_yet_implemented" => Ok(Self::NotYetImplemented),
      "retryable_worker_error" => Ok(Self::RetryableWorkerError),
      "model_rules_violation" => Ok(Self::ModelRulesViolation),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::FaceNotDetected,
      Self::KeepAliveElapsed,
      Self::NotYetImplemented,
      Self::RetryableWorkerError,
      Self::ModelRulesViolation,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(FrontendFailureCategory::FaceNotDetected, "face_not_detected");
      assert_serialization(FrontendFailureCategory::KeepAliveElapsed, "keep_alive_elapsed");
      assert_serialization(FrontendFailureCategory::NotYetImplemented, "not_yet_implemented");
      assert_serialization(FrontendFailureCategory::RetryableWorkerError, "retryable_worker_error");
      assert_serialization(FrontendFailureCategory::ModelRulesViolation, "model_rules_violation");
    }

    #[test]
    fn to_str() {
      assert_eq!(FrontendFailureCategory::FaceNotDetected.to_str(), "face_not_detected");
      assert_eq!(FrontendFailureCategory::KeepAliveElapsed.to_str(), "keep_alive_elapsed");
      assert_eq!(FrontendFailureCategory::NotYetImplemented.to_str(), "not_yet_implemented");
      assert_eq!(FrontendFailureCategory::RetryableWorkerError.to_str(), "retryable_worker_error");
      assert_eq!(FrontendFailureCategory::ModelRulesViolation.to_str(), "model_rules_violation");
    }

    #[test]
    fn from_str() {
      assert_eq!(FrontendFailureCategory::from_str("face_not_detected").unwrap(), FrontendFailureCategory::FaceNotDetected);
      assert_eq!(FrontendFailureCategory::from_str("keep_alive_elapsed").unwrap(), FrontendFailureCategory::KeepAliveElapsed);
      assert_eq!(FrontendFailureCategory::from_str("not_yet_implemented").unwrap(), FrontendFailureCategory::NotYetImplemented);
      assert_eq!(FrontendFailureCategory::from_str("retryable_worker_error").unwrap(), FrontendFailureCategory::RetryableWorkerError);
      assert_eq!(FrontendFailureCategory::from_str("model_rules_violation").unwrap(), FrontendFailureCategory::ModelRulesViolation);
    }

    #[test]
    fn all_variants() {
      let mut variants = FrontendFailureCategory::all_variants();
      assert_eq!(variants.len(), 5);
      assert_eq!(variants.pop_first(), Some(FrontendFailureCategory::FaceNotDetected));
      assert_eq!(variants.pop_first(), Some(FrontendFailureCategory::KeepAliveElapsed));
      assert_eq!(variants.pop_first(), Some(FrontendFailureCategory::NotYetImplemented));
      assert_eq!(variants.pop_first(), Some(FrontendFailureCategory::RetryableWorkerError));
      assert_eq!(variants.pop_first(), Some(FrontendFailureCategory::ModelRulesViolation));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(FrontendFailureCategory::all_variants().len(), FrontendFailureCategory::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in FrontendFailureCategory::all_variants() {
        assert_eq!(variant, FrontendFailureCategory::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, FrontendFailureCategory::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, FrontendFailureCategory::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  }
}
