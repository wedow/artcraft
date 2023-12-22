use chrono::{DateTime, Utc};

use enums::by_table::user_bookmarks::user_bookmark_entity_type::UserBookmarkEntityType;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use tokens::tokens::user_bookmarks::UserBookmarkToken;
use tokens::tokens::users::UserToken;

pub struct UserBookmark {
  pub token: UserBookmarkToken,

  pub entity_type: UserBookmarkEntityType,
  pub entity_token: String,

  /// Something descriptive about the bookmarked entity.
  /// This might be TTS text, a username, etc. It depends on the entity type.
  pub maybe_entity_descriptive_text: Option<String>,

  pub user_token: UserToken,
  pub username: String,
  pub user_display_name: String,
  pub user_gravatar_hash: String,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub maybe_deleted_at: Option<DateTime<Utc>>,
}

pub struct RawUserBookmarkRecord {
  pub (crate) token: UserBookmarkToken,

  pub (crate) entity_type: UserBookmarkEntityType,
  pub (crate) entity_token: String,

  pub (crate) user_token: UserToken,
  pub (crate) username: String,
  pub (crate) user_display_name: String,
  pub (crate) user_gravatar_hash: String,

  pub (crate) created_at: DateTime<Utc>,
  pub (crate) updated_at: DateTime<Utc>,
  pub (crate) deleted_at: Option<DateTime<Utc>>,

  pub (crate) maybe_media_file_type: Option<MediaFileType>,
  pub (crate) maybe_media_file_origin_category: Option<MediaFileOriginCategory>,

  pub (crate) maybe_descriptive_text_model_weight_title: Option<String>,
  pub (crate) maybe_descriptive_text_tts_model_title: Option<String>,
  pub (crate) maybe_descriptive_text_tts_result_inference_text: Option<String>,
  pub (crate) maybe_descriptive_text_user_display_name: Option<String>,
  pub (crate) maybe_descriptive_text_voice_conversion_model_title: Option<String>,
  pub (crate) maybe_descriptive_text_zs_voice_title: Option<String>,
}

impl RawUserBookmarkRecord {
  pub fn into_public_type(self) -> UserBookmark {
    UserBookmark {
      token: self.token,
      entity_type: self.entity_type,
      entity_token: self.entity_token,
      maybe_entity_descriptive_text: match self.entity_type {
        UserBookmarkEntityType::User => self.maybe_descriptive_text_user_display_name,
        UserBookmarkEntityType::ModelWeight => self.maybe_descriptive_text_model_weight_title,
        UserBookmarkEntityType::TtsModel => self.maybe_descriptive_text_tts_model_title,
        UserBookmarkEntityType::TtsResult => self.maybe_descriptive_text_tts_result_inference_text,
        UserBookmarkEntityType::W2lTemplate => None,
        UserBookmarkEntityType::W2lResult => None,
        // TODO(bt,2023-11-21): Summary text needs to be better enriched.
        UserBookmarkEntityType::MediaFile => self.maybe_media_file_type
            .and_then(|media_file_type| match media_file_type {
              MediaFileType::Audio => Some("audio media file".to_string()),
              MediaFileType::Image => Some("image media file".to_string()),
              MediaFileType::Video => Some("video media file".to_string()),
            }),
        UserBookmarkEntityType::VoiceConversionModel => self.maybe_descriptive_text_voice_conversion_model_title,
        UserBookmarkEntityType::ZsVoice => self.maybe_descriptive_text_zs_voice_title,
      },
      user_token: self.user_token,
      username: self.username,
      user_display_name: self.user_display_name,
      user_gravatar_hash: self.user_gravatar_hash,
      created_at: self.created_at,
      updated_at: self.updated_at,
      maybe_deleted_at: self.deleted_at,
    }
  }
}
