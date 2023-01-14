use actix_cors::Cors;
use actix_web::http;
use log::info;
use reusable_types::server_environment::ServerEnvironment;

/// Return cors config for FakeYou / Vocodes / OBS / local development
pub fn build_cors_config(server_environment: ServerEnvironment) -> Cors {
  let is_production = server_environment.is_deployed_in_production();

  info!("Building CORS for environment: {:?}", server_environment);

  do_build_cors_config(is_production)
}

/// Return cors config for FakeYou / Vocodes / OBS / local development
pub fn build_production_cors_config() -> Cors {
  const IS_PRODUCTION : bool = true;
  do_build_cors_config(IS_PRODUCTION)
}

fn do_build_cors_config(is_production: bool) -> Cors {
  let mut cors = Cors::default();

  info!("Building CORS for production: {}", is_production);

  cors = add_fakeyou(cors, is_production);
  cors = add_storyteller(cors, is_production);
  cors = add_power_stream(cors, is_production);
  cors = add_legacy_storyteller_stream(cors, is_production);
  cors = add_legacy_vocodes(cors, is_production);
  cors = add_legacy_trumped(cors, is_production);

  if !is_production {
    cors = add_development_only(cors);
  }

  // Remaining setup
  cors.allowed_methods(vec!["GET", "POST", "OPTIONS", "DELETE"])
      .supports_credentials()
      .allowed_headers(vec![
        http::header::ACCEPT,
        http::header::ACCESS_CONTROL_ALLOW_ORIGIN, // Tabulator Ajax
        http::header::CONTENT_TYPE,
        http::header::ACCESS_CONTROL_ALLOW_CREDENTIALS, // https://stackoverflow.com/a/46412839
        http::header::HeaderName::from_static("x-requested-with") // Tabulator Ajax sends
      ])
      .max_age(3600)
}

pub fn add_fakeyou(cors: Cors, is_production: bool) -> Cors {
  // TODO: Remove non-SSL "http://" from production in safe rollout
  if is_production {
    cors
        // FakeYou (Production)
        .allowed_origin("http://api.fakeyou.com")
        .allowed_origin("http://fakeyou.com")
        .allowed_origin("https://api.fakeyou.com")
        .allowed_origin("https://fakeyou.com")
        // FakeYou (Staging)
        .allowed_origin("http://staging.fakeyou.com")
        .allowed_origin("https://staging.fakeyou.com")
  } else {
    cors
        // FakeYou (Development)
        .allowed_origin("http://dev.fakeyou.com")
        .allowed_origin("http://development.fakeyou.com")
        .allowed_origin("https://dev.fakeyou.com")
        .allowed_origin("https://development.fakeyou.com")
  }
}

pub fn add_power_stream(cors: Cors, is_production: bool) -> Cors {
  // TODO: Remove non-SSL "http://" from production in safe rollout
  if is_production {
    cors
        .allowed_origin("https://dash.power.stream")
        .allowed_origin("https://power.stream")
  } else {
    cors
        .allowed_origin("http://dev.dash.power.stream")
        .allowed_origin("http://dev.power.stream")
        .allowed_origin("https://dev.dash.power.stream")
        .allowed_origin("https://dev.power.stream")
  }
}

pub fn add_storyteller(cors: Cors, is_production: bool) -> Cors {
  // TODO: Remove non-SSL "http://" from production in safe rollout
  if is_production {
    cors
        // Storyteller.io (Production)
        .allowed_origin("http://api.storyteller.io")
        .allowed_origin("http://storyteller.io")
        .allowed_origin("https://api.storyteller.io")
        .allowed_origin("https://storyteller.io")
        // Storyteller.io (Staging)
        .allowed_origin("http://staging.storyteller.io")
        .allowed_origin("https://staging.storyteller.io")
        // Storyteller.io (Development Proxy)
        .allowed_origin("http://development-proxy.storyteller.io")
        .allowed_origin("https://development-proxy.storyteller.io")
  } else {
    cors
        // Storyteller.io (Development)
        .allowed_origin("http://dev.storyteller.io")
        .allowed_origin("https://dev.storyteller.io")
  }
}

pub fn add_legacy_storyteller_stream(cors: Cors, is_production: bool) -> Cors {
  // TODO: Remove non-SSL "http://" from production in safe rollout
  if is_production {
    cors
        // Storyteller.stream (Production)
        .allowed_origin("http://api.storyteller.stream")
        .allowed_origin("http://obs.storyteller.stream")
        .allowed_origin("http://storyteller.stream")
        .allowed_origin("http://ws.storyteller.stream")
        .allowed_origin("https://api.storyteller.stream")
        .allowed_origin("https://obs.storyteller.stream")
        .allowed_origin("https://storyteller.stream")
        .allowed_origin("https://ws.storyteller.stream")
        // Storyteller.stream (Staging)
        .allowed_origin("http://staging.obs.storyteller.stream")
        .allowed_origin("http://staging.storyteller.stream")
        .allowed_origin("https://staging.obs.storyteller.stream")
        .allowed_origin("https://staging.storyteller.stream")
        // Legacy "create.storyteller.io" (Production)
        .allowed_origin("http://create.storyteller.io")
        .allowed_origin("http://obs.storyteller.io")
        .allowed_origin("http://ws.storyteller.io")
        .allowed_origin("https://create.storyteller.io")
        .allowed_origin("https://obs.storyteller.io")
        .allowed_origin("https://ws.storyteller.io")
  } else {
    cors // NB: None!
  }
}

