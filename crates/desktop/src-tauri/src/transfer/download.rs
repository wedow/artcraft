//! Implemented from https://github.com/huggingface/hf_transfer/blob/main/src/lib.rs

use crate::transfer::error::Error;
use crate::transfer::util::{exponential_backoff, BASE_WAIT_TIME, MAX_WAIT_TIME};
use futures::stream::FuturesUnordered;
use futures::StreamExt;
use reqwest::header::{
  HeaderMap, HeaderName, HeaderValue, AUTHORIZATION, CONTENT_RANGE,
  RANGE,
};
use reqwest::Url;
use std::collections::HashMap;
use std::fmt::Display;
use std::fs::remove_file;
use std::io::SeekFrom;
use std::path::Path;
use std::sync::Arc;
use std::time::Duration;
use tokio::fs::OpenOptions;
use tokio::io::AsyncWriteExt;
use tokio::io::AsyncSeekExt;
use tokio::sync::Semaphore;
use tokio::time::sleep;


/// max_files: Number of open file handles, which determines the maximum number of parallel downloads
/// parallel_failures:  Number of maximum failures of different chunks in parallel (cannot exceed max_files)
/// max_retries: Number of maximum attempts per chunk. (Retries are exponentially backed off + jitter)
///
/// The number of threads can be tuned by the environment variable `TOKIO_WORKER_THREADS` as documented in
/// https://docs.rs/tokio/latest/tokio/runtime/struct.Builder.html#method.worker_threads
#[allow(clippy::too_many_arguments)]
pub fn download(
  url: String,
  filename: String,
  max_files: usize,
  chunk_size: usize,
  parallel_failures: usize,
  max_retries: usize,
  headers: Option<HashMap<String, String>>,
) -> Result<(), Error> {
  if parallel_failures > max_files {
    return Err(Error::new_err(
      "Error parallel_failures cannot be > max_files".to_string(),
    ));
  }
  if (parallel_failures == 0) != (max_retries == 0) {
    return Err(Error::new_err(
      "For retry mechanism you need to set both `parallel_failures` and `max_retries`"
        .to_string(),
    ));
  }
  tokio::runtime::Builder::new_multi_thread()
    .enable_all()
    .build()?
    .block_on(async {
      download_async(
        url,
        filename.clone(),
        max_files,
        chunk_size,
        parallel_failures,
        max_retries,
        headers,
      )
        .await
    })
    .map_err(|err| {
      let path = Path::new(&filename);
      if path.exists() {
        match remove_file(filename) {
          Ok(_) => err,
          Err(err) => {
            Error::new_err(format!("Error while removing corrupted file: {err}"))
          }
        }
      } else {
        err
      }
    })
}


