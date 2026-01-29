use actix_web::HttpRequest;
use log::{info, warn};
use crate::utils::artcraft_stripe_config::ArtcraftStripeConfigWithClient;
use crate::utils::common_web_error::CommonWebError;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use stripe_shared::CheckoutSession;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::users::user::create::create_account_error::CreateAccountError;
use mysql_queries::queries::users::user::create::create_account_from_google_sso::{create_account_from_google_sso, CreateAccountFromGoogleSsoArgs};
use mysql_queries::utils::transactor::Transactor;
use users::email::email_to_gravatar::email_to_gravatar;
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
        GoogleCreateAccountErrorResponse::server_error()
      })?;


  let ip_address = get_request_ip(&http_request);
  let maybe_source = get_request_signup_source_enum(&http_request);

  let mut maybe_user_token = None;
  let mut maybe_user_display_name = None;

  for _ in 0..3 {
    let user_email_address = "todo@todo.com";
    let user_email_gravatar_hash = email_to_gravatar(&user_email_address);
    
    // NB: We try a few times to make sure we don't hit a username collision.
    let display_name = generate_random_username();
    let username = display_name.trim().to_lowercase();

    info!("generated username: {}", username);

    let result = create_account_from_google_sso(
      CreateAccountFromGoogleSsoArgs {
        username: &username,
        display_name: &display_name,
        email_address: &args.user_email_address,
        email_gravatar_hash: &user_email_gravatar_hash,
        email_confirmed_by_google: args.claims.email_verified(),
        maybe_feature_flags: user_feature_flags.as_deref(),
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
        return Err(GoogleCreateAccountErrorResponse::server_error());
      },
    }
  }




  Ok(())
}
