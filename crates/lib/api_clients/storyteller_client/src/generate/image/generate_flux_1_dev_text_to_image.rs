use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::api_error::ApiError;
use crate::error::client_error::ClientError;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::constants::{APPLICATION_JSON, USER_AGENT};
use crate::utils::filter_bad_response::filter_bad_response;
use artcraft_api_defs::generate::image::generate_flux_1_dev_text_to_image::{GenerateFlux1DevTextToImageRequest, GenerateFlux1DevTextToImageResponse, GENERATE_FLUX_1_DEV_TEXT_TO_IMAGE_PATH};
use log::{debug, info};
use reqwest::Client;

pub async fn generate_flux_1_dev_text_to_image(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: GenerateFlux1DevTextToImageRequest,
) -> Result<GenerateFlux1DevTextToImageResponse, StorytellerError> {

  let url = get_route(api_host);

  info!("Requesting {:?}", &url);

  let client = Client::builder()
      .gzip(true)
      .build()
      .map_err(|err| StorytellerError::Client(ClientError::from(err)))?;

  let mut request_builder = client.post(url)
      .header("User-Agent", USER_AGENT)
      .header("Accept", APPLICATION_JSON)
      .header("Content-Type", APPLICATION_JSON);

  if let Some(creds) = maybe_creds {
    if let Some(header) = &creds.maybe_as_cookie_header() {
      request_builder = request_builder.header("Cookie", header);
    }
  }
  
  let request_body = serde_json::to_string(&request)
      .map_err(|err| StorytellerError::Client(ClientError::from(err)))?;

  debug!("Request body: {:?}", request_body);
  
  let response = request_builder
      .body(request_body)
      .send()
      .await
      .map_err(|err| StorytellerError::Api(ApiError::from(err)))?;

  let response = filter_bad_response(response)
      .await
      .map_err(|err| StorytellerError::Api(ApiError::from(err)))?;
  
  let response_body = &response.text()
      .await
      .map_err(|err| StorytellerError::Api(ApiError::from(err)))?;

  debug!("Response body: {:?}", response_body);
  
  let response = serde_json::from_str(&response_body)
      .map_err(|err| StorytellerError::Api(ApiError::from(err)))?;

  Ok(response)
}

fn get_route(api_host: &ApiHost) -> String {
  let api_hostname = api_host.to_api_hostname();
  format!("https://{}{}", api_hostname, GENERATE_FLUX_1_DEV_TEXT_TO_IMAGE_PATH)
}