#[allow(clippy::too_many_arguments)]
pub async fn download_async(
  url: String,
  filename: String,
  max_files: usize,
  chunk_size: usize,
  parallel_failures: usize,
  max_retries: usize,
  input_headers: Option<HashMap<String, String>>,
) -> Result<(), Error> {
  let client = reqwest::Client::builder()
    // https://github.com/hyperium/hyper/issues/2136#issuecomment-589488526
    .http2_keep_alive_timeout(Duration::from_secs(15))
    .build()
    .unwrap();

  let mut headers = HeaderMap::new();
  let mut auth_token = None;
  if let Some(input_headers) = input_headers {
    headers.reserve(input_headers.len());
    for (k, v) in input_headers {
      let name: HeaderName = k
        .try_into()
        .map_err(|err| Error::new_err(format!("Invalid header: {err}")))?;
      let value: HeaderValue = AsRef::<str>::as_ref(&v)
        .try_into()
        .map_err(|err| Error::new_err(format!("Invalid header value: {err}")))?;
      if name == AUTHORIZATION {
        auth_token = Some(value);
      } else {
        headers.insert(name, value);
      }
    }
  };

  let response = if let Some(token) = auth_token.as_ref() {
    client.get(&url).header(AUTHORIZATION, token)
  } else {
    client.get(&url)
  }
    .headers(headers.clone())
    .header(RANGE, "bytes=0-0")
    .send()
    .await
    .map_err(|err| Error::new_err(format!("Error while downloading: {err}")))?
    .error_for_status()
    .map_err(|err| Error::new_err(err.to_string()))?;

  // Only call the final redirect URL to avoid overloading the Hub with requests and also
  // altering the download count
  let redirected_url = response.url();
  if Url::parse(&url)
    .map_err(|err| Error::new_err(format!("failed to parse url: {err}")))?
    .host()
    == redirected_url.host()
  {
    if let Some(token) = auth_token {
      headers.insert(AUTHORIZATION, token);
    }
  }

  let content_range = response
    .headers()
    .get(CONTENT_RANGE)
    .ok_or(Error::new_err("No content length".to_string()))?
    .to_str()
    .map_err(|err| Error::new_err(format!("Error while downloading: {err}")))?;

  let size: Vec<&str> = content_range.split('/').collect();
  // Content-Range: bytes 0-0/702517648
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Range
  let length: usize = size
    .last()
    .ok_or(Error::new_err(
      "Error while downloading: No size was detected".to_string(),
    ))?
    .parse()
    .map_err(|err| Error::new_err(format!("Error while downloading: {err}")))?;

  let mut handles = FuturesUnordered::new();
  let semaphore = Arc::new(Semaphore::new(max_files));
  let parallel_failures_semaphore = Arc::new(Semaphore::new(parallel_failures));

  for start in (0..length).step_by(chunk_size) {
    let url = redirected_url.to_string();
    let filename = filename.clone();
    let client = client.clone();
    let headers = headers.clone();

    let stop = std::cmp::min(start + chunk_size - 1, length);
    let semaphore = semaphore.clone();
    let parallel_failures_semaphore = parallel_failures_semaphore.clone();
    handles.push(tokio::spawn(async move {
      let permit = semaphore
        .acquire_owned()
        .await
        .map_err(|err| Error::new_err(format!("Error while downloading: {err}")))?;
      let mut chunk = download_chunk(&client, &url, &filename, start, stop, headers.clone()).await;
      let mut i = 0;
      if parallel_failures > 0 {
        while let Err(dlerr) = chunk {
          if i >= max_retries {
            return Err(Error::new_err(format!(
              "Failed after too many retries ({max_retries}): {dlerr}"
            )));
          }
          let parallel_failure_permit = parallel_failures_semaphore.clone().try_acquire_owned().map_err(|err| {
            Error::new_err(format!(
              "Failed too many failures in parallel ({parallel_failures}): {dlerr} ({err})"
            ))
          })?;

          let wait_time = exponential_backoff(BASE_WAIT_TIME, i, MAX_WAIT_TIME);
          sleep(Duration::from_millis(wait_time as u64)).await;

          chunk = download_chunk(&client, &url, &filename, start, stop, headers.clone()).await;
          i += 1;
          drop(parallel_failure_permit);
        }
      }
      drop(permit);
      chunk.map_err(|e| Error::new_err(format!("Downloading error {e}"))).and(Ok(stop - start))
    }));
  }

  // Output the chained result
  while let Some(result) = handles.next().await {
    match result {
      Ok(Ok(size)) => {
        //if let Some(ref callback) = callback {
        //  callback.call((size,), None)?;
        //}
      }
      Ok(Err(py_err)) => {
        return Err(py_err);
      }
      Err(err) => {
        return Err(Error::new_err(format!(
          "Error while downloading: {err}"
        )));
      }
    }
  }
  Ok(())
}

async fn download_chunk(
  client: &reqwest::Client,
  url: &str,
  filename: &str,
  start: usize,
  stop: usize,
  headers: HeaderMap,
) -> Result<(), Error> {
  // Process each socket concurrently.
  let range = format!("bytes={start}-{stop}");
  let mut file = OpenOptions::new()
    .write(true)
    .truncate(false)
    .create(true)
    .open(filename)
    .await?;
  file.seek(SeekFrom::Start(start as u64)).await?;
  let response = client
    .get(url)
    .headers(headers)
    .header(RANGE, range)
    .send()
    .await?
    .error_for_status()?;
  let content = response.bytes().await?;
  file.write_all(&content).await?;
  Ok(())
}
