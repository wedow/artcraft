use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use std::time::Duration;
use wreq::header::USER_AGENT;
use wreq::Client;
use wreq_util::Emulation;

const FINGERPRINT_URL : &str = "https://tools.scrapfly.io/api/tls";

fn build_chrome_140_client() -> Result<Client, GrokError> {
  Ok(Client::builder()
      .emulation(Emulation::Chrome140)
      .connection_verbose(true)
      .connect_timeout(Duration::from_secs(10))
      .build()
      .map_err(|err| GrokClientError::WreqClientError(err))?)
}

fn build_firefox_139_client() -> Result<Client, GrokError> {
  Ok(Client::builder()
      .emulation(Emulation::Firefox139) // NB: THIS IS IDENTICAL IN FINGERPRINT TO REAL FIREFOX !!!
      .connection_verbose(true)
      .connect_timeout(Duration::from_secs(10))
      .build()
      .map_err(|err| GrokClientError::WreqClientError(err))?)
}

async fn get_with_client(client: &Client) -> Result<String, GrokError> {
  let builder = client.get(FINGERPRINT_URL)
      .header("Accept", "application/json");

  let response = builder.send()
      .await
      .map_err(|err| GrokClientError::WreqClientError(err))?;


  let body = response.text()
      .await
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  Ok(body)
}

#[cfg(test)]
mod tests {
  use errors::AnyhowResult;
  use super::*;

  #[tokio::test]
  #[ignore] // manually test
  async fn test_chrome_140() -> AnyhowResult<()> {
    let client = build_chrome_140_client()?;
    let body = get_with_client(&client).await?;
    println!("{}", body);
    assert_eq!(1, 2);
    Ok(())
  }
}
