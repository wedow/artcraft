
/// Basic email format validation
pub fn validate_email_address_format(email: &str) -> Result<(), String> {
  let email = email.trim();

  if email.is_empty() {
    return Err("email address cannot be empty".to_string());
  }

  if email.len() > 255 {
    return Err("email address is too long".to_string());
  }

  // Basic format check: must contain exactly one @ with content on both sides
  let at_count = email.matches('@').count();
  if at_count != 1 {
    return Err("email address must contain exactly one @".to_string());
  }

  let parts: Vec<&str> = email.split('@').collect();
  if parts.len() != 2 {
    return Err("invalid email format".to_string());
  }

  let local = parts[0];
  let domain = parts[1];

  if local.is_empty() {
    return Err("email address must have content before @".to_string());
  }

  if domain.is_empty() {
    return Err("email address must have a domain after @".to_string());
  }

  // Domain must contain at least one dot
  if !domain.contains('.') {
    return Err("email domain must contain a dot".to_string());
  }

  // Domain cannot start or end with a dot
  if domain.starts_with('.') || domain.ends_with('.') {
    return Err("email domain cannot start or end with a dot".to_string());
  }

  Ok(())
}

#[cfg(test)]
mod tests {
  
  #[test]
  fn test_invalid_empty() {
  }
}