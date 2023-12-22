use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for Audit Logs.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, sqlx::Type, Debug, Serialize, Deserialize, ToSchema)]
#[sqlx(transparent)]
pub struct MediaFileToken(pub String);

impl_string_token!(MediaFileToken);
impl_crockford_generator!(MediaFileToken, 32usize, TokenPrefix::MediaFile, CrockfordLower);
