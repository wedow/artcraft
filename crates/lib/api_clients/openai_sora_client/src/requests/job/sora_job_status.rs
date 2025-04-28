use crate::creds::credential_migration::CredentialMigrationRef;
use crate::sora_error::SoraError;

const USER_AGENT : &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

// https://sora.com/backend/notif?limit=100&before=task_01jqwwrkvgeqp8jsf5mqk1jceh

pub async fn sora_job_status(
  task_id: &str,
  credentials: CredentialMigrationRef<'_>,
) -> Result<(), SoraError> {
  let url = format!("https://sora.com/backend/notif?limit=100&before={}", task_id);

  let mut cookie;
  let mut authorization_header;

  match credentials {
    CredentialMigrationRef::Legacy(creds) => {
      cookie = creds.cookie.clone();
      authorization_header = creds.authorization_header_value();
    }
    CredentialMigrationRef::New(creds) => {
      cookie = creds.cookies.to_string();
      // TODO(bt,2025-04-23): We're using a Sora payload error in place of application state error. Surface this differently.
      authorization_header = creds.jwt_bearer_token.as_ref()
          .ok_or(SoraError::NoBearerTokenAvailable)?
          .to_authorization_header_value();
    }
  }

  let client = reqwest::Client::new();

  let request = client
    .get(url)
    .header("Authorization", &authorization_header)
    .header("User-Agent", USER_AGENT)
    .header("Cookie", &cookie);

  let response = request.send().await?;

  let json_response = &response.text().await?;

  //let response = serde_json::from_str(json_response)?;

  Ok(())
}

#[cfg(test)]
mod tests {
  use crate::credentials::SoraCredentials;
  use crate::creds::credential_migration::CredentialMigrationRef;
  use crate::requests::job::sora_job_status::sora_job_status;
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use testing::test_file_path::test_file_path;

  #[ignore]
  #[tokio::test]
  pub async fn manual_test() -> AnyhowResult<()> {
    let sentinel = read_to_string(test_file_path("test_data/temp/sentinel.txt")?)?;
    let sentinel = sentinel.trim().to_string();

    let cookie = read_to_string(test_file_path("test_data/temp/cookie.txt")?)?;
    let cookie = cookie.trim().to_string();

    let bearer = read_to_string(test_file_path("test_data/temp/bearer.txt")?)?;
    let bearer = bearer.trim().to_string();

    let creds = SoraCredentials {
      bearer_token: bearer,
      cookie,
      sentinel: Some(sentinel),
    };

    let task_id = "task_01jqwwrkvgeqp8jsf5mqk1jceh";

    let result = sora_job_status(task_id, CredentialMigrationRef::Legacy(&creds)).await?;

    Ok(())
  }
}
