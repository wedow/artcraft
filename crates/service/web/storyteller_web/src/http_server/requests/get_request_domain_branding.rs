use actix_web::HttpRequest;

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum DomainBranding {
  FakeYou,
  Storyteller,
}

pub fn get_request_domain_branding(http_request: &HttpRequest) -> Option<DomainBranding> {
  http_request.uri()
      .host()
      .and_then(|host| match host {
        host if host.contains("fakeyou") => Some(DomainBranding::FakeYou),
        host if host.contains("storyteller") => Some(DomainBranding::Storyteller),
        _ => None,
      })
}

#[cfg(test)]
mod tests {
  use actix_web::test::TestRequest;
  use crate::http_server::requests::get_request_domain_branding::{DomainBranding, get_request_domain_branding};

  #[test]
  fn fakeyou_dot_com() {
    let request = TestRequest::get()
        .uri("https://fakeyou.com")
        .to_http_request();
    assert_eq!(get_request_domain_branding(&request), Some(DomainBranding::FakeYou));
  }

  #[test]
  fn api_dot_fakeyou_dot_com() {
    let request = TestRequest::get()
        .uri("https://api.fakeyou.com")
        .to_http_request();
    assert_eq!(get_request_domain_branding(&request), Some(DomainBranding::FakeYou));
  }

  #[test]
  fn storyteller_dot_ai() {
    let request = TestRequest::get()
        .uri("https://storyteller.ai")
        .to_http_request();
    assert_eq!(get_request_domain_branding(&request), Some(DomainBranding::Storyteller));
  }

  #[test]
  fn api_dot_storyteller_dot_ai() {
    let request = TestRequest::get()
        .uri("https://api.storyteller.ai")
        .to_http_request();
    assert_eq!(get_request_domain_branding(&request), Some(DomainBranding::Storyteller));
  }
}
