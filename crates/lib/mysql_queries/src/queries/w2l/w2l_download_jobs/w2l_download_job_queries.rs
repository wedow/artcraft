//! NB: This seems required for sqlx to generate the cached queries.
//! Sqlx's prepare needs a *single* binary to work against, so we need to
//! include these in the main binary to generate all the queries.

use anyhow::anyhow;
use chrono::Utc;
use sqlx::MySqlPool;

use errors::AnyhowResult;

use crate::tokens::Tokens;

// TODO(2022-08-04): These were moved into the 'mysql_queries' crate, but they need
//  to be split up into several modules for better maintainability. cf the already moved
//  `tts_inference_job` queries.

/// table: w2l_template_upload_jobs
#[derive(Debug)]
pub struct W2lTemplateUploadJobRecord {
  pub id: i64,
  pub token: String,
  pub uuid_idempotency_token: String,
  pub on_success_result_token: Option<String>,
  pub creator_user_token: String,
  pub creator_ip_address: String,
  pub creator_set_visibility: String, // TODO
  pub title: String,
  pub template_type: String, // TODO
  pub download_url: Option<String>,
  pub status: String, // TODO
  pub attempt_count: i32,
  pub failure_reason: Option<String>,
  pub created_at: chrono::DateTime<Utc>,
  pub updated_at: chrono::DateTime<Utc>,
  pub retry_at: Option<chrono::DateTime<Utc>>,
}

pub async fn query_w2l_template_upload_job_records(pool: &MySqlPool, num_records: u32)
  -> AnyhowResult<Vec<W2lTemplateUploadJobRecord>>
{
  let job_records = sqlx::query_as!(
      W2lTemplateUploadJobRecord,
        r#"
SELECT *
FROM w2l_template_upload_jobs
WHERE
  (
    status IN ("pending", "attempt_failed")
  )
  AND
  (
    retry_at IS NULL
    OR
    retry_at < CURRENT_TIMESTAMP
  )
  LIMIT ?
        "#,
      num_records,
    )
    .fetch_all(pool)
    .await?;

  Ok(job_records)
}

pub struct W2lDownloadLockRecord {
  id: i64,
  status: String,
}

pub async fn grab_job_lock_and_mark_pending(
  pool: &MySqlPool,
  job: &W2lTemplateUploadJobRecord
) -> AnyhowResult<bool> {

  // NB: We use transactions and "SELECT ... FOR UPDATE" to simulate mutexes.
  let mut transaction = pool.begin().await?;

  let maybe_record = sqlx::query_as!(
    W2lDownloadLockRecord,
        r#"
SELECT
  id,
  status
FROM w2l_template_upload_jobs
WHERE id = ?
FOR UPDATE
        "#,
        job.id,
    )
      .fetch_one(&mut transaction)
      .await;

  let record : W2lDownloadLockRecord = match maybe_record {
    Ok(record) => record,
    Err(err) => {
      match err {
        sqlx::Error::RowNotFound => {
          return Err(anyhow!("could not job"));
        },
        _ => {
          return Err(anyhow!("query error"));
        }
      }
    }
  };

  let can_transact = match record.status.as_ref() {
    "pending" => true, // It's okay for us to take the lock.
    "attempt_failed" => true, // We can retry.
    "started" => false, // Job in progress (another job beat us, and we can't take the lock)
    "complete_success" => false, // Job already complete
    "complete_failure" => false, // Job already complete (permanently dead; no need to retry)
    "dead" => false, // Job already complete (permanently dead; retries exhausted)
    _ => false, // Future-proof
  };

  if !can_transact {
    transaction.rollback().await?;
    return Ok(false);
  }

  let _acquire_lock = sqlx::query!(
        r#"
UPDATE w2l_template_upload_jobs
SET
  status = 'started',
  attempt_count = attempt_count + 1,
  retry_at = NOW() + interval 2 minute
WHERE id = ?
        "#,
        job.id,
    )
      .execute(&mut transaction)
      .await?;

  transaction.commit().await?;

  Ok(true)
}

