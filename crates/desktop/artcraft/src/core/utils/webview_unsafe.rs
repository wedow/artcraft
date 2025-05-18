use errors::AnyhowResult;
use tauri::{AppHandle, Manager};

const MAIN_WINDOW_NAME: &str = "main";

pub fn webview_unsafe_for_app(app: &AppHandle) -> AnyhowResult<()> {
  let windows = app.windows();
  let maybe_window = windows.get(MAIN_WINDOW_NAME);
  
  /*if let Some(window) = maybe_window {
    let webview = window.get_webview(MAIN_WINDOW_NAME);
    if let Some(webview) = webview {
      webview_unsafe(&webview);
    }
  } else {
    return Err(anyhow::anyhow!("Main window not found"));
  }*/

  Ok(())
}

/*pub fn webview_unsafe(webview: &Webview) {
  let r = webview.with_webview(|webview| {
    webview.controller();
    #[cfg(target_os = "macos")]
    unsafe {
      let view: &objc2_web_kit::WKWebView = &*webview.inner().cast();
      let controller: &objc2_web_kit::WKUserContentController = &*webview.controller().cast();
      let window: &objc2_app_kit::NSWindow = &*webview.ns_window().cast();

      //view.setPageZoom(40.);
      //controller.removeAllUserScripts();
      let bg_color = objc2_app_kit::NSColor::colorWithDeviceRed_green_blue_alpha(1.0, 0.2, 0.4, 1.);
      window.setBackgroundColor(Some(&bg_color));
    }

  });
}*/
