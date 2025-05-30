/*
curl 'https://openart.ai/api/auth/session' --compressed
 -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:138.0) Gecko/20100101 Firefox/138.0'
 -H 'Accept: * / *'
 -H 'Accept-Language: en-US,en;q=0.5'
 -H 'Accept-Encoding: gzip, deflate, br, zstd'
 -H 'Referer: https://openart.ai/create?mode=edit&imageAction=changeBackground&action_mode=background_manual_remove'
 -H 'Content-Type: application/json'
 -H 'Connection: keep-alive'
 -H 'Cookie: AMP_3e2fda7a5c=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjJmZmRkZTQ2MS1jMmVlLTRmNmUtYmQwMi0zNDcwYjY1OWNkMTklMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjI2YWJ1ejg1Y1JvMWlWQW1rNlJqZiUyMiUyQyUyMnNlc3Npb25JZCUyMiUzQTE3NDg1ODQyODY0NzclMkMlMjJvcHRPdXQlMjIlM0FmYWxzZSUyQyUyMmxhc3RFdmVudFRpbWUlMjIlM0ExNzQ4NTg0NTU5NzEyJTJDJTIybGFzdEV2ZW50SWQlMjIlM0EzNjglMkMlMjJwYWdlQ291bnRlciUyMiUzQTklN0Q=; AMP_MKTG_3e2fda7a5c=JTdCJTIycmVmZXJyZXIlMjIlM0ElMjJodHRwcyUzQSUyRiUyRnd3dy5nb29nbGUuY29tJTJGJTIyJTJDJTIycmVmZXJyaW5nX2RvbWFpbiUyMiUzQSUyMnd3dy5nb29nbGUuY29tJTIyJTdE; __client_uat=0; __client_uat_Xt7g_-Hi=0; utm_params={%22utm_source%22:%22organic%22%2C%22utm_medium%22:%22Google%22%2C%22utm_campaign%22:%22oa_unknown%22%2C%22utm_term%22:%22oa_unknown%22%2C%22utm_content%22:%22oa_unknown%22}; themeMode=dark; themeDirection=ltr; themeColorPresets=default; themeLayout=horizontal; themeContrast=default; themeStretch=false; unique_device_id=f1f0b393-815f-4f95-aaa2-65a3b94530f6; __Host-next-auth.csrf-token=ea06d49af6d70cbe0d15774565708d6c394790c5ab2610276bb0bf29a4afb47b%7Cbdbf15d7f2bf44c83586c7ab1ec47ea6c114b26ccc8e20ae45f40f06c0377389; __Secure-next-auth.callback-url=https%3A%2F%2Fopenart.ai%2Fcreate; __Secure-next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..mzdySrH34fIj41NP.ky2ZVPIugA1EWSKL29EEEKvSxfG4LCo-R7rN-yLzLo-2LmCrFzVe15BCH2MYg90cwkdIdm1Hi-7U4BcnxG0x662UrU9RDw2yX_ZTZge6Kz70-pg1TaVvKWOS_Gibv8ERSK6MHTfqlx4WNvHccOOfDIWhN87zbLXHCbWnexgmBOB3XfMA96Hby55JNgDM3-_JPcg1lFNkT8oAW562FUZxM9EMzKD4-A4Ee1ZpVd0Z51k4lqfS4XED-0xT6xagsCd6CdwEHEHc0paIAj34Kb_lCO2nyrxGBYvx1XlVHjvXdtakrTqe6jrOuV5rQ0iEO6Xk6cibcZydMV4GssKPEwUDS718AJCxNUK9yHi4RRyfYus.bhvOrrfLdszMcHfJ3Ex2wA'
 -H 'Sec-Fetch-Dest: empty'
 -H 'Sec-Fetch-Mode: cors'
 -H 'Sec-Fetch-Site: same-origin'
 -H 'Priority: u=4'
 -H 'Pragma: no-cache'
 -H 'Cache-Control: no-cache'
 -H 'TE: trailers'
 */
use log::{error, info};
use crate::creds::openart_credentials::OpenArtCredentials;
use crate::error::openart_error::OpenArtError;
use reqwest::Client;
use crate::error::api_error::ApiError;
use crate::error::client_error::ClientError;

const SESSION_URL : &str = "https://openart.ai/api/auth/session";

pub async fn get_session_request(creds: &OpenArtCredentials) -> Result<String, OpenArtError> {

  let cookies = match creds.cookies.as_ref() {
    Some(cookies) => cookies,
    None => {
      error!("Failed to request session. No cookies in credentials.");
      return Err(ClientError::NoCookiesInCredentials.into());
    }
  };
  
  let client = Client::builder()
      .gzip(true)
      .build()
      .map_err(|err| {
        error!("Failed to create HTTP client: {}", err);
        OpenArtError::Client(ClientError::ReqwestError(err))
      })?;

  info!("Getting session info from cookies... (cookie payload length: {})", cookies.as_str().len());

  let mut http_request= client.get(SESSION_URL)
      .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:137.0) Gecko/20100101 Firefox/137.0")
      .header("Accept", "*/*")
      .header("Accept-Encoding", "gzip, deflate, br")
      .header("Accept-Language", "en-US,en;q=0.5")
      .header("Cookie", cookies.as_str());

  let http_request = http_request.build()
      .map_err(|err| ApiError::ReqwestError(err))?;

  let response = client.execute(http_request)
      .await
      .map_err(|err| ApiError::ReqwestError(err))?;

  let status = response.status();

  let response_body = &response.text()
      .await
      .map_err(|err| {
        error!("Error reading body while attempting to generate bearer token: {:?}", err);
        ApiError::ReqwestError(err)
      })?;
  
  if !status.is_success() {
    error!("Failed to generate bearer token with session cookies: {} ; body = {}", status, response_body);
    let error = classify_general_http_status_code_and_body(status, &response_body).await;
    return Err(error);
  }
  
  debug!("Bearer token generation response was 200.");
  debug!("Auth Response: {}", response_body);
  
  if response_body == "null" {
    error!("Failed to generate bearer token. Response was the string `null`.");  
    return Err(SoraError::FailedToGenerateBearer)  
  }
  
  let auth_response: SoraAuthResponse = serde_json::from_str(&response_body)?;

  Ok(auth_response.access_token)
}
