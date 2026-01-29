use std::collections::HashMap;
use crate::utils::artcraft_stripe_config::ArtcraftStripeConfigWithClient;
use crate::utils::common_web_error::CommonWebError;
use actix_artcraft::requests::get_request_signup_source_enum::get_request_signup_source_enum;
use actix_web::HttpRequest;
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::queries::users::user::create::create_account_error::CreateAccountError;
use mysql_queries::queries::users::user::create::create_account_from_google_sso::{create_account_from_google_sso, CreateAccountFromGoogleSsoArgs};
use mysql_queries::utils::transactor::Transactor;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use stripe_checkout::checkout_session::{CreateCheckoutSession, CreateCheckoutSessionAutomaticTax, CreateCheckoutSessionLineItems, CreateCheckoutSessionSavedPaymentMethodOptions, CreateCheckoutSessionSavedPaymentMethodOptionsAllowRedisplayFilters, CreateCheckoutSessionSavedPaymentMethodOptionsPaymentMethodSave, CreateCheckoutSessionSubscriptionData};
use stripe_shared::{CheckoutSession, CheckoutSessionMode};
use enums::by_table::users::user_feature_flag::UserFeatureFlag;
use mysql_queries::queries::users::user::create::create_account_from_stripe_checkout::{create_account_from_stripe_checkout, CreateAccountFromStripeCheckoutArgs};
use users::email::email_to_gravatar::email_to_gravatar;
use users::email::generate_random_synthetic_email::generate_random_synthetic_email;
use users::username::generate_random_username::generate_random_username;
use crate::configs::stripe_artcraft_metadata_keys::{STRIPE_ARTCRAFT_METADATA_EMAIL, STRIPE_ARTCRAFT_METADATA_USERNAME, STRIPE_ARTCRAFT_METADATA_USER_TOKEN};
use crate::endpoints::checkout_with_user_signup::creation_payload::{CreationPayload, UserMetadata};

pub (super) async fn user_creation_case(
  http_request: &HttpRequest,
  price_id: &str,
  mysql_connection: &mut PoolConnection<MySql>,
  stripe_config: &ArtcraftStripeConfigWithClient,
) -> Result<CreationPayload, CommonWebError> {

  let mut transaction = args.mysql_connection.begin()
      .await
      .map_err(|e| {
        warn!("Could not begin transaction: {:?}", e);
        CommonWebError::ServerError
      })?;

  let ip_address = get_request_ip(&http_request);
  let maybe_source = get_request_signup_source_enum(&http_request);

  // NB: Not sure if these lock important functionality, so we're keeping this
  let user_feature_flags = vec![
    UserFeatureFlag::Studio,
    UserFeatureFlag::VideoStyleTransfer,
  ].into_iter()
      .map(|flag| flag.to_string())
      .collect::<Vec<String>>()
      .join(",");

  let final_user_token;
  let final_username;
  let final_display_name;
  let final_email_address;

  for _ in 0..3 {
    // NB: We try a few times to make sure we don't hit an email/username collision.

    let user_email_address = generate_random_synthetic_email();
    let user_email_gravatar_hash = email_to_gravatar(&user_email_address);
    
    let display_name = generate_random_username();
    let username = display_name.trim().to_lowercase();

    info!("generated username: {} ; generated email: {}", username, user_email_address);

    let result = create_account_from_stripe_checkout(
      CreateAccountFromStripeCheckoutArgs {
        username: &username,
        display_name: &display_name,
        email_address: &user_email_address,
        email_gravatar_hash: &user_email_gravatar_hash,
        maybe_feature_flags: Some(&user_feature_flags),
        ip_address: &ip_address,
        maybe_source,
      },
      Transactor::for_transaction(&mut transaction),
    ).await;

    match result {
      Ok(token) => {
        final_user_token = token;
        final_username = username;
        final_display_name = display_name;
        final_email_address = user_email_address;
        break;
      },
      Err(CreateAccountError::UsernameIsTaken) => {
        continue; // NB: We'll try again with a new username.
      },
      Err(err) => {
        warn!("error creating account from google sso: {:?}", err);
        return Err(CommonWebError::ServerError);
      },
    }
  }

  let success_url = stripe_config.checkout_success_url.clone();
  let cancel_url = stripe_config.checkout_cancel_url.clone();

  let checkout_session = {
    // `client_reference_id`
    // Stripe Docs:
    //   A unique string to reference the Checkout Session.
    //   This can be a customer ID, a cart ID, or similar, and can be used to reconcile the session
    //   with your internal systems.
    //
    // Our Notes:
    //   This gets reported back in the Checkout Session (and related webhooks) as
    //   `client_reference_id`. Passing the same ID on multiple checkouts does not unify or
    //   cross-correlate customers and only seems to be metadata for the checkout session itself.
    //   This is probably only useful for tracking checkout session engagement.
    //params.client_reference_id = Some("SOME_INTERNAL_ID");

    // `customer_email`
    // Stripe Docs:
    //   If provided, this value will be used when the Customer object is created. If not provided,
    //   customers will be asked to enter their email address. Use this parameter to prefill
    //   customer data if you already have an email on file. To access information about the
    //   customer once a session is complete, use the customer field.
    //
    // Our Notes:
    //   This does not look up previous customers with the same email and will not unify or
    //   cross-correlate customers. By default the field will be un-editable in the checkout flow
    //   if this is specified.
    //params.customer_email = Some("email@example.com");

    let mut metadata = HashMap::new();

    // NB: We don't insert email or username as these are synthetic.
    metadata.insert(STRIPE_ARTCRAFT_METADATA_USER_TOKEN.to_string(), final_user_token.to_string());

    let mut checkout_builder = CreateCheckoutSession::new()
        .success_url(&success_url)
        .cancel_url(&cancel_url)
        .mode(CheckoutSessionMode::Subscription)
        .line_items(vec![
          CreateCheckoutSessionLineItems {
            price: Some(price_id.to_string()),
            quantity: Some(1),
            ..Default::default()
          }
        ])
        .saved_payment_method_options(CreateCheckoutSessionSavedPaymentMethodOptions {
          allow_redisplay_filters: Some(vec![
            CreateCheckoutSessionSavedPaymentMethodOptionsAllowRedisplayFilters::Always,
            CreateCheckoutSessionSavedPaymentMethodOptionsAllowRedisplayFilters::Limited,
            CreateCheckoutSessionSavedPaymentMethodOptionsAllowRedisplayFilters::Unspecified,
          ]),
          // The user can choose to tick a checkbox that saves their card for redisplay later.
          payment_method_save: Some(CreateCheckoutSessionSavedPaymentMethodOptionsPaymentMethodSave::Enabled),
        })
        .allow_promotion_codes(true) // Allow promo codes / coupons
        .automatic_tax(CreateCheckoutSessionAutomaticTax {
          enabled: true, // This will ask for the customer's location
          liability: None,
        })
        .metadata(metadata.clone())
        .subscription_data(CreateCheckoutSessionSubscriptionData {
          metadata: Some(metadata),
          ..Default::default()
        })
        ;

    let checkout_session = checkout_builder
        .send(&stripe_config.client)
        .await
        .map_err(|err| {
          error!("Stripe Error: {:?}", err);
          CommonWebError::ServerError
        })?;

    checkout_session
  };

  Ok(CreationPayload {
    checkout_session,
    maybe_user_metadata: Some(UserMetadata {
      user_token: final_user_token,
      username: final_username,
      display_name: final_display_name,
      email_address: final_email_address,
    })
  })
}
