use crate::sora_error::SoraError;
use crate::utils::classify_general_http_error::classify_general_http_error;
use errors::AnyhowResult;
use log::error;
use reqwest::Client;
use serde_derive::Deserialize;

const SORA_BEARER_GENERATE_URL: &str = "https://sora.com/api/auth/session";

#[derive(Debug, Deserialize)]
pub struct SoraAuthResponse {
    pub user: SoraUser,
    pub expires: String,
    #[serde(rename = "accessToken")]
    pub access_token: String,
    #[serde(rename = "internalApiBase")]
    pub internal_api_base: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SoraUser {
    pub id: String,
    pub name: Option<String>,
    pub email: Option<String>,
    pub image: Option<String>,
    pub picture: Option<String>,
    pub provider: Option<String>,
    #[serde(rename = "lastAuthorizationCheck")]
    pub last_authorization_check: Option<i64>,
}

pub async fn generate_bearer_with_cookie(cookie: &str) -> Result<String, SoraError> {
    let client = Client::builder()
        .gzip(true)
        .build()?;

    let response = client.get(SORA_BEARER_GENERATE_URL)
        .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:137.0) Gecko/20100101 Firefox/137.0")
        .header("Accept", "*/*")
        .header("Accept-Encoding", "gzip, deflate, br")
        .header("Accept-Language", "en-US,en;q=0.5")
        .header("Cookie", cookie)
        .send()
        .await?;

    if !response.status().is_success() {
        error!("Failed to generate bearer token: {}", response.status());
        let error = classify_general_http_error(response).await;
        return Err(error);
    }
 
    let response_body = &response.text().await?;
    let auth_response: SoraAuthResponse = serde_json::from_str(&response_body)?;
    Ok(auth_response.access_token)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    #[ignore] // Don't run in CI. Requires valid cookie
    async fn test_generate_bearer_with_cookie() {
        let cookie = "";
        let result = generate_bearer_with_cookie(cookie).await;
        assert!(result.is_ok());
        println!("Bearer token: {}", result.unwrap());
    }
}
