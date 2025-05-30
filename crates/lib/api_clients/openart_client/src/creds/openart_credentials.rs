use crate::creds::openart_cookies::OpenArtCookies;

#[derive(Clone)]
pub struct OpenArtCredentials {
  pub cookies: Option<OpenArtCookies>,
}

impl OpenArtCredentials {
  pub fn from_cookies(cookies: &str) -> Self {
    let cookies = OpenArtCookies::new(cookies.to_string());
    Self { 
      cookies: Some(cookies),
    }
  }
}
