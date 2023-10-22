use tokens::tokens::users::UserToken;

/// Shared result type for user lookups for login (via email or username)
#[derive(Debug)]
pub struct UserRecordForLogin {
  pub token: UserToken,
  pub username: String,
  pub email_address: String,
  pub password_hash: Vec<u8>,
  pub is_banned: i8,
  pub password_version: i32,
}
