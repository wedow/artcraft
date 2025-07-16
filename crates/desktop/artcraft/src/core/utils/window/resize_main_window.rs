use crate::core::state::window::main_window_size::MainWindowSize;
use crate::core::windows::main_window::constants::{MAIN_WINDOW_MIN_HEIGHT, MAIN_WINDOW_MIN_WIDTH, MAIN_WINDOW_NAME};
use tauri::{AppHandle, Manager, PhysicalSize};

pub fn resize_main_window(
  app: &AppHandle,
  size: &MainWindowSize,
) -> errors::AnyhowResult<()> {

  if size.width < MAIN_WINDOW_MIN_WIDTH {
    return Err(anyhow::anyhow!("Width must be at least {}", MAIN_WINDOW_MIN_WIDTH));
  } else if size.height < MAIN_WINDOW_MIN_HEIGHT {
    return Err(anyhow::anyhow!("Height must be at least {}", MAIN_WINDOW_MIN_HEIGHT));
  }
  
  let windows = app.windows();
  let window = windows.get(MAIN_WINDOW_NAME)
      .ok_or_else(|| anyhow::anyhow!("Main window not found"))?;
  
  window.set_size(PhysicalSize::new(size.width, size.height))?;
  
  Ok(())
}