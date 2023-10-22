use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::EntityType;

/// The primary key for `password_reset`s
#[derive(Clone, PartialEq, Eq, sqlx::Type, Debug, Serialize, Deserialize)]
#[sqlx(transparent)]
pub struct PasswordResetToken(pub String);

impl_string_token!(PasswordResetToken);
impl_crockford_generator!(PasswordResetToken, 32usize, EntityType::PasswordReset, CrockfordUpper);
