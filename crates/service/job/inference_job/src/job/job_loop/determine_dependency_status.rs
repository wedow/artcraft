use anyhow::anyhow;
use crate::job_dependencies::JobDependencies;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::tts_models::tts_model_type::TtsModelType;
use enums::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use errors::AnyhowResult;
use filesys::file_exists::file_exists;
use log::warn;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::tts::tts_models::get_tts_model_for_inference_improved::{get_tts_model_for_inference_improved, TtsModelForInferenceRecord};
use mysql_queries::queries::voice_conversion::inference::get_voice_conversion_model_for_inference::{get_voice_conversion_model_for_inference, VoiceConversionModelForInference};
use std::path::PathBuf;

pub struct DependencyStatus {
  /// The DB record for the model being used in this job.
  pub maybe_inference_model: MaybeInferenceModel,

  /// The model token (if there is a model)
  pub maybe_model_token: Option<String>,

  /// Whether the ML model(s) already exist on the filesystem.
  /// If so, we won't need to incur a bucket download, and we should prioritize the job.
  pub models_already_on_filesystem: bool,
}

pub enum MaybeInferenceModel {
  None,
  TtsModel(TtsModelForInferenceRecord),
  VcModel(VoiceConversionModelForInference)
}

pub async fn determine_dependency_status(job_dependencies: &JobDependencies, job: &AvailableInferenceJob) -> AnyhowResult<DependencyStatus> {

  let maybe_model = get_model_record_from_cacheable_query(job_dependencies, job).await?;

  let mut maybe_model_token = None;

  // TODO: Also check other paths (vocoders, etc.)
  let maybe_filesystem_path = match maybe_model {
    MaybeInferenceModel::TtsModel(ref model) => {
      match model.tts_model_type {
        TtsModelType::Tacotron2 => {
          maybe_model_token = Some(model.model_token.to_string());
          Some(job_dependencies
              .fs
              .semi_persistent_cache
              .tts_synthesizer_model_path(model.model_token.as_str()))
        }
        TtsModelType::Vits => {
          None
        }
      }
    }
    MaybeInferenceModel::VcModel(ref model) => {
      match model.model_type {
        VoiceConversionModelType::SoftVc => {
          None
        }
        VoiceConversionModelType::SoVitsSvc => {
          maybe_model_token = Some(model.token.to_string());
          Some(job_dependencies
              .fs
              .semi_persistent_cache
              .voice_conversion_model_path(model.token.as_str()))
        }
        VoiceConversionModelType::Rvc => {
            unimplemented!()
        }
      }
    }
    MaybeInferenceModel::None => {
      None
    }
  };

  let models_already_on_filesystem = match maybe_filesystem_path {
    None => true,
    Some(path) => file_exists(path),
  };

  Ok(DependencyStatus {
    maybe_inference_model: maybe_model,
    maybe_model_token,
    models_already_on_filesystem,
  })
}

pub async fn get_model_record_from_cacheable_query(job_dependencies: &JobDependencies, job: &AvailableInferenceJob) -> AnyhowResult<MaybeInferenceModel> {
  let model = match (job.inference_category, job.maybe_model_token.as_deref()) {
    (InferenceCategory::TextToSpeech, Some(token)) => {
      let maybe_model = job_dependencies.caches.tts_model_record_cache.copy_without_bump_if_unexpired(token.to_string())?;

      match maybe_model {
        Some(model) => MaybeInferenceModel::TtsModel(model),
        None => {
          let maybe_tts_model = get_tts_model_for_inference_improved(
            &job_dependencies.mysql_pool, token)
              .await
              .map_err(|err| anyhow!("database error: {:?}", err))?;

          match maybe_tts_model {
            Some(model) => {
              let token = token.to_string();
              let _r = job_dependencies.caches.tts_model_record_cache.store_copy(&token, &model)?;
              MaybeInferenceModel::TtsModel(model)
            },

            None => MaybeInferenceModel::None,
          }
        }
      }
    }
    (InferenceCategory::VoiceConversion, Some(token)) => {
      let maybe_model = job_dependencies.caches.vc_model_record_cache.copy_without_bump_if_unexpired(token.to_string())?;

      match maybe_model {
        Some(model) => MaybeInferenceModel::VcModel(model),
        None => {
          let maybe_tts_model = get_voice_conversion_model_for_inference(
            &job_dependencies.mysql_pool, token)
              .await
              .map_err(|err| anyhow!("database error: {:?}", err))?;

          match maybe_tts_model {
            Some(model) => {
              let token = token.to_string();
              let _r = job_dependencies.caches.vc_model_record_cache.store_copy(&token, &model)?;
              MaybeInferenceModel::VcModel(model)
            },

            None => MaybeInferenceModel::None,
          }
        }
      }
    }
    _ => {
      warn!("Job does not have a category or a model token: {:?} - category: {:?}, token: {:?}",
        job.id, job.inference_category, job.maybe_model_token);

      MaybeInferenceModel::None
    },
  };

  Ok(model)
}
