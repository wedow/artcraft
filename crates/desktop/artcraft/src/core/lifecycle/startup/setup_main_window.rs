use crate::core::windows::main_window::constants::MAIN_WINDOW_NAME;
use errors::AnyhowResult;
use tauri::window::Color;
use tauri::{AppHandle, TitleBarStyle, WebviewUrl, WebviewWindowBuilder};

pub async fn setup_main_window(
  app: &AppHandle,
) -> AnyhowResult<()> {

  let win_builder =
      WebviewWindowBuilder::new(app, MAIN_WINDOW_NAME, WebviewUrl::default())
          .title("ArtCraft")
          .resizable(true)
          .fullscreen(false)
          .background_color(Color(0, 0, 0, 0))
          .enable_clipboard_access()
          .inner_size(2400.0, 1300.0);

  #[cfg(target_os = "macos")]
  let win_builder = win_builder
      .decorations(true) // NB: Mac requires decorations. Tons of capabilities disappear otherwise.
      .title_bar_style(TitleBarStyle::Overlay)
      .hidden_title(true)
      .accept_first_mouse(true) // https://github.com/tauri-apps/tauri/issues/11605#issuecomment-2460112096
      .focusable(true)
      .focused(true);

  #[cfg(not(target_os = "macos"))]
  let win_builder = win_builder
      .decorations(false); // NB: This breaks Mac!

  #[cfg(target_os = "windows")]
  let win_builder = win_builder
      .drag_and_drop(false); // TODO: Is this necessary on Windows?

  let _window = win_builder.build()?;

  Ok(())
}