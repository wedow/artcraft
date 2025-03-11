use serde::Serialize;


#[derive(Clone, Copy, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum NotificationModelType {
  Unet,
  Vae,
  Json,
  ClipEncoder,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum NotificationEvent<'a> {
  ModelDownloadStarted {
    model_name: &'a str, 
    model_type: NotificationModelType,
  },
  ModelDownloadProgress {
    model_name: &'a str,
    model_type: NotificationModelType,
    currently_downloaded_bytes: usize,
    total_file_bytes: usize,
  },
  ModelDownloadComplete {
    model_name: &'a str,
    model_type: NotificationModelType,
  }
}
