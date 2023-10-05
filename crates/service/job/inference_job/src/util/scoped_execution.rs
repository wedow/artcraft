use std::collections::BTreeSet;

use anyhow::anyhow;
use log::info;

use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use errors::AnyhowResult;

/// Execution can be scoped down to run on only certain model types or inference categories.
#[derive(Clone)]
pub struct ScopedExecution {
  /// If set, only these types of model type will be inferred.
  /// None means no scoping, so all types can execute.
  scoped_types: Option<BTreeSet<InferenceModelType>>,
}

impl ScopedExecution {

  pub fn new_from_set(scoped_types: BTreeSet<InferenceModelType>) -> Self {
    Self {
      scoped_types: Some(scoped_types),
    }
  }

  pub fn new_from_env() -> AnyhowResult<Self> {
    let scoped_types =
        match easyenv::get_env_string_optional("SCOPED_EXECUTION_MODEL_TYPES") {
          Some(comma_separated_types) => Some(parse_model_types(&comma_separated_types)?),
          None => None,
        };

    if let Some(types) = scoped_types.as_ref() {
      info!("Scoping execution to model types: {:?}", types);
    }

    Ok(Self {
      scoped_types,
    })
  }

  pub fn can_run_job(&self, job_model_type: InferenceModelType) -> bool {
    match self.scoped_types {
      None => true,
      Some(ref types) => types.contains(&job_model_type),
    }
  }

  pub fn get_scoped_model_types(&self) -> Option<&BTreeSet<InferenceModelType>> {
    self.scoped_types.as_ref()
  }
}

pub fn parse_model_types(comma_separated_types: &str) -> AnyhowResult<BTreeSet<InferenceModelType>> {
  let scoped_types = comma_separated_types.trim()
      .split(',')
      .map(|val| val.to_lowercase())
      .collect::<Vec<String>>();

  let mut model_types = BTreeSet::new();

  for t in scoped_types.into_iter() {
    let model_type = InferenceModelType::from_str(&t)
        .map_err(|_err| anyhow!(
          "Invalid model type: {:?}; should include only items from: {:?}",
          t,
          InferenceModelType::all_variants()))?;

    model_types.insert(model_type);
  }

  Ok(model_types)
}

#[cfg(test)]
mod tests {
  use std::collections::BTreeSet;

  use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;

  use crate::util::scoped_execution::{parse_model_types, ScopedExecution};

  #[test]
  fn test_parse() {
    assert_eq!(parse_model_types("rvc_v2,so_vits_svc").unwrap(),
      BTreeSet::from([InferenceModelType::RvcV2, InferenceModelType::SoVitsSvc]));
  }

  #[test]
  fn test_can_execute() {
    let scoping = ScopedExecution::new_from_set(BTreeSet::from([
      InferenceModelType::RvcV2,
      InferenceModelType::Vits
    ]));

    assert!(scoping.can_run_job(InferenceModelType::RvcV2));
    assert!(scoping.can_run_job(InferenceModelType::Vits));

    assert!(!scoping.can_run_job(InferenceModelType::SoVitsSvc));
    assert!(!scoping.can_run_job(InferenceModelType::Tacotron2));
  }
}
