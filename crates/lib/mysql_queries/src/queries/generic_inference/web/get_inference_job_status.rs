use anyhow::anyhow;
use chrono::{DateTime, Utc};
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use errors::AnyhowResult;
use log::warn;
use sqlx::MySqlPool;
use tokens::jobs::inference::InferenceJobToken;
use crate::helpers::boolean_converters::i8_to_bool;

pub struct GenericInferenceJobStatus {
  pub job_token: InferenceJobToken,

  pub status: String,
  pub attempt_count: u16,

  pub maybe_assigned_worker: Option<String>,
  pub maybe_assigned_cluster: Option<String>,

  pub maybe_first_started_at: Option<DateTime<Utc>>,

  pub request_details: RequestDetails,
  pub maybe_result_details: Option<ResultDetails>,

  pub is_keepalive_required: bool,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

pub struct RequestDetails {
  pub inference_category: InferenceCategory,
  pub maybe_model_type: Option<String>, // TODO: Strongly type
  pub maybe_model_token: Option<String>,
  pub maybe_model_title: Option<String>,

  /// TTS input. In the future, perhaps voice conversion SST
  pub maybe_raw_inference_text: Option<String>,
}

pub struct ResultDetails {
  pub entity_type: String,
  pub entity_token: String,

  /// The bucket storage hash (for vc) or full path (for tts)
  pub public_bucket_location_or_hash: String,

  /// Whether the location is a full path (for tts) or a hash (for vc) that
  /// needs to be reconstructed into a path.
  pub public_bucket_location_is_hash: bool,

  pub maybe_successfully_completed_at: Option<DateTime<Utc>>,
}

/// Look up job status.
/// Returns Ok(None) when the record cannot be found.
pub async fn get_inference_job_status(job_token: &InferenceJobToken, mysql_pool: &MySqlPool)
  -> AnyhowResult<Option<GenericInferenceJobStatus>>
{
  // NB(bt): jobs.uuid_idempotency_token is the current way to reconstruct the hash of the
  // TTS result since we don't store a bucket hash on the table. This is an ugly hack :(

  let maybe_status = sqlx::query_as!(
      RawGenericInferenceJobStatus,
        r#"
SELECT
    jobs.token as `job_token: tokens::jobs::inference::InferenceJobToken`,

    jobs.status,
    jobs.attempt_count,

    jobs.inference_category as `inference_category: enums::by_table::generic_inference_jobs::inference_category::InferenceCategory`,
    jobs.maybe_model_type,
    jobs.maybe_model_token,
    jobs.maybe_raw_inference_text,

    jobs.on_success_result_entity_type as maybe_result_entity_type,
    jobs.on_success_result_entity_token as maybe_result_entity_token,

    tts_models.title as maybe_tts_model_title,
    voice_conversion_models.title as maybe_voice_conversion_model_title,

    tts_results.public_bucket_wav_audio_path as maybe_tts_public_bucket_path,
    voice_conversion_results.public_bucket_hash as maybe_voice_conversion_public_bucket_hash,

    jobs.assigned_worker as maybe_assigned_worker,
    jobs.assigned_cluster as maybe_assigned_cluster,

    jobs.is_keepalive_required,

    jobs.created_at,
    jobs.updated_at,

    jobs.first_started_at as maybe_first_started_at,
    jobs.successfully_completed_at as maybe_successfully_completed_at

FROM generic_inference_jobs as jobs

LEFT OUTER JOIN tts_models ON jobs.maybe_model_token = tts_models.token
LEFT OUTER JOIN voice_conversion_models ON jobs.maybe_model_token = voice_conversion_models.token

LEFT OUTER JOIN tts_results ON jobs.on_success_result_entity_token = tts_results.token
LEFT OUTER JOIN voice_conversion_results ON jobs.on_success_result_entity_token = voice_conversion_results.token

WHERE jobs.token = ?
        "#,
      job_token
    )
      .fetch_one(mysql_pool)
      .await;

  let record = match maybe_status {
    Ok(record) => record,
    Err(err) => match err {
      sqlx::Error::RowNotFound => return Ok(None),
      _ => {
        warn!("error querying job record: {:?}", err);
        return Err(anyhow!("error querying job record: {:?}", err));
      }
    }
  };

  let maybe_model_title = match record.inference_category {
    InferenceCategory::LipsyncAnimation => Some("lipsync animation"),
    InferenceCategory::TextToSpeech => record.maybe_tts_model_title.as_deref(),
    InferenceCategory::VoiceConversion => record.maybe_voice_conversion_model_title.as_deref(),
  };

  // NB: A bit of a hack. We store TTS results with a full path.
  // Going forward, all other record types will store a hash.
  let (bucket_path_is_hash, maybe_public_bucket_hash) = match record.inference_category {
    InferenceCategory::LipsyncAnimation => (true, Some("todo")), // TODO - these values are wrong
    InferenceCategory::TextToSpeech => (false, record.maybe_tts_public_bucket_path.as_deref()),
    InferenceCategory::VoiceConversion => (true, record.maybe_voice_conversion_public_bucket_hash.as_deref()),
  };

  let maybe_result_details = record
      .maybe_result_entity_type
      .as_deref()
      .and_then(|entity_type| {
        record.maybe_result_entity_token
            .as_deref()
            .and_then(|entity_token| {
              maybe_public_bucket_hash.map(|public_bucket_hash| {
                ResultDetails {
                  entity_type: entity_type.to_string(),
                  entity_token: entity_token.to_string(),
                  public_bucket_location_or_hash: public_bucket_hash.to_string(),
                  public_bucket_location_is_hash: bucket_path_is_hash,
                  maybe_successfully_completed_at: record.maybe_successfully_completed_at.clone(),
                }
              })
            })
      });

  Ok(Some(GenericInferenceJobStatus {
    job_token: record.job_token,
    status: record.status,
    attempt_count: record.attempt_count,
    maybe_assigned_worker: record.maybe_assigned_worker,
    maybe_assigned_cluster: record.maybe_assigned_cluster,
    maybe_first_started_at: record.maybe_first_started_at,
    request_details: RequestDetails {
      inference_category: record.inference_category,
      maybe_model_type: record.maybe_model_type,
      maybe_model_token: record.maybe_model_token,
      maybe_model_title: maybe_model_title.map(|title| title.to_string()),
      maybe_raw_inference_text: record.maybe_raw_inference_text,
    },
    maybe_result_details,
    is_keepalive_required: i8_to_bool(record.is_keepalive_required),
    created_at: record.created_at,
    updated_at: record.updated_at,
  }))
}

struct RawGenericInferenceJobStatus {
  pub job_token: InferenceJobToken,

  pub status: String,
  pub attempt_count: u16,

  pub inference_category: InferenceCategory,
  pub maybe_model_type: Option<String>,
  pub maybe_model_token: Option<String>,
  pub maybe_raw_inference_text: Option<String>,

  pub maybe_result_entity_type: Option<String>,
  pub maybe_result_entity_token: Option<String>,

  pub maybe_tts_model_title: Option<String>,
  pub maybe_voice_conversion_model_title: Option<String>,

  pub maybe_voice_conversion_public_bucket_hash: Option<String>, // NB: This is the bucket hash.
  pub maybe_tts_public_bucket_path: Option<String>, // NB: This isn't the bucket path, but the whole hash.

  pub maybe_assigned_worker: Option<String>,
  pub maybe_assigned_cluster: Option<String>,

  pub is_keepalive_required: i8,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  pub maybe_first_started_at: Option<DateTime<Utc>>,
  pub maybe_successfully_completed_at: Option<DateTime<Utc>>,
}

