use crate::core::state::window::main_window_position::MainWindowPosition;
use crate::core::windows::main_window::constants::MAIN_WINDOW_NAME;
use errors::AnyhowResult;
use tauri::{AppHandle, Manager, PhysicalPosition};

pub fn position_main_window(
  app: &AppHandle,
  position: &MainWindowPosition,
) -> AnyhowResult<()> {

  // NB: This non-negative position heuristic is good for MacBook (single screen).
  // Not sure how this fares on Windows, Linux, or multiscreen setups.
  if position.x < 0 {
    return Err(anyhow::anyhow!("X position must be non-negative"));
  } else if position.y < 0 {
    return Err(anyhow::anyhow!("Y position must be non-negative"));
  }

  let windows = app.windows();
  let window = windows.get(MAIN_WINDOW_NAME)
      .ok_or_else(|| anyhow::anyhow!("Main window not found"))?;

  window.set_position(PhysicalPosition::new(position.x, position.y))?;

  Ok(())
}