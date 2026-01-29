use crate::requests::get_request_signup_source::get_request_signup_source;
use actix_web::HttpRequest;
use enums::by_table::users::user_signup_source::UserSignupSource;

pub fn get_request_signup_source_enum(http_request: &HttpRequest) -> Option<UserSignupSource> {
  get_request_signup_source(http_request)
      .and_then(|source_str| UserSignupSource::from_str(source_str).ok())
}

#[cfg(test)]
mod tests {
  use actix_web::test::TestRequest;

  mod origin_header_enum {
    use super::*;
    use crate::requests::get_request_signup_source_enum::get_request_signup_source_enum;
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
