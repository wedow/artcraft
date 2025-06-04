use bytes::Bytes;
use errors::AnyhowResult;
use reqwest::{Client, IntoUrl};

const USER_AGENT: &str = "storyteller-web/1.0";

// TODO(bt, 2025-06-03): Don't load the entire file into memory!

/// Downloads a (binary) file to memory. Good for images, etc. Not great for large files.
pub async fn http_download_url_to_bytes<U: IntoUrl>(url: U) -> AnyhowResult<Bytes> {
  let client = Client::builder()
      .gzip(true)
      .build()?;

  let response = client.get(url) // NB: No IntoUrl for &Url.
      .header("User-Agent", USER_AGENT)
      .header("Accept", "*/*")
      .send()
      .await?;

  let bytes = response.bytes().await?;

  Ok(bytes)
}
