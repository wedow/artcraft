use crate::core::artcraft_error::ArtcraftError;
use crate::core::state::app_preferences::app_preferences::AppPreferences;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use anyhow::anyhow;
use errors::AnyhowResult;
use log::{error, info};
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use url::Url;

pub async fn download_url_to_user_download_dir(
  url: &Url,
  app_data_root: &AppDataRoot,
  app_prefs: &AppPreferences,
) -> Result<PathBuf, ArtcraftError> {

  let url_path = match url.to_file_path() {
    Ok(path) => path,
    Err(err) => {
      error!("Could not get file path from URL: {:?}", err);
      return Err(ArtcraftError::AnyhowError(anyhow!("Could not get file path from URL: {:?}", err)));
    }
  };

  let url_file_name = url_path
      .file_name()
      .ok_or(ArtcraftError::AnyhowError(anyhow!(
        "No file name for path: {:?} at url: {:?}", &url_path, &url)))?
      .to_str()
      .ok_or(ArtcraftError::AnyhowError(anyhow!(
        "No file name for path: {:?} at url: {:?}", &url_path, &url)))?
      .to_string();

  check_url_file_name_for_downloadability(&url_file_name)?;

  let download_directory = app_prefs
      .preferred_download_directory
      .download_directory(app_data_root);

  let download_filename = {
    let mut download_filename = download_directory.clone();
    download_filename.push(&url_file_name);
    download_directory
  };

  if download_filename.exists() {
    return Err(ArtcraftError::CannotDownloadFilePathAlreadyExists { path: download_filename }.into());
  }
  
  info!("Downloading bytes from url: {:?}", url);

  let response = reqwest::get(url.clone()).await?;
  let response_bytes = response.bytes().await?;

  info!("Writing file: {:?}", download_filename);
  
  let mut file = OpenOptions::new()
      .create(true)
      .write(true)
      .truncate(true)
      .open(&download_filename)?;

  file.write_all(&response_bytes)?;

  Ok(download_filename)
}

// TODO: This likely needs more protections.
fn check_url_file_name_for_downloadability(filename: &str) -> Result<(), ArtcraftError> {
  if filename.contains("/")
      || filename.contains("..")
      || filename.contains("\\")
  {
    error!("Cannot download filename that has relative path components: {:?}", filename);
    return Err(ArtcraftError::BadDownloadFilename { path: filename.into() }.into());
  }

  if filename.ends_with("apk")
      || filename.ends_with("app")
      || filename.ends_with("bat")
      || filename.ends_with("cmd")
      || filename.ends_with("com")
      || filename.ends_with("exe")
      || filename.ends_with("ps1")
      || filename.ends_with("sh")
  {
    error!("Cannot download filename that resembles executable: {:?}", filename);
    return Err(ArtcraftError::BadDownloadFilename { path: filename.into() }.into());
  }

  Ok(())
}
