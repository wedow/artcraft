use sqlx::mysql::MySqlRow;
use sqlx::{FromRow, MySql, MySqlPool, QueryBuilder, Row};
use tokens::tokens::media_files::MediaFileToken;
use tokens::traits::mysql_token_from_row::MySqlTokenFromRow;

#[test]
fn test_that_this_compiles() {
  // This test only exists as an integration test with the package.
  // When we do upgrades of SQLx, the binding between sqlx, our macros,
  // and our code can break down. Having this thin use case helps us
  // deal with migration difficulties.
  //
  // Unfortunately this code requires access to a database or cached queries to compile, so
  // we may want to rethink this strategy in the future.
  assert_eq!(1, 1);
}

pub async fn test_query(mysql_pool: &MySqlPool) {
  let mut query = query_builder();
  let query = query.build_query_as::<MediaFileListItemInternal>();
  let _results = query.fetch_all(mysql_pool).await;
}

fn query_builder<'a>() -> QueryBuilder<'a, MySql> {
  // NB: Query cannot be statically checked by sqlx
  let mut query_builder: QueryBuilder<MySql> = QueryBuilder::new(
    r#"
SELECT
    m.id,
    m.token
FROM media_files AS m
LEFT OUTER JOIN users AS u
    ON m.maybe_creator_user_token = u.token
LEFT OUTER JOIN model_weights as w
     ON m.maybe_origin_model_token = w.token
LEFT OUTER JOIN media_files as media_file_cover_image
    ON media_file_cover_image.token = m.maybe_cover_image_media_file_token
LEFT OUTER JOIN entity_stats
    ON entity_stats.entity_type = "media_file"
    AND entity_stats.entity_token = m.token
LEFT OUTER JOIN prompts
    ON prompts.token = m.maybe_prompt_token
    "#
  );

  query_builder
}

struct MediaFileListItemInternal {
  id: i64,
  token: MediaFileToken,
}

// NB(bt,2023-12-05): There's an issue with type hinting in the `as` clauses with QueryBuilder (or
// raw query strings) and sqlx::FromRow, regardless of whether it is derived of manually
// implemented. Perhaps this will improve in the future, but for now manually constructed queries
// cannot have type hints, eg. the following:
//
//    m.token as `token: tokens::tokens::media_files::MediaFileToken`,
//    m.origin_category as `origin_category: enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory`,
//    m.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,
//
// This results in the automatic mapping not being able to be found by name (for macro derive), and
// in the manual case `row.try_get()` etc. won't have the correct column name (since the name is the
// full "as" clause).
impl FromRow<'_, MySqlRow> for MediaFileListItemInternal {
  fn from_row(row: &MySqlRow) -> Result<Self, sqlx::Error> {
    Ok(Self {
      id: row.try_get("id")?,
      token: MediaFileToken::try_from_mysql_row(row, "media_class")?,
    })
  }
}
