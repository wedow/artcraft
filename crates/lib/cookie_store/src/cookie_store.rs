use crate::cookie::Cookie;
use crate::serialized_cookie_store::{SerializableCookieStore, SerializedCookie};
use std::collections::HashMap;

#[derive(Clone)]
pub struct CookieStore {
  // TODO: This doesn't yet handle partial paths, subdomain rules, etc.
  pub cookies: HashMap<String, Cookie>,
}

impl CookieStore {
  pub fn empty() -> Self {
    Self {
      cookies: HashMap::new(),
    }
  }

  pub fn add_cookie(&mut self, cookie: Cookie) {
    self.cookies.insert(cookie.name.clone(), cookie);
  }
  
  pub fn add_cookie_name_and_value(&mut self, name: String, value: String) {
    self.add_cookie(Cookie {
      name,
      value,
    });
  }

  pub fn get_cookie(&self, name: &str) -> Option<&Cookie> {
    self.cookies.get(name)
  }

  pub fn remove_cookie(&mut self, name: &str) {
    self.cookies.remove(name);
  }

  pub fn clear_all(&mut self) {
    self.cookies.clear();
  }

  pub fn to_cookie_string(&self) -> String {
    self
      .cookies
      .values()
      .map(|cookie| format!("{}={}", cookie.name, cookie.value))
      .collect::<Vec<String>>()
      .join("; ")
  }

  pub fn to_serializable(&self) -> SerializableCookieStore {
    let cookies = self
      .cookies
      .values()
      .map(|cookie| SerializedCookie {
        name: cookie.name.clone(),
        value: cookie.value.clone(),
      })
      .collect();
    SerializableCookieStore { cookies }
  }
}
