use std::collections::BTreeSet;

use anyhow::anyhow;
use chrono::Utc;
use sqlx::MySqlPool;

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use enums::common::job_status_plus::JobStatusPlus;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

use crate::helpers::boolean_converters::i8_to_bool;
use crate::payloads::generic_inference_args::generic_inference_args::GenericInferenceArgs;
use crate::queries::generic_inference::job::_keys::GenericInferenceJobId;

/// table: generic_inference_jobs
#[derive(Debug)]
pub struct AvailableInferenceJob {
  pub id: GenericInferenceJobId,
  pub inference_job_token: InferenceJobToken,

  pub uuid_idempotency_token: String, // TODO: This is temporarily being used for upload paths.

  // Inference class
  pub inference_category: InferenceCategory,

  pub maybe_model_type: Option<InferenceModelType>,
  pub maybe_model_token: Option<String>,

  pub maybe_input_source_token: Option<String>,
  pub maybe_input_source_token_type: Option<String>,

  // Inference details
  pub maybe_inference_args: Option<GenericInferenceArgs>,
  pub maybe_raw_inference_text: Option<String>,

  // User information to propagate downstream
  pub maybe_creator_user_token: Option<String>,
  pub maybe_creator_anonymous_visitor_token: Option<String>,
  pub creator_ip_address: String,
  pub creator_set_visibility: Visibility,

  // Job information
  pub status: JobStatusPlus,
  pub attempt_count: u16,

  pub priority_level: u16,
  pub is_keepalive_required: bool,

  pub is_from_premium_user: bool,
  pub is_from_api_user: bool,
  pub is_for_twitch: bool,

  /// (This doesn't always have a meaning for all inference workloads)
  /// Zero is implied to be the default value (12 seconds)
  /// Negative is interpreted as "unlimited"
  /// NB: We can't technically control the seconds, but rather the model's "max_decoder_steps".
  /// We attempt to turn this into an appropriate "max_decoder_steps" value downstream of here.
  pub max_duration_seconds: i32,

  // Development / debug info
  pub is_debug_request: bool,
  pub maybe_routing_tag: Option<String>,

  pub created_at: chrono::DateTime<Utc>,
  pub updated_at: chrono::DateTime<Utc>,
  pub retry_at: Option<chrono::DateTime<Utc>>,

  /// "Keep alive" signals may have a race condition where Redis doesn't set the timestamp
  /// in time. If so, we'll compare `created_at` versus `now` with some reasonable delta
  /// (perhaps 30 sec).
  pub database_clock: chrono::DateTime<Utc>,
}

pub struct ListAvailableGenericInferenceJobArgs<'a> {
  pub num_records: u32,
  pub is_debug_worker: bool,
  pub sort_by_priority: bool,
  pub maybe_scope_by_model_type: Option<&'a BTreeSet<InferenceModelType>>,
  pub maybe_scope_by_job_category: Option<&'a BTreeSet<InferenceCategory>>,
  pub mysql_pool: &'a MySqlPool,
}

