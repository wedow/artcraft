
pub const DEFAULT_INVESTOR_REDIRECT : &str = "https://fakeyou.com";

pub fn redirect_is_allowed(redirect_url: &str) -> bool {
  match redirect_url {
    "http://jungle.horse" => true,
    "http://jungle.horse/" => true,
    "https://create.storyteller.io" => true,
    "https://create.storyteller.io/" => true,
    "https://fakeyou.com" => true,
    "https://fakeyou.com/clone" => true,
    "https://jungle.horse" => true,
    "https://jungle.horse/" => true,
    "https://storyteller.io" => true,
    "https://storyteller.io/" => true,
    _ => false,
  }
}
