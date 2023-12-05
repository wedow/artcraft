use tokens::tokens::media_files::MediaFileToken;


/// Everything we need to refer to a media_file on the public web interface.
#[derive(Clone, Serialize)]
pub struct MediaFileSocialMetaLight {
    /// The token for the media_file
    pub media_file_token: MediaFileToken,

    pub favorites_count: u64,
    pub comments_count: u64,
    pub signed_in_user_favorited: bool,
}

impl MediaFileSocialMetaLight {

    pub fn from_db_fields(
        media_file_token: &MediaFileToken,
        favorites_count: u64,
        comments_count: u64,
        signed_in_user_favorited: bool,
    ) -> Self {
        Self {
            media_file_token: media_file_token.clone(),
            favorites_count,
            comments_count,
            signed_in_user_favorited,
        }
    }

    pub fn from_optional_db_fields(
        maybe_media_file_token: Option<&MediaFileToken>,
        favorites_count: u64,
        comments_count: u64,
        signed_in_user_favorited: bool,
    ) -> Option<Self> {
        Self::from_optional_db_fields_owned(
            maybe_media_file_token.map(|u| u.clone()),
            favorites_count,
            comments_count,
            signed_in_user_favorited,
        )
    }

    pub fn from_optional_db_fields_owned(
        maybe_media_file_token: Option<MediaFileToken>,
        favorites_count: u64,
        comments_count: u64,
        signed_in_user_favorited: bool,
    ) -> Option<Self> {
        match (maybe_media_file_token) {
            (Some(media_file_token)) => {
                Some(Self {
                    media_file_token,
                    favorites_count,
                    comments_count,
                    signed_in_user_favorited,
                })
            }
            _ => {
                None
            }
        }
    }
}

#[derive(Clone, Serialize)]
pub struct DefaultAvatarInfo {
    pub image_index: u8,
    pub color_index: u8,
}


#[cfg(test)]
mod tests {
    use tokens::tokens::media_files::MediaFileToken;

    use crate::http_server::common_responses::media_file_social_meta_lite::MediaFileSocialMetaLight;

    #[test]
    fn test_from_optional_db_fields() {
        let media_file_token = MediaFileToken::new_from_str("token");
        let media_filename = "media_filename";
        let display_name = "display_name";
        let gravatar_hash= "adsf";

        let media_file_details = MediaFileSocialMetaLight::from_optional_db_fields(
            Some(&media_file_token),
            0,0,false
        );

        let media_file_details = media_file_details.expect("Should not be optional.");

        assert_eq!(media_file_details.media_file_token, media_file_token);
    }
}