pub async fn mark_w2l_template_upload_job_failure(
  pool: &MySqlPool,
  job: &W2lTemplateUploadJobRecord,
  failure_reason: &str,
  max_attempts: i32
) -> AnyhowResult<()> {

  // statuses: "attempt_failed", "complete_failure", "dead"
  let mut next_status = "attempt_failed";

  if job.attempt_count >= max_attempts {
    // NB: Job attempt count is incremented at start
    next_status = "dead";
  }

  let _query_result = sqlx::query!(
        r#"
UPDATE w2l_template_upload_jobs
SET
  status = ?,
  failure_reason = ?,
  retry_at = NOW() + interval 2 minute
WHERE id = ?
        "#,
        next_status,
        failure_reason.to_string(),
        job.id,
    )
    .execute(pool)
    .await?;

  Ok(())
}

pub async fn mark_w2l_template_upload_job_permanently_dead(
  pool: &MySqlPool,
  job: &W2lTemplateUploadJobRecord,
  failure_reason: &str,
) -> AnyhowResult<()> {
  let _query_result = sqlx::query!(
        r#"
UPDATE w2l_template_upload_jobs
SET
  status = "dead",
  failure_reason = ?,
  retry_at = NULL
WHERE id = ?
        "#,
        failure_reason.to_string(),
        job.id,
    )
      .execute(pool)
      .await?;

  Ok(())
}

pub async fn mark_w2l_template_upload_job_done(
  pool: &MySqlPool,
  job: &W2lTemplateUploadJobRecord,
  success: bool,
  maybe_model_token: Option<&str>
) -> AnyhowResult<()>
{
  let status = if success { "complete_success" } else { "complete_failure" };

  let _query_result = sqlx::query!(
        r#"
UPDATE w2l_template_upload_jobs
SET
  status = ?,
  on_success_result_token = ?,
  failure_reason = NULL,
  retry_at = NULL
WHERE id = ?
        "#,
        status,
        maybe_model_token,
        job.id,
    )
    .execute(pool)
    .await?;

  Ok(())
}

pub async fn insert_w2l_template(
  pool: &MySqlPool,
  template_type: &str, // TODO: ENUM!
  job: &W2lTemplateUploadJobRecord,
  private_bucket_hash: &str,
  private_bucket_object_name: &str,
  private_bucket_cached_faces_object_name: &str,
  maybe_image_preview_object_name: Option<&str>,
  maybe_video_preview_object_name: Option<&str>,
  file_size_bytes: u64,
  maybe_mime_type: Option<&str>,
  frame_width: u32,
  frame_height: u32,
  frame_count: u64,
  fps: f32,
  duration_millis: u64
) -> AnyhowResult<(u64, String)> {

  let model_token = Tokens::new_w2l_template()?;

  let query_result = sqlx::query!(
        r#"
INSERT INTO w2l_templates
SET
  token = ?,
  template_type = ?,
  title = ?,
  description_markdown = '',
  description_rendered_html = '',
  creator_user_token = ?,
  creator_ip_address_creation = ?,
  creator_ip_address_last_update = ?,
  original_download_url = ?,
  private_bucket_hash = ?,
  private_bucket_object_name = ?,
  private_bucket_cached_faces_object_name = ?,
  maybe_public_bucket_preview_image_object_name = ?,
  maybe_public_bucket_preview_video_object_name = ?,
  file_size_bytes = ?,
  mime_type = ?,
  frame_width = ?,
  frame_height = ?,
  frame_count = ?,
  fps = ?,
  duration_millis = ?
        "#,
      model_token,
      template_type,
      job.title.to_string(),
      job.creator_user_token.clone(),
      job.creator_ip_address.clone(),
      job.creator_ip_address.clone(),
      job.download_url.clone(),
      private_bucket_hash.to_string(),
      private_bucket_object_name.to_string(),
      private_bucket_cached_faces_object_name.to_string(),
      maybe_image_preview_object_name,
      maybe_video_preview_object_name,
      file_size_bytes,
      maybe_mime_type.unwrap_or(""),
      frame_width,
      frame_height,
      frame_count,
      fps,
      duration_millis
    )
    .execute(pool)
    .await;

  let record_id = match query_result {
    Ok(res) => {
      res.last_insert_id()
    },
    Err(err) => {
      // TODO: handle better
      return Err(anyhow!("Mysql error: {:?}", err));
    }
  };

  Ok((record_id, model_token.clone()))
}
