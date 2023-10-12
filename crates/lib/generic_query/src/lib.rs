pub trait PaginatedQueryBuilders {
  fn scope_creator_username(self, scope_creator_username: Option<String>) -> Self;
  fn include_user_hidden(self, include_user_hidden: bool) -> Self;
  fn include_mod_deleted_results(self, include_mod_deleted_results: bool) -> Self;
  fn include_user_deleted_results(self, include_user_deleted_results: bool) -> Self;
  fn sort_ascending(self, sort_ascending: bool) -> Self;
  fn offset(self, offset: Option<u64>) -> Self;
  fn limit(self, limit: u16) -> Self;
  fn cursor_is_reversed(self, cursor_is_reversed: bool) -> Self;
}
