//use sqlx_mysql::MySqlRow;
use sqlx::mysql::MySqlRow;

// UPGRADE NOTES
//   sqlx 0.7.2 --> 0.8.2
//     - sqlx::Error --> sqlx_core::Error

/// This is a trait (in conjunction with the macro implementation) that makes up for sqlx's
/// QueryBuilder not playing well with FromRow implementation or derivation of named types.
pub trait MySqlTokenFromRow<T> {

  /// Attempt to parse a named column from a MySqlRow into the type.
  fn try_from_mysql_row(row: &MySqlRow, field_name: &str) -> Result<T, sqlx_core::Error>;

  fn try_from_mysql_row_nullable(row: &MySqlRow, field_name: &str) -> Result<Option<T>, sqlx_core::Error>;
}
