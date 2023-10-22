use anyhow::Context;
use sqlx::MySqlPool;

use errors::AnyhowResult;
use tokens::tokens::password_reset::PasswordResetToken;

use super::lookup_user_for_login_result::UserRecordForLogin;

// todo: ip_address_redemption nullable

pub async fn create_password_reset(pool: &MySqlPool, user: &UserRecordForLogin, ip_address: String, secret_key: String) -> AnyhowResult<()> {
    let token = PasswordResetToken::generate();

    sqlx::query!(
        r#"
INSERT INTO password_resets
(token, user_token, secret_key, current_password_version, ip_address_creation, expires_at)
VALUES (?, ?, ?, ?, ?, NOW() + INTERVAL 3 hour);
        "#,

        token,
        user.token,
        secret_key,
        user.password_version,
        ip_address
    )
    .execute(pool)
    .await
    .context("inserting password reset")
    .map(|_| ())
}