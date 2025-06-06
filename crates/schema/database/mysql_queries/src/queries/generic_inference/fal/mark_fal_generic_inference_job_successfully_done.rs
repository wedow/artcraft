use anyhow::anyhow;
use sqlx::MySqlPool;

use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use enums::common::job_status_plus::JobStatusPlus;
use errors::AnyhowResult;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;

// TODO: Maybe in the future we set a batch_token instead of media token

pub async fn mark_fal_generic_inference_job_successfully_done(
  pool: &MySqlPool,
  job_token: &InferenceJobToken,
  media_file_token: MediaFileToken,
) -> AnyhowResult<()>
{
  const STATUS : JobStatusPlus = JobStatusPlus::CompleteSuccess;
  const RESULT_TYPE : InferenceResultType = InferenceResultType::MediaFile;

  let query_result = sqlx::query!(
        r#"
UPDATE generic_inference_jobs
SET
  status = ?,
  on_success_result_entity_type = ?,
  on_success_result_entity_token = ?,
  failure_reason = NULL,
  internal_debugging_failure_reason = NULL,
  success_execution_millis = NULL,
  success_inference_execution_millis = NULL,
  retry_at = NULL,
  successfully_completed_at = NOW()
WHERE token = ?
        "#,
        STATUS.to_str(),
        RESULT_TYPE.to_str(),
        media_file_token,
        job_token,
    )
      .execute(pool)
      .await;

  match query_result {
    Err(err) => Err(anyhow!("error with query: {:?}", err)),
    Ok(_r) => Ok(()),
  }
}
