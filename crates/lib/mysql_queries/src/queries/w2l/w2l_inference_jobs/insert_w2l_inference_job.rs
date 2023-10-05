use anyhow::anyhow;
use log::error;
use sqlx::error::Error::Database;
use sqlx::MySqlPool;

use errors::AnyhowResult;

// FIXME: NB: This is an old query that was somewhat modernized when moved.
//  All the same, do not copy this example!

pub struct InsertW2lInferenceJobArgs<'a> {
  pub w2l_template_token: &'a str,
  pub tts_inference_result_token: &'a str,
  pub maybe_user_token: Option<&'a str>,
  pub ip_address: &'a str,
  //pub creator_set_visibility: Visibility,
  pub creator_set_visibility: &'a str,
  pub mysql_pool: &'a MySqlPool,
}

pub async fn insert_w2l_inference_job(args: InsertW2lInferenceJobArgs<'_>) -> AnyhowResult<()> {
  let query_result = sqlx::query!(
        r#"
INSERT INTO w2l_inference_jobs
SET
  maybe_w2l_template_token = ?,
  maybe_tts_inference_result_token = ?,
  maybe_public_audio_bucket_location = NULL,
  maybe_public_image_bucket_location = NULL,
  maybe_creator_user_token = ?,
  creator_ip_address = ?,
  creator_set_visibility = ?,
  status = "pending"
        "#,
      args.w2l_template_token,
      args.tts_inference_result_token,
      args.maybe_user_token,
      args.ip_address,
      args.creator_set_visibility
    )
      .execute(args.mysql_pool)
      .await;

  let _record_id = match query_result {
    Ok(res) => {
      res.last_insert_id()
    },
    Err(err) => {
      error!("New w2l inference job creation DB error: {:?}", err);

      // NB: SQLSTATE[23000]: Integrity constraint violation
      // NB: MySQL Error Code 1062: Duplicate key insertion (this is harder to access)
      match err {
        Database(ref err) => {
          let _maybe_code = err.code().map(|c| c.into_owned());
          /*match maybe_code.as_deref() {
            Some("23000") => {
              if err.message().contains("username") {
                return Err(UsernameTaken);
              } else if err.message().contains("email_address") {
                return Err(EmailTaken);
              }
            }
            _ => {},
          }*/
        },
        _ => {},
      }
      return Err(anyhow!("error with query: {:?}", &err));
    }
  };

  Ok(())
}
