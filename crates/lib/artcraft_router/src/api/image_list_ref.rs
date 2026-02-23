use tokens::tokens::media_files::MediaFileToken;

pub enum ImageListRef<'a> {
  MediaFileTokens(&'a Vec<MediaFileToken>),
  Urls(&'a Vec<String>),
}
