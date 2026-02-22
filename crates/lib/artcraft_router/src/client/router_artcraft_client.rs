use storyteller_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use storyteller_client::utils::api_host::ApiHost;

pub struct RouterArtcraftClient {
  pub(crate) api_host: ApiHost,
  pub(crate) credentials: StorytellerCredentialSet,
}
