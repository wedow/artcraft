use crate::client::router_artcraft_client::RouterArtcraftClient;

pub struct RouterClient {
  pub(crate) artcraft_client: Option<RouterArtcraftClient>,
}
