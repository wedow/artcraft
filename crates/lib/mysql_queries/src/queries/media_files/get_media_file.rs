// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use anyhow::anyhow;
use chrono::{DateTime, Utc};
use sqlx::MySqlPool;

use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

#[derive(Serialize, Debug)]
pub struct MediaFile {
  pub token: MediaFileToken,

  pub media_type: MediaFileType,

  // TODO: Bucket hash bits.

  // TODO: Other media details (file size, mime type, dimensions, duration, etc.)
  // TODO: Provenance data (product, upload vs inference, model details and foreign keys)

  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,
  pub maybe_creator_gravatar_hash: Option<String>,

  pub creator_set_visibility: Visibility,

  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  // pub maybe_moderator_fields: Option<MediaFileModeratorFields>,
}

// /// "Moderator-only fields" that we wouldn't want to expose to ordinary users.
// /// It's the web endpoint controller's responsibility to clear these for non-mods.
// #[derive(Serialize)]
// pub struct MediaFileModeratorFields {
//   pub model_creator_is_banned: bool,
//   pub result_creator_is_banned_if_user: bool,
//   pub result_creator_ip_address: String,
//   pub result_creator_deleted_at: Option<DateTime<Utc>>,
//   pub mod_deleted_at: Option<DateTime<Utc>>,
//   pub maybe_mod_user_token: Option<String>,
// }

#[derive(Serialize)]
pub struct MediaFileRaw {
  pub token: MediaFileToken,

  pub media_type: MediaFileType,

  // TODO: Bucket hash bits.

  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,
  pub maybe_creator_gravatar_hash: Option<String>,

  pub creator_set_visibility: Visibility,

  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,

  //pub model_is_mod_approved: bool, // converted
  //pub maybe_mod_user_token: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

pub async fn get_media_file(
  media_file_token: &MediaFileToken,
  can_see_deleted: bool,
  mysql_pool: &MySqlPool
) -> AnyhowResult<Option<MediaFile>> {

  let record = if can_see_deleted {
    select_including_deleted(media_file_token, mysql_pool).await
  } else {
    select_without_deleted(media_file_token, mysql_pool).await
  };

  let record = match record {
    Ok(record) => record,
    Err(ref err) => {
      return match err {
        sqlx::Error::RowNotFound => Ok(None),
        _ => Err(anyhow!("database error: {:?}", err)),
      }
    }
  };

  Ok(Some(MediaFile {
    token: record.token,
    media_type: record.media_type,
    maybe_creator_user_token: record.maybe_creator_user_token,
    maybe_creator_username: record.maybe_creator_username,
    maybe_creator_display_name: record.maybe_creator_display_name,
    maybe_creator_gravatar_hash: record.maybe_creator_gravatar_hash,
    creator_set_visibility: record.creator_set_visibility,
    public_bucket_directory_hash: record.public_bucket_directory_hash,
    maybe_public_bucket_prefix: record.maybe_public_bucket_prefix,
    maybe_public_bucket_extension: record.maybe_public_bucket_extension,
    created_at: record.created_at,
    updated_at: record.updated_at,
  }))
}

async fn select_including_deleted(
  media_file_token: &MediaFileToken,
  mysql_pool: &MySqlPool
) -> Result<MediaFileRaw, sqlx::Error> {
  sqlx::query_as!(
      MediaFileRaw,
        r#"
SELECT
    m.token as `token: tokens::tokens::media_files::MediaFileToken`,

    m.media_type as `media_type: enums::by_table::media_files::media_file_type::MediaFileType`,

    users.token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
    users.username as maybe_creator_username,
    users.display_name as maybe_creator_display_name,
    users.email_gravatar_hash as maybe_creator_gravatar_hash,

    m.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,

    m.public_bucket_directory_hash,
    m.maybe_public_bucket_prefix,
    m.maybe_public_bucket_extension,

    m.created_at,
    m.updated_at

FROM media_files AS m
LEFT OUTER JOIN users
    ON m.maybe_creator_user_token = users.token
WHERE
    m.token = ?
        "#,
      media_file_token
    )
    .fetch_one(mysql_pool)
    .await
}

async fn select_without_deleted(
  media_file_token: &MediaFileToken,
  mysql_pool: &MySqlPool
) -> Result<MediaFileRaw, sqlx::Error> {
  sqlx::query_as!(
      MediaFileRaw,
        r#"
SELECT
    m.token as `token: tokens::tokens::media_files::MediaFileToken`,

    m.media_type as `media_type: enums::by_table::media_files::media_file_type::MediaFileType`,

    users.token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
    users.username as maybe_creator_username,
    users.display_name as maybe_creator_display_name,
    users.email_gravatar_hash as maybe_creator_gravatar_hash,

    m.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,

    m.public_bucket_directory_hash,
    m.maybe_public_bucket_prefix,
    m.maybe_public_bucket_extension,

    m.created_at,
    m.updated_at

FROM media_files AS m
LEFT OUTER JOIN users
    ON m.maybe_creator_user_token = users.token
WHERE
    m.token = ?
    AND m.user_deleted_at IS NULL
    AND m.mod_deleted_at IS NULL
        "#,
      media_file_token
    )
    .fetch_one(mysql_pool)
    .await
}
