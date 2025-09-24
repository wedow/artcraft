// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use crate::queries::users::user::create::create_account_error::CreateAccountError;
use crate::utils::transactor::Transactor;
use enums::by_table::users::user_signup_method::UserSignupMethod;
use enums::by_table::users::user_signup_source::UserSignupSource;
use log::warn;
use sqlx::error::Error::Database;
use tokens::tokens::users::UserToken;

pub struct GenericCreateAccountArgs<'a> {
  pub username: &'a str,
  pub display_name: &'a str,

  /// If we randomly generated the username
  pub username_is_generated: bool,

  /// If the user hasn't changed or "accepted" a randomly generated username
  pub username_is_not_customized: bool,

  pub email_address: &'a str,
  pub email_gravatar_hash: &'a str,
  pub email_confirmed_by_google: bool,

  pub password_hash: &'a str,
  pub is_without_password: bool,

  pub ip_address: &'a str,
  pub maybe_source: Option<UserSignupSource>,
  pub maybe_signup_method: Option<UserSignupMethod>,

  /// Comma separated string of feature flags.
  pub maybe_feature_flags: Option<&'a str>,

  /// In production code, send this as `None`.
  /// Only provide an external user token for db integration tests and db seeding tools.
  /// This allows for knowing the user token a priori.
  pub maybe_user_token: Option<&'a UserToken>,
}


pub struct CreateAccountSuccessResult {
  pub user_token: UserToken,
  pub user_id: u64,
}

pub async fn create_account_generic(
  args: GenericCreateAccountArgs<'_>,
  transactor: Transactor<'_, '_>,
) -> Result<CreateAccountSuccessResult, CreateAccountError>
{
  const INITIAL_PROFILE_MARKDOWN : &str = "";
  const INITIAL_PROFILE_RENDERED_HTML : &str = "";
  const INITIAL_USER_ROLE: &str = "user";

  let user_token = match args.maybe_user_token {
    None => UserToken::generate(),
    Some(user_token) => user_token.clone(),
  };

  let query = sqlx::query!(
        r#"
INSERT INTO users
SET
  token = ?,
  username = ?,
  display_name = ?,

  username_is_generated = ?,
  username_is_not_customized = ?,

  email_address = ?,
  email_gravatar_hash = ?,

  email_confirmed = FALSE,
  email_confirmed_by_google = ?,

  profile_markdown = ?,
  profile_rendered_html = ?,
  user_role_slug = ?,

  password_hash = ?,
  is_without_password = ?,

  maybe_feature_flags = ?,

  ip_address_creation = ?,
  ip_address_last_login = ?,
  ip_address_last_update = ?,

  maybe_source = ?,

  maybe_signup_method = ?
        "#,
      user_token.as_str(),
      args.username,
      args.display_name,

      args.username_is_generated,
      args.username_is_not_customized,

      args.email_address,
      args.email_gravatar_hash,

      args.email_confirmed_by_google,

      INITIAL_PROFILE_MARKDOWN,
      INITIAL_PROFILE_RENDERED_HTML,
      INITIAL_USER_ROLE,

      args.password_hash,
      args.is_without_password,

      args.maybe_feature_flags,

      args.ip_address,
      args.ip_address,
      args.ip_address,

      args.maybe_source.map(|s| s.to_str()),
      args.maybe_signup_method.map(|m| m.to_str()),
    );


  let query_result = transactor.execute(query).await;

  let record_id = match query_result {
    Ok(res) => {
      res.last_insert_id()
    },
    Err(err) => {
      warn!("New user creation DB error: {:?}", err);

      // NB: SQLSTATE[23000]: Integrity constraint violation
      // NB: MySQL Error Code 1062: Duplicate key insertion (this is harder to access)
      match err {
        Database(err) => {
          let maybe_code = err.code().map(|c| c.into_owned());
          match maybe_code.as_deref() {
            Some("23000") => {
              if err.message().contains("username") {
                return Err(CreateAccountError::UsernameIsTaken);
              } else if err.message().contains("email_address") {
                return Err(CreateAccountError::EmailIsTaken);
              }
            }
            _ => {},
          }
        },
        _ => {},
      }
      return Err(CreateAccountError::DatabaseError);
    }
  };

  Ok(CreateAccountSuccessResult {
    user_token,
    user_id: record_id,
  })
}
