use actix_helpers::extractors::get_request_origin_uri::get_request_origin_uri;
use actix_web::HttpRequest;
use enums::by_table::users::user_signup_source::UserSignupSource;
use log::warn;

const ARTCRAFT : &str = "artcraft";
const FAKEYOU : &str = "fakeyou";
const STORYTELLER : &str = "storyteller";

/// This is for the users table `maybe_source` field which is populated during account creation.
/// While we could back this with an enum, there may be a motivation to use this VARCHAR(255) field 
/// for more robust payloads and user tracking in the future.
pub fn get_request_signup_source(http_request: &HttpRequest) -> Option<&'static str> {
  // NB: "Origin" vs "Referrer"
  //
  // Basically:
  //  - "In order to preserve privacy, any browser request can decide to omit the Referer header."
  //  - "The Origin header is similar to the Referer header, but does not disclose the path, and may be null."
  //  - "Origin" is sent on cross-origin, same-origin (except GET and HEAD requests - typically).
  //
  // Reading:
  //  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin
  //  - https://stackoverflow.com/a/71040145
  //
  let maybe_origin = get_request_origin_uri(&http_request);

  match maybe_origin {
    Ok(Some(uri)) => {
      if let Some(host) = uri.host() {
        if host.contains(ARTCRAFT) {
          return Some(ARTCRAFT);
        } else if host.contains(STORYTELLER) {
          return Some(STORYTELLER);
        } else if host.contains(FAKEYOU) {
          return Some(FAKEYOU);
        }
      }
    }
    // Fail open for now.
    Ok(None) => {}
    Err(err) => {
      warn!("Origin header error: {:?}", err);
    }
  }

  // NB: We don't want to check the "Host" header because we might have misconfigured
  // a future frontend to talk to some other API gateway and might be improperly and
  // silently misattributing signup statistics.

  None
}

pub fn get_request_signup_source_enum(http_request: &HttpRequest) -> Option<UserSignupSource> {
  get_request_signup_source(http_request)
      .and_then(|source_str| UserSignupSource::from_str(source_str).ok())
}

#[cfg(test)]
mod tests {
  use actix_web::test::TestRequest;

  mod origin_header_str {
    use super::*;
    use crate::http_server::requests::get_request_signup_source::get_request_signup_source;

    #[test]
    fn artcraft_dot_ai() {
      let request = TestRequest::get()
          .insert_header(("origin", "https://artcraft.ai"))
          .to_http_request();
      assert_eq!(get_request_signup_source(&request), Some("artcraft"));
    }

    #[test]
    fn get_artcraft_dot_com() {
      let request = TestRequest::get()
          .insert_header(("origin", "https://getartcraft.com"))
          .to_http_request();
      assert_eq!(get_request_signup_source(&request), Some("artcraft"));
    }

    #[test]
    fn api_dot_get_artcraft_dot_com() {
      let request = TestRequest::get()
          .insert_header(("origin", "https://api.getartcraft.com"))
          .to_http_request();
      assert_eq!(get_request_signup_source(&request), Some("artcraft"));
    }

    #[test]
    fn fakeyou_dot_com() {
      let request = TestRequest::get()
          .insert_header(("origin", "https://fakeyou.com"))
          .to_http_request();
      assert_eq!(get_request_signup_source(&request), Some("fakeyou"));
    }

    #[test]
    fn api_dot_fakeyou_dot_com() {
      let request = TestRequest::get()
          .insert_header(("origin", "https://api.fakeyou.com"))
          .to_http_request();
      assert_eq!(get_request_signup_source(&request), Some("fakeyou"));
    }

    #[test]
    fn storyteller_dot_ai() {
      let request = TestRequest::get()
          .insert_header(("origin", "https://storyteller.ai"))
          .to_http_request();
      assert_eq!(get_request_signup_source(&request), Some("storyteller"));
    }

    #[test]
    fn api_dot_storyteller_dot_ai() {
      let request = TestRequest::get()
          .insert_header(("origin", "https://api.storyteller.ai"))
          .to_http_request();
      assert_eq!(get_request_signup_source(&request), Some("storyteller"));
    }
  }

  mod origin_header_enum {
    use super::*;
    use crate::http_server::requests::get_request_signup_source::get_request_signup_source_enum;
    use enums::by_table::users::user_signup_source::UserSignupSource;

    #[test]
    fn artcraft_dot_ai() {
      let request = TestRequest::get()
          .insert_header(("origin", "https://artcraft.ai"))
          .to_http_request();
      assert_eq!(get_request_signup_source_enum(&request), Some(UserSignupSource::ArtCraft));
    }

    #[test]
    fn get_artcraft_dot_com() {
      let request = TestRequest::get()
          .insert_header(("origin", "https://getartcraft.com"))
          .to_http_request();
      assert_eq!(get_request_signup_source_enum(&request), Some(UserSignupSource::ArtCraft));
    }

    #[test]
    fn api_dot_get_artcraft_dot_com() {
      let request = TestRequest::get()
          .insert_header(("origin", "https://api.getartcraft.com"))
          .to_http_request();
      assert_eq!(get_request_signup_source_enum(&request), Some(UserSignupSource::ArtCraft));
    }

    #[test]
    fn fakeyou_dot_com() {
      let request = TestRequest::get()
          .insert_header(("origin", "https://fakeyou.com"))
          .to_http_request();
      assert_eq!(get_request_signup_source_enum(&request), Some(UserSignupSource::FakeYou));
    }

    #[test]
    fn api_dot_fakeyou_dot_com() {
      let request = TestRequest::get()
          .insert_header(("origin", "https://api.fakeyou.com"))
          .to_http_request();
      assert_eq!(get_request_signup_source_enum(&request), Some(UserSignupSource::FakeYou));
    }

    #[test]
    fn storyteller_dot_ai() {
      let request = TestRequest::get()
          .insert_header(("origin", "https://storyteller.ai"))
          .to_http_request();
      assert_eq!(get_request_signup_source_enum(&request), Some(UserSignupSource::Storyteller));
    }

    #[test]
    fn api_dot_storyteller_dot_ai() {
      let request = TestRequest::get()
          .insert_header(("origin", "https://api.storyteller.ai"))
          .to_http_request();
      assert_eq!(get_request_signup_source_enum(&request), Some(UserSignupSource::Storyteller));
    }
  }
}
