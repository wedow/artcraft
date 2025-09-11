use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_get_request::basic_json_get_request;
use crate::utils::basic_json_post_request::basic_json_post_request;
use artcraft_api_defs::media_file::list_batch_generated_media_files::LIST_BATCH_GENERATED_REDUX_MEDIA_FILES_URL_PATH;
use artcraft_api_defs::stripe_artcraft::create_credits_pack_checkout::{StripeArtcraftCreateCreditsPackCheckoutRequest, StripeArtcraftCreateCreditsPackCheckoutResponse, CREATE_CREDITS_PACK_CHECKOUT_URL_PATH};
use artcraft_api_defs::wallets::get_primary_wallet_for_user::GetPrimaryWalletForUserResponse;
use enums::common::payments_namespace::PaymentsNamespace;
use log::debug;

pub async fn get_primary_wallet_for_user(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  payments_namespace: PaymentsNamespace
) -> Result<GetPrimaryWalletForUserResponse, StorytellerError> {
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
  format!("{}/v1/wallets/primary_wallet/{}", api_hostname_and_scheme, payments_namespace)
}

