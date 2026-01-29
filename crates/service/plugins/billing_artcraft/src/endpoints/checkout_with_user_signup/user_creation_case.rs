use crate::utils::artcraft_stripe_config::ArtcraftStripeConfigWithClient;
use crate::utils::common_web_error::CommonWebError;
use actix_artcraft::requests::get_request_signup_source_enum::get_request_signup_source_enum;
use actix_web::HttpRequest;
use http_server_common::request::get_request_ip::get_request_ip;
use log::{info, warn};
use mysql_queries::queries::users::user::create::create_account_error::CreateAccountError;
use mysql_queries::queries::users::user::create::create_account_from_google_sso::{create_account_from_google_sso, CreateAccountFromGoogleSsoArgs};
use mysql_queries::utils::transactor::Transactor;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use stripe_shared::CheckoutSession;
use enums::by_table::users::user_feature_flag::UserFeatureFlag;
use users::email::email_to_gravatar::email_to_gravatar;
use users::email::generate_random_synthetic_email::generate_random_synthetic_email;
use users::username::generate_random_username::generate_random_username;

pub (super) async fn user_creation_case(
  http_request: &HttpRequest,
  price_id: &str,
  mysql_connection: &mut PoolConnection<MySql>,
  stripe_config: &ArtcraftStripeConfigWithClient,
) -> Result<CheckoutSession, CommonWebError> {

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

  let mut maybe_user_token = None;
  let mut maybe_user_display_name = None;

  for _ in 0..3 {
    // NB: We try a few times to make sure we don't hit an email/username collision.

    let user_email_address = generate_random_synthetic_email();
    let user_email_gravatar_hash = email_to_gravatar(&user_email_address);
    
    let display_name = generate_random_username();
    let username = display_name.trim().to_lowercase();

    info!("generated username: {} ; generated email: {}", username, user_email_address);

    let result = create_account_from_google_sso(
      CreateAccountFromGoogleSsoArgs {
        username: &username,
        display_name: &display_name,
        email_address: &user_email_address,
        email_gravatar_hash: &user_email_gravatar_hash,
        email_confirmed_by_google: args.claims.email_verified(),
        maybe_feature_flags: Some(&user_feature_flags),
        ip_address: &ip_address,
        maybe_source,
      },
      Transactor::for_transaction(&mut transaction),
    ).await;

    match result {
      Ok(token) => {
        maybe_user_token = Some(token);
        maybe_user_display_name = Some(display_name);
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




  Ok(())
}
