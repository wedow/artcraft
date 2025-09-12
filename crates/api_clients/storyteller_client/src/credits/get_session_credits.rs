use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_get_request::basic_json_get_request;
use artcraft_api_defs::credits::get_session_credits::GetSessionCreditsResponse;
use enums::common::payments_namespace::PaymentsNamespace;
use log::debug;

pub async fn get_session_credits(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  payments_namespace: PaymentsNamespace
) -> Result<GetSessionCreditsResponse, StorytellerError> {
  let url = get_url(api_host, payments_namespace);

  debug!("Requesting {:?}", &url);

  Ok(basic_json_get_request(
    api_host,
    &url,
    maybe_creds,
  ).await?)
}


fn get_url(api_host: &ApiHost, payments_namespace: PaymentsNamespace) -> String {
  let api_hostname_and_scheme = api_host.to_api_hostname_and_scheme();
  let payments_namespace = payments_namespace.to_str();
  format!("{}/v1/credits/{}", api_hostname_and_scheme, payments_namespace)
}

