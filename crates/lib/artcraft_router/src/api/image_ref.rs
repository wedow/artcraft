use tokens::tokens::media_files::MediaFileToken;

pub enum ImageRef<'a> {
  MediaFileToken(&'a MediaFileToken),
  Url(&'a str),
}
