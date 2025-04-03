const USER_AGENT : &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

// https://sora.com/backend/notif?limit=100&before=task_01jqwwrkvgeqp8jsf5mqk1jceh

use crate::credentials::SoraCredentials;

pub async fn sora_job_status(
  task_id: &str,
  credentials: &SoraCredentials,
) -> anyhow::Result<()> {
  let url = format!("https://sora.com/backend/notif?limit=100&before={}", task_id);

  let client = reqwest::Client::new();

  let request = client
    .get(url)
    .header("Authorization", &credentials.bearer_token)
    .header("User-Agent", USER_AGENT)
    .header("Cookie", &credentials.cookie);

  let response = request.send().await?;

  let json_response = &response.text().await?;

  println!(" >>> response = {:?}", json_response);

  //let response = serde_json::from_str(json_response)?;

  Ok(())
}

#[cfg(test)]
mod tests {
  use std::fs::read_to_string;
  use errors::AnyhowResult;
  use testing::test_file_path::test_file_path;
  use crate::credentials::SoraCredentials;
  use crate::job::sora_job_status::sora_job_status;

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

    let result = sora_job_status(task_id, &creds).await?;

    Ok(())
  }
}