pub async fn list_available_generic_inference_jobs(
  args: ListAvailableGenericInferenceJobArgs<'_>,
)
  -> AnyhowResult<Vec<AvailableInferenceJob>>
{
  let model_types = args.maybe_scope_by_model_type
      .map(|types| types.clone())
      .unwrap_or(InferenceModelType::all_variants()); // NB: All model types

  let inference_categories = args.maybe_scope_by_job_category
        .map(|types| types.clone())
        .unwrap_or(InferenceCategory::all_variants()); // NB: All categories

  let query = if args.sort_by_priority {
    list_sorted_by_priority(args, model_types, inference_categories).await
  } else {
    list_sorted_by_id(args, model_types, inference_categories).await
  };

  let job_records = query?;

  let job_records : Vec<AvailableInferenceJob> = job_records.into_iter()
      .map(|record : AvailableInferenceJobRawInternal| {
        let record = AvailableInferenceJob {
          id: GenericInferenceJobId(record.id),
          inference_job_token: InferenceJobToken::new(record.inference_job_token),
          uuid_idempotency_token: record.uuid_idempotency_token,
          creator_ip_address: record.creator_ip_address,
          maybe_creator_user_token: record.maybe_creator_user_token,
          maybe_creator_anonymous_visitor_token: record.maybe_creator_anonymous_visitor_token,
          creator_set_visibility: Visibility::from_str(&record.creator_set_visibility)
              .map_err(|e| anyhow!("error: {:?}", e))?, // TODO/FIXME: This is a gross fix.
          inference_category: InferenceCategory::from_str(&record.inference_category)
              .map_err(|e| anyhow!("error: {:?}", e))?, // TODO/FIXME: This is a gross fix.
          maybe_model_type: record.maybe_model_type
              .as_deref()
              .map(|model_type| InferenceModelType::from_str(model_type))
              .transpose()
              .map_err(|e| anyhow!("error: {:?}", e))?, // TODO/FIXME: This is a gross fix.
          maybe_model_token: record.maybe_model_token,
          maybe_input_source_token: record.maybe_input_source_token,
          maybe_input_source_token_type: record.maybe_input_source_token_type,
          maybe_inference_args: record.maybe_inference_args
              .as_deref()
              .map(|args| GenericInferenceArgs::from_json(args))
              .transpose()?,
          maybe_raw_inference_text: record.maybe_raw_inference_text,
          status: JobStatusPlus::from_str(&record.status)
              .map_err(|err| anyhow!("JobStatus failure to parse: {:?}", err))?,
          attempt_count: record.attempt_count,
          priority_level: record.priority_level,
          is_keepalive_required: i8_to_bool(record.is_keepalive_required),
          is_from_premium_user: i8_to_bool(record.is_from_premium_user),
          is_from_api_user: i8_to_bool(record.is_from_api_user),
          is_for_twitch: i8_to_bool(record.is_for_twitch),
          max_duration_seconds: record.max_duration_seconds,
          is_debug_request: i8_to_bool(record.is_debug_request),
          maybe_routing_tag: record.maybe_routing_tag,
          created_at: record.created_at,
          updated_at: record.updated_at,
          retry_at: record.retry_at,
          database_clock: record.database_clock,
        };
        Ok(record)
      })
      // NB: Magic Vec<Result> -> Result<Vec<>>
      // https://stackoverflow.com/a/63798748
      .into_iter()
      .collect::<Result<Vec<AvailableInferenceJob>, anyhow::Error>>()?;

  Ok(job_records)
}

