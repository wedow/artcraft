use cookie_store::cookie_store::CookieStore;
use errors::AnyhowResult;
use once_cell::sync::Lazy;
use reqwest::Url;
use tauri::webview::Cookie;
use tauri::WebviewWindow;

const ROOT_COOKIE_URL_STR: &str = "https://midjourney.com";

static ROOT_COOKIE_URL: Lazy<Url> = Lazy::new(|| {
  Url::parse(ROOT_COOKIE_URL_STR).expect("URL should parse")
});

pub fn extract_midjourney_webview_cookies(webview: &WebviewWindow) -> AnyhowResult<CookieStore> {
  let mut cookie_store = CookieStore::empty();
  let cookies = get_all_midjourney_cookies(webview)?;
  for cookie in cookies.iter() {
    cookie_store.add_cookie_name_and_value(
      cookie.name().to_string(), 
      cookie.value().to_string(),
    );
  }
  Ok(cookie_store)
}

fn get_all_midjourney_cookies(webview: &WebviewWindow) -> AnyhowResult<Vec<Cookie>> {
  let cookies = webview.cookies_for_url(ROOT_COOKIE_URL.clone())?;
  Ok(cookies)
}
