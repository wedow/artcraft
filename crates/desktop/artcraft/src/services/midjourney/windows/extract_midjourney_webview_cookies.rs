use errors::AnyhowResult;
use once_cell::sync::Lazy;
use reqwest::Url;
use tauri::webview::Cookie;
use tauri::WebviewWindow;

const ROOT_COOKIE_URL_STR: &str = "https://midjourney.com";

static ROOT_COOKIE_URL: Lazy<Url> = Lazy::new(|| {
  Url::parse(ROOT_COOKIE_URL_STR).expect("URL should parse")
});

pub fn extract_midjourney_webview_cookies(webview: &WebviewWindow) -> AnyhowResult<String> {
  // NB(bt): Cookies were originally on sora.com, but now they're located on 
  // the sora.chatgpt.com / *.chatgpt.com domains.
  let cookies = get_all_midjourney_cookies(webview)?;
  let cookie_string = cookies
    .iter()
    .map(|cookie| format!("{}={}", cookie.name(), cookie.value()))
    .collect::<Vec<String>>()
    .join("; ");
  Ok(cookie_string)
}

fn get_all_midjourney_cookies(webview: &WebviewWindow) -> AnyhowResult<Vec<Cookie>> {
  let cookies = webview.cookies_for_url(ROOT_COOKIE_URL.clone())?;
  Ok(cookies)
}