async fn list_sorted_by_id(args: ListAvailableGenericInferenceJobArgs<'_>, model_types: BTreeSet<InferenceModelType>, inference_categories: BTreeSet<InferenceCategory>) -> Result<Vec<AvailableInferenceJobRawInternal>, sqlx::Error> {
  // NB: Can't be type checked because of WHERE IN clause with dynamic contents

  // Also had to remove the following typing:
  //id as `id: crate::queries::generic_inference::job::_keys::GenericInferenceJobId`,
  //token AS `inference_job_token: tokens::jobs::inference::InferenceJobToken`,
  //inference_type as `inference_type: enums::workers::generic_inference_type::GenericInferenceType`,
  //creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,
  //status as `status: crate::column_types::job_status::JobStatus`,

  let mut query = r#"
SELECT
  id,
  token as inference_job_token,
  uuid_idempotency_token,

  inference_category,
  maybe_model_type,
  maybe_model_token,

  maybe_input_source_token,
  maybe_input_source_token_type,

  maybe_inference_args,
  maybe_raw_inference_text,

  maybe_creator_user_token,
  maybe_creator_anonymous_visitor_token,
  creator_ip_address,
  creator_set_visibility,

  status,
  attempt_count,

  priority_level,
  is_keepalive_required,

  is_from_premium_user,
  is_from_api_user,
  is_for_twitch,

  max_duration_seconds,

  is_debug_request,
  maybe_routing_tag,

  created_at,
  updated_at,
  retry_at,
  NOW() as database_clock

FROM generic_inference_jobs"#.to_string();

  query.push_str(&format!(r#"
    WHERE
    (
      maybe_model_type IN ({})
    )
  "#, model_type_predicate(&model_types)));

  query.push_str(&format!(r#"
    and
    (
      inference_category IN ({})
    )
  "#, inference_category_predicate(&inference_categories)));

  query.push_str(r#"
  AND
  (
    status IN ("pending", "attempt_failed")
  )
  AND
  (
    retry_at IS NULL
    OR
    retry_at < CURRENT_TIMESTAMP
  )
  AND
  (
    is_debug_request = ?
  )
  ORDER BY id ASC
  LIMIT ?
        "#);

  let query = sqlx::query_as::<_, AvailableInferenceJobRawInternal>(&query)
      .bind(args.is_debug_worker)
      .bind(args.num_records);

  query.fetch_all(args.mysql_pool)
      .await
}

async fn list_sorted_by_priority(args: ListAvailableGenericInferenceJobArgs<'_>, model_types: BTreeSet<InferenceModelType>, inference_categories: BTreeSet<InferenceCategory>) -> Result<Vec<AvailableInferenceJobRawInternal>, sqlx::Error> {
  // NB: Can't be type checked because of WHERE IN clause with dynamic contents

  // Also had to remove the following typing:
  //id as `id: crate::queries::generic_inference::job::_keys::GenericInferenceJobId`,
  //token AS `inference_job_token: tokens::jobs::inference::InferenceJobToken`,
  //inference_category as `inference_category: enums::workers::generic_inference_type::GenericInferenceType`,
  //creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,
  //status as `status: crate::column_types::job_status::JobStatus`,

  let mut query = r#"
SELECT
  id,
  token as inference_job_token,
  uuid_idempotency_token,

  inference_category,
  maybe_model_type,
  maybe_model_token,

  maybe_input_source_token,
  maybe_input_source_token_type,

  maybe_inference_args,
  maybe_raw_inference_text,

  maybe_creator_user_token,
  maybe_creator_anonymous_visitor_token,
  creator_ip_address,
  creator_set_visibility,

  status,
  attempt_count,

  priority_level,
  is_keepalive_required,

  is_from_premium_user,
  is_from_api_user,
  is_for_twitch,

  max_duration_seconds,

  is_debug_request,
  maybe_routing_tag,

  created_at,
  updated_at,
  retry_at,
  NOW() as database_clock

FROM generic_inference_jobs"#.to_string();

  query.push_str(&format!(r#"
    WHERE
    (
      maybe_model_type IN ({})
    )
  "#, model_type_predicate(&model_types)));

  query.push_str(&format!(r#"
    and
    (
      inference_category IN ({})
    )
  "#, inference_category_predicate(&inference_categories)));

  query.push_str(r#"
  AND
  (
    status IN ("pending", "attempt_failed")
  )
  AND
  (
    retry_at IS NULL
    OR
    retry_at < CURRENT_TIMESTAMP
  )
  AND
  (
    is_debug_request = ?
  )
  ORDER BY priority_level DESC, id ASC
  LIMIT ?
        "#);

  let query = sqlx::query_as::<_, AvailableInferenceJobRawInternal>(&query)
      .bind(args.is_debug_worker)
      .bind(args.num_records);

  query.fetch_all(args.mysql_pool)
      .await
}

#[derive(Debug)]
#[derive(sqlx::FromRow)]
struct AvailableInferenceJobRawInternal {
  //pub id: GenericInferenceJobId,
  pub id: i64,
  //pub inference_job_token: InferenceJobToken,
  pub inference_job_token: String,
  pub uuid_idempotency_token: String,

  // Inference information
  //pub inference_category: InferenceCategory,
  pub inference_category: String,

  pub maybe_model_type: Option<String>,
  pub maybe_model_token: Option<String>,

  pub maybe_input_source_token: Option<String>,
  pub maybe_input_source_token_type: Option<String>,

  pub maybe_inference_args: Option<String>,
  pub maybe_raw_inference_text: Option<String>,

  // User information to propagate downstream
  pub maybe_creator_user_token: Option<String>,
  pub maybe_creator_anonymous_visitor_token: Option<String>,
  pub creator_ip_address: String,
  //pub creator_set_visibility: Visibility,
  pub creator_set_visibility: String,

  // Job information
  //pub status: JobStatus,
  pub status: String,
  pub attempt_count: u16,

  pub priority_level: u16,
  pub is_keepalive_required: i8,

  pub is_from_premium_user: i8,
  pub is_from_api_user: i8,
  pub is_for_twitch: i8,

  pub max_duration_seconds: i32,

  // Development / debug info
  pub is_debug_request: i8,
  pub maybe_routing_tag: Option<String>,

  pub created_at: chrono::DateTime<Utc>,
  pub updated_at: chrono::DateTime<Utc>,
  pub retry_at: Option<chrono::DateTime<Utc>>,

  pub database_clock: chrono::DateTime<Utc>,
}

/// Return a comma-separated predicate, since SQLx does not yet support WHERE IN(?) for Vec<T>, etc.
/// Issue: https://github.com/launchbadge/sqlx/issues/875
fn model_type_predicate(types: &BTreeSet<InferenceModelType>) -> String {
  let mut vec = types.iter()
      .map(|ty| ty.to_str())
      .map(|ty| format!("\"{}\"", ty))
      .collect::<Vec<String>>();
  vec.sort(); // NB: For the benefit of tests.
  vec.join(", ")
}

/// Return a comma-separated predicate, since SQLx does not yet support WHERE IN(?) for Vec<T>, etc.
/// Issue: https://github.com/launchbadge/sqlx/issues/875
fn inference_category_predicate(categories: &BTreeSet<InferenceCategory>) -> String {
  let mut vec = categories.iter()
      .map(|ty| ty.to_str())
      .map(|ty| format!("\"{}\"", ty))
      .collect::<Vec<String>>();
  vec.sort(); // NB: For the benefit of tests.
  vec.join(", ")
}

#[cfg(test)]
mod tests {
  use std::collections::BTreeSet;

  use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
  use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;

  use crate::queries::generic_inference::job::list_available_generic_inference_jobs::{inference_category_predicate, model_type_predicate};

  #[test]
  fn test_model_type_predicate() {
    // None
    let types = BTreeSet::from([]);
    assert_eq!(model_type_predicate(&types), "".to_string());

    // One
    let types = BTreeSet::from([
      InferenceModelType::RvcV2,
    ]);

    assert_eq!(model_type_predicate(&types), "\"rvc_v2\"".to_string());

    // Multiple
    let types = BTreeSet::from([
      InferenceModelType::RvcV2,
      InferenceModelType::SoVitsSvc,
    ]);
    assert_eq!(model_type_predicate(&types), "\"rvc_v2\", \"so_vits_svc\"".to_string());
  }

  #[test]
  fn test_inference_category_predicate() {
    // None
    let types = BTreeSet::from([]);
    assert_eq!(inference_category_predicate(&types), "".to_string());

    // Some
    let types = BTreeSet::from([
      InferenceCategory::VoiceConversion,
    ]);

    assert_eq!(inference_category_predicate(&types), "\"voice_conversion\"".to_string());
    // All
    let types = BTreeSet::from([
      InferenceCategory::TextToSpeech,
      InferenceCategory::VoiceConversion,
    ]);
    assert_eq!(inference_category_predicate(&types), "\"text_to_speech\", \"voice_conversion\"".to_string());
  }
}
