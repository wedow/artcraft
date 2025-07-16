use crate::core::state::window::main_window_position::MainWindowPosition;
use crate::core::windows::main_window::constants::MAIN_WINDOW_NAME;
use errors::AnyhowResult;
use tauri::{AppHandle, Manager, PhysicalPosition};

pub fn position_main_window(
  app: &AppHandle,
  position: &MainWindowPosition,
) -> AnyhowResult<()> {
  
  let windows = app.windows();
  let window = windows.get(MAIN_WINDOW_NAME)
      .ok_or_else(|| anyhow::anyhow!("Main window not found"))?;
  
  window.set_position(PhysicalPosition::new(position.x, position.y))?;
  
  Ok(())
}