use tauri::{AppHandle, TitleBarStyle, WebviewUrl, WebviewWindowBuilder};
use tauri::window::Color;
use errors::AnyhowResult;

pub async fn setup_main_window(
  app: &AppHandle,
) -> AnyhowResult<()> {

  let win_builder =
      WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
          .title("Artcraft")
          //.decorations(false) // NB: This breaks Mac!
          .resizable(true)
          .fullscreen(false)
          .background_color(Color(0, 0, 0, 0))
          .enable_clipboard_access()
          .inner_size(800.0, 600.0);

  // set transparent title bar only when building for macOS
  #[cfg(target_os = "macos")]
  let win_builder = win_builder
      .decorations(true) // NB: Mac requires decorations. Tons of capabilities disappear without it.
      .title_bar_style(TitleBarStyle::Overlay)
      .hidden_title(true)
      .accept_first_mouse(true) // https://github.com/tauri-apps/tauri/issues/11605#issuecomment-2460112096
      .focusable(true)
      .focused(true);

  let window = win_builder.build()?;

  /*// set background color only when building for macOS
  #[cfg(target_os = "macos")]
  {
    use cocoa::appkit::{NSColor, NSWindow};
    use cocoa::base::{id, nil};

    let ns_window = window.ns_window().unwrap() as id;
    unsafe {
      let bg_color = NSColor::colorWithRed_green_blue_alpha_(
        nil,
        50.0 / 255.0,
        158.0 / 255.0,
        163.5 / 255.0,
        0.0,
      );
      ns_window.setBackgroundColor_(bg_color);
    }
  }*/

  Ok(())
}