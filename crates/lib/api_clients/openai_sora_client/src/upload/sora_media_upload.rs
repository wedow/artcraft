use errors::AnyhowResult;
use std::path::Path;
use reqwest::multipart::{Form, Part};
use reqwest::Client;
use serde::Deserialize;
use tokio::fs::File;
use tokio::io::AsyncReadExt;
use crate::credentials::SoraCredentials;

const URL: &str = "https://sora.com/backend/uploads";

#[derive(Debug, Deserialize)]
pub struct SoraMediaUploadResponse {
    pub id: String,
    pub r#type: String,
    pub created_at: String,
    pub filename: String,
    pub extension: String,
    pub mime_type: String,
    pub url: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub duration_sec: Option<f64>,
    pub n_frames: Option<u32>,
    pub size_bytes: u64,
    pub thumbnail_url: Option<String>,
}

pub struct SoraMediaUploadRequest<'a> {
    pub file_path: String,
    pub credentials: &'a SoraCredentials,
}

pub async fn sora_media_upload(request: SoraMediaUploadRequest<'_>) -> AnyhowResult<SoraMediaUploadResponse> {
    let client = Client::new();
    let file_path = Path::new(&request.file_path);
    let filename = file_path.file_name()
        .ok_or_else(|| anyhow::anyhow!("Invalid file path"))?
        .to_string_lossy()
        .to_string();

    // Read file data
    let mut file = File::open(&file_path).await?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).await?;

    let mime_type = match file_path.extension().and_then(|e| e.to_str()) {
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("png") => "image/png",
        // Some("webp") => "image/webp",
        // Some("gif") => "image/gif",
        // Some("mp4") => "video/mp4",
        // Some("mov") => "video/quicktime",
        // Some("webm") => "video/webm",
        _ => "application/octet-stream",
    };

    // Create multipart form
    let part = Part::bytes(buffer)
        .file_name(filename)
        .mime_str(mime_type)?;
    let form = Form::new().part("file", part);

    // Make API request
    let request_builder = client.post(URL).multipart(form);
    let request_builder = request.credentials.add_credential_headers_to_request(request_builder);
    let response = request_builder.send().await?;

    // Check response status
    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await?;
        return Err(anyhow::anyhow!("Upload failed with status {}: {}", status, text));
    }

    // Parse response
    let upload_response = response.json::<SoraMediaUploadResponse>().await?;
    Ok(upload_response)
}

#[cfg(test)]
mod tests {
    use std::fs::read_to_string;
    use errors::AnyhowResult;
    use testing::test_file_path::test_file_path;
    use crate::credentials::SoraCredentials;
    use crate::upload::sora_media_upload::{sora_media_upload, SoraMediaUploadRequest};

    // #[ignore]
    #[tokio::test]
    pub async fn test() -> AnyhowResult<()> {

        let cookie = read_to_string(test_file_path("test_data/test_data/temp/cookie.txt")?)?;
        let cookie = cookie.trim().to_string();

        let bearer = read_to_string(test_file_path("test_data/test_data/temp/bearer.txt")?)?;
        let bearer = bearer.trim().to_string();

        let creds = SoraCredentials {
            bearer_token: bearer,
            cookie,
            sentinel: None,
        };

        let response = sora_media_upload(SoraMediaUploadRequest {
            file_path: "/Users/kasisnu/Downloads/puppies-test-image.png".to_string(),
            credentials: &creds,
        }).await?;

        println!("media_id: {}", response.id);
        println!("media_url: {}", response.url);

        assert!(response.id.starts_with("media_"));
        Ok(())
    }
} 