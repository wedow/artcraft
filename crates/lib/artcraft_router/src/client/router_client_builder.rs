use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::client::router_client::RouterClient;

pub struct RouterClientBuilder {
  artcraft_client: Option<RouterArtcraftClient>,
}

impl RouterClientBuilder {
  pub fn new() -> Self {
    Self {
      artcraft_client: None,
    }
  }

  pub fn set_artcraft_client(mut self, client: RouterArtcraftClient) -> Self {
    self.artcraft_client = Some(client);
    self
  }

  pub fn build(self) -> RouterClient {
    RouterClient {
      artcraft_client: self.artcraft_client,
    }
  }
}
