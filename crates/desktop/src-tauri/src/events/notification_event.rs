use serde::Serialize;


#[derive(Clone, Copy, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum NotificationModelType {
  Unet,
  Vae,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum NotificationEvent<'a> {
  ModelDownloadStarted {
    model_name: &'a str, 
    model_type: NotificationModelType,
  },
  ModelDownloadComplete {
    model_name: &'a str,
    model_type: NotificationModelType,
  }
}
