use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::stripe_artcraft::create_customer_portal_session::{StripeArtcraftCreateCustomerPortalSessionRequest, StripeArtcraftCreateCustomerPortalSessionResponse, CREATE_CUSTOMER_PORTAL_URL_PATH};

pub async fn create_customer_portal_session(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  request: StripeArtcraftCreateCustomerPortalSessionRequest,
) -> Result<StripeArtcraftCreateCustomerPortalSessionResponse, StorytellerError> {
  Ok(basic_json_post_request(
    api_host,
    CREATE_CUSTOMER_PORTAL_URL_PATH,
    maybe_creds,
    request,
  ).await?)
}
