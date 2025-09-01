use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use artcraft_api_defs::stripe_artcraft::create_subscription_checkout::{PlanBillingCadence, StripeArtcraftCreateCheckoutSessionRequest};
use enums::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug;
use errors::AnyhowResult;
use log::info;
use reqwest::Url;
use storyteller_client::stripe_artcraft::create_subscription_checkout::create_subscription_checkout;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

const BILLING_WINDOW_NAME: &str = "artcraft_billing_window";

pub async fn open_storyteller_billing_window(
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  storyteller_creds_manager: &StorytellerCredentialManager,
  plan: Option<ArtcraftSubscriptionSlug>,
  cadence: Option<PlanBillingCadence>,
) -> AnyhowResult<()> {

  if app.get_window(BILLING_WINDOW_NAME).is_some() {
    return Err(anyhow!("Billing window already open"));
  }

  let url = do_get_url(
    app,
    app_env_configs,
    app_data_root,
    storyteller_creds_manager,
    plan,
    cadence,
  ).await?;

  do_open_window(app, app_data_root, url).await?;

  Ok(())
}

async fn do_get_url(
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  storyteller_creds_manager: &StorytellerCredentialManager,
  plan: Option<ArtcraftSubscriptionSlug>,
  cadence: Option<PlanBillingCadence>,
) -> AnyhowResult<Url> {

  info!("Checkout session requires session...");

  let creds = storyteller_creds_manager.get_credentials_required()?;

  info!("Creating checkout session...");

  let request = StripeArtcraftCreateCheckoutSessionRequest {
    plan,
    cadence,
  };

  let result = create_subscription_checkout(
    &app_env_configs.storyteller_host,
    Some(&creds),
    request,
  ).await?;

  info!("Checkout session created...");

  let url = Url::parse(&result.stripe_checkout_redirect_url)?;
  Ok(url)
}

async fn do_open_window(
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  url: Url,
) -> AnyhowResult<()> {
  let url = WebviewUrl::External(url);

  info!("Opening checkout window...");

  // TODO(bt,2025-09-01): We probably need to open this in a real browser to get autocomplete.
  let window = WebviewWindowBuilder::new(app, BILLING_WINDOW_NAME, url)
      //.user_agent(openai_sora_client::credentials::USER_AGENT)
      .always_on_top(false)
      .title("Sign up for ArtCraft")
      .center()
      .resizable(true)
      .visible(true)
      .closable(true)
      .min_inner_size(1000.0, 800.0)
      .focused(true)
      .devtools(true)
      .build()?;

  let webview = window.get_webview(BILLING_WINDOW_NAME)
      .ok_or_else(|| anyhow!("no webview found"))?;

  //webview.navigate(MIDJOURNEY_HOMEPAGE_URL.clone())?;

  // NB: We're starting to get Cloudflare protection screens. Let's try to avoid.
  //tokio::time::sleep(Duration::from_millis(100)).await;

  //webview.navigate(MIDJOURNEY_LOGIN_URL.clone())?;

  let app_handle = app.clone();
  let app_data_root = app_data_root.clone();

  //let _ = tauri::async_runtime::spawn(async move {
  //  midjourney_login_window_thread(app_handle, app_data_root).await;
  //});

  Ok(())
}