pub fn add_legacy_vocodes(cors: Cors, is_production: bool) -> Cors {
  if is_production {
    cors
        // Vocodes (Production)
        .allowed_origin("https://api.vo.codes")
        .allowed_origin("https://vo.codes")
        .allowed_origin("https://vocodes.com")
  } else {
    cors
        // Vocodes (Development)
        .allowed_origin("http://dev.api.vo.codes")
        .allowed_origin("http://dev.vo.codes")
        .allowed_origin("https://dev.api.vo.codes")
        .allowed_origin("https://dev.vo.codes")
  }
}

pub fn add_legacy_trumped(cors: Cors, is_production: bool) -> Cors {
  if is_production {
    cors
        // Trumped (Production)
        .allowed_origin("https://trumped.com")
  } else {
    cors
        // Trumped (Development)
        .allowed_origin("http://dev.trumped.com")
        .allowed_origin("https://dev.trumped.com")
  }
}

pub fn add_development_only(cors: Cors) -> Cors {
  cors
      // Local Development (Localhost)
      .allowed_origin("http://localhost:12345")
      .allowed_origin("http://localhost:3000")
      .allowed_origin("http://localhost:54321")
      .allowed_origin("http://localhost:5555")
      .allowed_origin("http://localhost:7000")
      .allowed_origin("http://localhost:7001")
      .allowed_origin("http://localhost:7002")
      .allowed_origin("http://localhost:7003")
      .allowed_origin("http://localhost:7004")
      .allowed_origin("http://localhost:7005")
      .allowed_origin("http://localhost:7006")
      .allowed_origin("http://localhost:7007")
      .allowed_origin("http://localhost:7008")
      .allowed_origin("http://localhost:7009")
      .allowed_origin("http://localhost:8000")
      .allowed_origin("http://localhost:8080")
      // Local Development (JungleHorse)
      .allowed_origin("http://api.jungle.horse")
      .allowed_origin("http://jungle.horse")
      .allowed_origin("http://jungle.horse:12345")
      .allowed_origin("http://jungle.horse:7000")
      .allowed_origin("http://obs.jungle.horse")
      .allowed_origin("http://ws.jungle.horse")
      .allowed_origin("https://api.jungle.horse")
      .allowed_origin("https://jungle.horse")
      .allowed_origin("https://obs.jungle.horse")
      .allowed_origin("https://ws.jungle.horse")
}

#[cfg(test)]
mod tests {
  use actix_cors::Cors;
  use actix_web::dev::{Service, ServiceRequest, ServiceResponse, Transform};
  use actix_web::http::StatusCode;
  use actix_web::test::TestRequest;
  use actix_web::{Error, test};
  use crate::cors::build_cors_config;
  use reusable_types::server_environment::ServerEnvironment;
  use speculoos::{assert_that, asserting};

  async fn make_test_request(cors: &Cors, hostname: &str) -> ServiceResponse {
    let cors= cors.new_transform(test::ok_service())
        .await
        .unwrap();

    let request = TestRequest::default()
        .insert_header(("Origin", hostname))
        .to_srv_request();

    test::call_service(&cors, request).await
  }

  async fn assert_origin_ok(cors: &Cors, hostname: &str) {
    let response = make_test_request(cors, hostname).await;
    asserting(&format!("Hostname {} is valid", hostname))
        .that(&response.status())
        .is_equal_to(StatusCode::OK);
  }

  async fn assert_origin_invalid(cors: &Cors, hostname: &str) {
    let response = make_test_request(cors, hostname).await;
    asserting(&format!("Hostname {} is invalid", hostname))
        .that(&response.status())
        .is_equal_to(StatusCode::BAD_REQUEST);
  }

  #[actix_rt::test]
  async fn test_fakeyou_production() {
    let production_cors = build_cors_config(ServerEnvironment::Production);

    // Valid Origin
    assert_origin_ok(&production_cors, "https://fakeyou.com").await;
    assert_origin_ok(&production_cors, "https://api.fakeyou.com").await;
    assert_origin_ok(&production_cors, "https://staging.fakeyou.com").await;

    // Invalid Origin
    assert_origin_invalid(&production_cors, "https://fake.fakeyou.com").await;
    assert_origin_invalid(&production_cors, "https://jungle.horse").await;
    assert_origin_invalid(&production_cors, "http://localhost:54321").await;
  }

  #[actix_rt::test]
  async fn test_fakeyou_development() {
    let development_cors = build_cors_config(ServerEnvironment::Development);

    // Valid Origin
    assert_origin_ok(&development_cors, "https://dev.fakeyou.com").await;
    assert_origin_ok(&development_cors, "http://localhost:54321").await;

    // Invalid Origin
    assert_origin_invalid(&development_cors, "https://fakeyou.com").await;
    assert_origin_invalid(&development_cors, "https://api.fakeyou.com").await;
    assert_origin_invalid(&development_cors, "https://staging.fakeyou.com").await;
  }

  #[actix_rt::test]
  async fn test_storyteller_production() {
    let production_cors = build_cors_config(ServerEnvironment::Production);

    // Valid Origin
    assert_origin_ok(&production_cors, "https://storyteller.io").await;
    assert_origin_ok(&production_cors, "https://api.storyteller.io").await;
    assert_origin_ok(&production_cors, "https://staging.storyteller.io").await;

    // Invalid Origin
    assert_origin_invalid(&production_cors, "https://dev.storyteller.io").await;
    assert_origin_invalid(&production_cors, "http://dev.storyteller.io").await;
  }

  #[actix_rt::test]
  async fn test_storyteller_development() {
    let development_cors = build_cors_config(ServerEnvironment::Development);

    // Valid Origin
    assert_origin_ok(&development_cors, "https://dev.storyteller.io").await;
    assert_origin_ok(&development_cors, "http://localhost:54321").await;

    // Invalid Origin
    assert_origin_invalid(&development_cors, "https://storyteller.io").await;
    assert_origin_invalid(&development_cors, "https://staging.storyteller.io").await;
  }
}
