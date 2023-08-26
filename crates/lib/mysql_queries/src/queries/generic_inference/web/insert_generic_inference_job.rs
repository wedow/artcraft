use anyhow::anyhow;
use crate::payloads::generic_inference_args::generic_inference_args::GenericInferenceArgs;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_input_source_token_type::InferenceInputSourceTokenType;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use sqlx::MySqlPool;
use tokens::jobs::inference::InferenceJobToken;
use tokens::users::user::UserToken;

pub struct InsertGenericInferenceArgs<'a> {
  pub uuid_idempotency_token: &'a str,

  pub inference_category: InferenceCategory,
  pub maybe_model_type: Option<InferenceModelType>,
  pub maybe_model_token: Option<&'a str>,

  pub maybe_input_source_token: Option<&'a str>,
  pub maybe_input_source_token_type: Option<InferenceInputSourceTokenType>,

  pub maybe_raw_inference_text: Option<&'a str>,

  pub maybe_inference_args: Option<GenericInferenceArgs>,

  pub maybe_creator_user_token: Option<&'a UserToken>,
  pub creator_ip_address: &'a str,
  pub creator_set_visibility: Visibility,

  pub priority_level: u8,
  pub requires_keepalive: bool,

  pub is_debug_request: bool,
  pub maybe_routing_tag: Option<&'a str>,

  pub mysql_pool: &'a MySqlPool,
}

pub async fn insert_generic_inference_job(args: InsertGenericInferenceArgs<'_>) -> AnyhowResult<(InferenceJobToken, u64)> {
  let job_token = InferenceJobToken::generate();

  let serialized_args_payload = serde_json::ser::to_string(&args.maybe_inference_args)
      .map_err(|_e| anyhow!("could not encode inference args"))?;

  // The routing tag column is VARCHAR(32), so we should truncate.
  let maybe_routing_tag = args.maybe_routing_tag
      .map(|routing_tag| {
        let mut routing_tag = routing_tag.trim().to_string();
        routing_tag.truncate(32);
        routing_tag
      });

  let query = sqlx::query!(
        r#"
INSERT INTO generic_inference_jobs
SET
  token = ?,
  uuid_idempotency_token = ?,

  inference_category = ?,
  maybe_model_type = ?,
  maybe_model_token = ?,

  maybe_input_source_token = ?,
  maybe_input_source_token_type = ?,

  maybe_raw_inference_text = ?,

  maybe_inference_args = ?,

  maybe_creator_user_token = ?,
  creator_ip_address = ?,
  creator_set_visibility = ?,

  priority_level = ?,
  is_keepalive_required = ?,

  is_debug_request = ?,
  maybe_routing_tag = ?,

  status = "pending"
        "#,
        job_token.as_str(),
        args.uuid_idempotency_token,

        args.inference_category.to_str(),

        args.maybe_model_type.map(|t| t.to_str()),
        args.maybe_model_token,

        args.maybe_input_source_token,
        args.maybe_input_source_token_type,

        args.maybe_raw_inference_text,

        serialized_args_payload,

        args.maybe_creator_user_token.map(|t| t.to_string()),
        args.creator_ip_address,
        args.creator_set_visibility.to_str(),

        args.priority_level,
        args.requires_keepalive,

        args.is_debug_request,
        maybe_routing_tag,
    );

  let query_result = query.execute(args.mysql_pool)
      .await;

  let record_id = match query_result {
    Ok(res) => {
      res.last_insert_id()
    },
    Err(err) => {
      return Err(anyhow!("error inserting new generic inference job: {:?}", err));
    }
  };

  Ok((job_token, record_id))
}
