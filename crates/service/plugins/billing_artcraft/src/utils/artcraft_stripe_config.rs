use stripe::Client;

#[derive(Clone)]
pub struct ArtcraftStripeConfig {
  pub secret_key: String,
  pub secret_webhook_signing_key: String,
  pub checkout_success_url: String,
  pub checkout_cancel_url: String,
  pub portal_return_url: String,
}

#[derive(Clone)]
pub struct ArtcraftStripeConfigWithClient {
  pub secret_key: String,
  pub secret_webhook_signing_key: String,
  pub checkout_success_url: String,
  pub checkout_cancel_url: String,
  pub portal_return_url: String,
  pub client: Client,
}

impl ArtcraftStripeConfig {
  pub fn to_config_with_client(&self) -> ArtcraftStripeConfigWithClient {
    ArtcraftStripeConfigWithClient {
      secret_key: self.secret_key.clone(),
      secret_webhook_signing_key: self.secret_webhook_signing_key.clone(),
      checkout_success_url: self.checkout_success_url.clone(),
      checkout_cancel_url: self.checkout_cancel_url.clone(),
      portal_return_url: self.portal_return_url.clone(),
      client: Client::new(self.secret_key.clone()),
    }
  }
}
