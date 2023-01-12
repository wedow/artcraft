/// Anonymous visitor tokens
///
/// Used as a cookie and database column,
/// to preserve visitor results when they 
/// start off as an anonymous user, and later create an account

use crate::prefixes::EntityType;
use serde::Deserialize;
use serde::Serialize;
use std::fmt::Debug;


#[derive(Clone, PartialEq, Eq, sqlx::Type, Debug, Serialize, Deserialize)]
#[sqlx(transparent)]
pub struct AnonymousVisitorToken(pub String);

impl_string_token!(AnonymousVisitorToken);
impl_crockford_generator!(AnonymousVisitorToken, 32usize, EntityType::Avt, CrockfordMixed);

