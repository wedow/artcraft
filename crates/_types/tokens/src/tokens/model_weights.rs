use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::TokenPrefix;

/// The primary key for the  "model_weights" table.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, sqlx::Type, Debug, Serialize, Deserialize)]
#[sqlx(transparent)]
pub struct ModelWeightToken(pub String);

impl_string_token!(ModelWeightToken);
impl_crockford_generator!(ModelWeightToken, 32usize, TokenPrefix::ModelWeight, CrockfordLower);
