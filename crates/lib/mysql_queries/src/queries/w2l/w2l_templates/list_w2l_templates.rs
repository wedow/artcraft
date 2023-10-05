use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::{info, warn};
use sqlx::MySqlPool;

use errors::AnyhowResult;

use crate::helpers::boolean_converters::nullable_i8_to_optional_bool;

// FIXME: This is the old style of query scoping and shouldn't be copied.

#[derive(Serialize, Clone)]
pub struct W2lTemplateRecordForList {
  pub template_token: String,
  pub template_type: String,
  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub title: String,
  pub frame_width: u32,
  pub frame_height: u32,
  pub duration_millis: u32,
  pub maybe_image_object_name: Option<String>,
  pub maybe_video_object_name: Option<String>,
  pub is_public_listing_approved: Option<bool>, // converted
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

struct RawW2lTemplateRecordForList {
  pub template_token: String,
  pub template_type: String,
  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub title: String,
  pub frame_width: i32,
  pub frame_height: i32,
  pub duration_millis: i32,
  pub maybe_public_bucket_preview_image_object_name: Option<String>,
  pub maybe_public_bucket_preview_video_object_name: Option<String>,
  pub is_public_listing_approved: Option<i8>, // NB: needs conversion
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

pub async fn list_w2l_templates(
  mysql_pool: &MySqlPool,
  scope_creator_username: Option<&str>,
  require_mod_approved: bool
) -> AnyhowResult<Vec<W2lTemplateRecordForList>> {

  let maybe_templates = match scope_creator_username {
    Some(username) => {
      list_w2l_templates_creator_scoped(mysql_pool, username, require_mod_approved)
        .await
    },
    None => {
      list_w2l_templates_for_all_creators(mysql_pool, require_mod_approved)
        .await
    },
  };

  let templates : Vec<RawW2lTemplateRecordForList> = match maybe_templates {
    Ok(templates) => {
      info!("Template length: {}", templates.len());
      templates
    },
    Err(err) => {
      warn!("Error: {:?}", err);

      match err {
        _RowNotFound => {
          return Ok(Vec::new());
        },
        _ => {
          warn!("w2l template list query error: {:?}", err);
          return Err(anyhow!("w2l template list query error"));
        }
      }
    }
  };

  Ok(templates.into_iter()
    .map(|template| {
      W2lTemplateRecordForList {
        template_token: template.template_token,
        template_type: template.template_type,
        creator_user_token: template.creator_user_token,
        creator_username: template.creator_username,
        creator_display_name: template.creator_display_name,
        title: template.title,
        frame_width: if template.frame_width > 0 { template.frame_width as u32 } else { 0 },
        frame_height: if template.frame_height  > 0 { template.frame_height as u32 } else { 0 },
        duration_millis: if template.duration_millis > 0 { template.duration_millis as u32 } else { 0 },
        maybe_image_object_name: template.maybe_public_bucket_preview_image_object_name,
        maybe_video_object_name: template.maybe_public_bucket_preview_video_object_name,
        is_public_listing_approved: nullable_i8_to_optional_bool(template.is_public_listing_approved),
        created_at: template.created_at,
        updated_at: template.updated_at,
      }
    })
    .collect::<Vec<W2lTemplateRecordForList>>())
}

async fn list_w2l_templates_for_all_creators(
  mysql_pool: &MySqlPool,
  require_mod_approved: bool
) -> AnyhowResult<Vec<RawW2lTemplateRecordForList>> {
  // TODO: There has to be a better way.
  //  Sqlx doesn't like anything except string literals.
  let maybe_templates = if require_mod_approved {
    info!("listing w2l templates for everyone; mod-approved only");
    sqlx::query_as!(
      RawW2lTemplateRecordForList,
        r#"
SELECT
    w2l.token as template_token,
    w2l.template_type,
    w2l.creator_user_token,
    users.username as creator_username,
    users.display_name as creator_display_name,
    w2l.title,
    w2l.frame_width,
    w2l.frame_height,
    w2l.duration_millis,
    w2l.maybe_public_bucket_preview_image_object_name,
    w2l.maybe_public_bucket_preview_video_object_name,
    w2l.is_public_listing_approved,
    w2l.created_at,
    w2l.updated_at
FROM w2l_templates as w2l
JOIN users
    ON users.token = w2l.creator_user_token
WHERE
    w2l.is_public_listing_approved IS TRUE
    AND w2l.user_deleted_at IS NULL
    AND w2l.mod_deleted_at IS NULL
        "#)
      .fetch_all(mysql_pool)
      .await?
  } else {
    info!("listing w2l templates for everyone; all");
    sqlx::query_as!(
      RawW2lTemplateRecordForList,
        r#"
SELECT
    w2l.token as template_token,
    w2l.template_type,
    w2l.creator_user_token,
    users.username as creator_username,
    users.display_name as creator_display_name,
    w2l.title,
    w2l.frame_width,
    w2l.frame_height,
    w2l.duration_millis,
    w2l.maybe_public_bucket_preview_image_object_name,
    w2l.maybe_public_bucket_preview_video_object_name,
    w2l.is_public_listing_approved,
    w2l.created_at,
    w2l.updated_at
FROM w2l_templates as w2l
JOIN users
    ON users.token = w2l.creator_user_token
WHERE
    w2l.user_deleted_at IS NULL
    AND w2l.mod_deleted_at IS NULL
        "#)
      .fetch_all(mysql_pool)
      .await?
  };

  Ok(maybe_templates)
}

async fn list_w2l_templates_creator_scoped(
  mysql_pool: &MySqlPool,
  scope_creator_username: &str,
  require_mod_approved: bool
) -> AnyhowResult<Vec<RawW2lTemplateRecordForList>> {
  // TODO: There has to be a better way.
  //  Sqlx doesn't like anything except string literals.
  let maybe_templates = if require_mod_approved {
    info!("listing w2l templates for user; mod-approved only");
    sqlx::query_as!(
      RawW2lTemplateRecordForList,
        r#"
SELECT
    w2l.token as template_token,
    w2l.template_type,
    w2l.creator_user_token,
    users.username as creator_username,
    users.display_name as creator_display_name,
    w2l.title,
    w2l.frame_width,
    w2l.frame_height,
    w2l.duration_millis,
    w2l.maybe_public_bucket_preview_image_object_name,
    w2l.maybe_public_bucket_preview_video_object_name,
    w2l.is_public_listing_approved,
    w2l.created_at,
    w2l.updated_at
FROM w2l_templates as w2l
JOIN users
ON
    users.token = w2l.creator_user_token
WHERE
    users.username = ?
    AND w2l.is_public_listing_approved IS TRUE
    AND w2l.user_deleted_at IS NULL
    AND w2l.mod_deleted_at IS NULL
        "#,
      scope_creator_username)
      .fetch_all(mysql_pool)
      .await?
  } else {
    info!("listing w2l templates for user; all");
    sqlx::query_as!(
      RawW2lTemplateRecordForList,
        r#"
SELECT
    w2l.token as template_token,
    w2l.template_type,
    w2l.creator_user_token,
    users.username as creator_username,
    users.display_name as creator_display_name,
    w2l.title,
    w2l.frame_width,
    w2l.frame_height,
    w2l.duration_millis,
    w2l.maybe_public_bucket_preview_image_object_name,
    w2l.maybe_public_bucket_preview_video_object_name,
    w2l.is_public_listing_approved,
    w2l.created_at,
    w2l.updated_at
FROM w2l_templates as w2l
JOIN users
ON
    users.token = w2l.creator_user_token
WHERE
    users.username = ?
    AND w2l.user_deleted_at IS NULL
    AND w2l.mod_deleted_at IS NULL
        "#,
      scope_creator_username)
      .fetch_all(mysql_pool)
      .await?
  };

  Ok(maybe_templates)
}
