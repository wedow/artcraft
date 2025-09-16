use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::sora::windows::sora_login_window::sora_login_thread::sora_login_thread;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use crate::services::storyteller::windows::storyteller_billing_window_thread::storyteller_billing_window_thread;
use anyhow::anyhow;
use artcraft_api_defs::stripe_artcraft::create_credits_pack_checkout::StripeArtcraftCreateCreditsPackCheckoutRequest;
use artcraft_api_defs::stripe_artcraft::create_customer_portal_session::{StripeArtcraftCreateCustomerPortalFlowState, StripeArtcraftCreateCustomerPortalSessionRequest};
use artcraft_api_defs::stripe_artcraft::create_subscription_checkout::{PlanBillingCadence, StripeArtcraftCreateSubscriptionCheckoutRequest};
use enums::common::artcraft_credits_pack_slug::ArtcraftCreditsPackSlug;
use enums::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug;
use errors::AnyhowResult;
use log::info;
use reqwest::Url;
use storyteller_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use storyteller_client::stripe_artcraft::create_credits_pack_checkout::create_credits_pack_checkout;
use storyteller_client::stripe_artcraft::create_customer_portal_session::create_customer_portal_session;
use storyteller_client::stripe_artcraft::create_subscription_checkout::create_subscription_checkout;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

pub const BILLING_WINDOW_NAME: &str = "artcraft_billing_window";

pub struct OpenStorytellerBillingWindowArgs<'a> {
  pub app: &'a AppHandle,
  pub app_env_configs: &'a AppEnvConfigs,
  pub app_data_root: &'a AppDataRoot,
  pub storyteller_creds_manager: &'a StorytellerCredentialManager,
  pub billing_window_case: BillingWindowCase,
}

pub enum BillingWindowCase {
  Subscription {
    plan: ArtcraftSubscriptionSlug,
    cadence: PlanBillingCadence,
  },
  CreditsPack {
    credits_pack: ArtcraftCreditsPackSlug,
  },
  CustomerPortalCancel,
  CustomerPortalUpdate,
}

pub async fn open_storyteller_billing_window(
  args: OpenStorytellerBillingWindowArgs<'_>,
) -> AnyhowResult<()> {

  if args.app.get_window(BILLING_WINDOW_NAME).is_some() {
    return Err(anyhow!("Billing window already open"));
  }

  info!("Building Stripe Checkout session...");

  let creds = args.storyteller_creds_manager.get_credentials_required()?;

  let checkout_url = match args.billing_window_case {
    BillingWindowCase::Subscription { plan, cadence } => {
      get_subscription_url(
        args.app_env_configs,
        &creds,
        plan,
        cadence,
      ).await?
    },
    BillingWindowCase::CreditsPack { credits_pack } => {
      get_credits_pack_url(
        args.app_env_configs,
        &creds,
        credits_pack,
      ).await?
    },
    BillingWindowCase::CustomerPortalCancel => {
      get_customer_portal_url(
        args.app_env_configs,
        &creds,
        StripeArtcraftCreateCustomerPortalFlowState::SubscriptionCancel,
      ).await?
    },
    BillingWindowCase::CustomerPortalUpdate => {
      get_customer_portal_url(
        args.app_env_configs,
        &creds,
        StripeArtcraftCreateCustomerPortalFlowState::SubscriptionUpdate,
      ).await?
    },
  };

  do_open_window(args.app, args.app_data_root, checkout_url).await?;

  Ok(())
}

async fn get_subscription_url(
  app_env_configs: &AppEnvConfigs,
  storyteller_creds: &StorytellerCredentialSet,
  plan: ArtcraftSubscriptionSlug,
  cadence: PlanBillingCadence,
) -> AnyhowResult<Url> {

  info!("Getting URL for subscription checkout...");

  let request = StripeArtcraftCreateSubscriptionCheckoutRequest {
    plan: Some(plan),
    cadence: Some(cadence),
  };

  let result = create_subscription_checkout(
    &app_env_configs.storyteller_host,
    Some(&storyteller_creds),
    request,
  ).await?;

  info!("Checkout session created...");

  let url = Url::parse(&result.stripe_checkout_redirect_url)?;
  Ok(url)
}

async fn get_credits_pack_url(
  app_env_configs: &AppEnvConfigs,
  storyteller_creds: &StorytellerCredentialSet,
  credits_pack: ArtcraftCreditsPackSlug,
) -> AnyhowResult<Url> {

  info!("Getting URL for credits pack checkout...");

  let request = StripeArtcraftCreateCreditsPackCheckoutRequest {
    credits_pack: Some(credits_pack),
  };

  let result = create_credits_pack_checkout(
    &app_env_configs.storyteller_host,
    Some(&storyteller_creds),
    request,
  ).await?;

  info!("Credits pack checkout session created...");
  Ok(Url::parse(&result.stripe_checkout_redirect_url)?)
}


async fn get_customer_portal_url(
  app_env_configs: &AppEnvConfigs,
  storyteller_creds: &StorytellerCredentialSet,
  flow_state: StripeArtcraftCreateCustomerPortalFlowState,
) -> AnyhowResult<Url> {

  info!("Getting customer portal session for flow {:?} ...", flow_state);

  let request = StripeArtcraftCreateCustomerPortalSessionRequest {
    portal_config_id: None,
    flow: Some(flow_state),
  };

  let result = create_customer_portal_session(
    &app_env_configs.storyteller_host,
    Some(&storyteller_creds),
    request,
  ).await?;

  info!("Customer portal session created...");
  Ok(Url::parse(&result.stripe_portal_url)?)
}

async fn do_open_window(
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  url: Url,
) -> AnyhowResult<()> {
  let url = WebviewUrl::External(url);

  info!("Opening checkout window...");

  // TODO(bt,2025-09-01): We probably need to open this in a real browser to get autocomplete.
  let _window = WebviewWindowBuilder::new(app, BILLING_WINDOW_NAME, url)
      .always_on_top(false)
      .title("ArtCraft Billing")
      .center()
      .resizable(true)
      .visible(true)
      .closable(true)
      .min_inner_size(1000.0, 800.0)
      .focused(true)
      .devtools(true)
      .build()?;

  //let _webview = window.get_webview(BILLING_WINDOW_NAME)
  //    .ok_or_else(|| anyhow!("no webview found"))?;

  let app_handle = app.clone();
  let app_data_root = app_data_root.clone();

  let _ = tauri::async_runtime::spawn(async move {
    storyteller_billing_window_thread(app_handle, app_data_root).await;
  });

  Ok(())
}
