use crate::core::state::window::main_window_size::MainWindowSize;
use crate::core::windows::main_window::constants::{MAIN_WINDOW_MIN_HEIGHT, MAIN_WINDOW_MIN_WIDTH, MAIN_WINDOW_NAME};
use tauri::{AppHandle, Manager, PhysicalSize};

/// Try to resize the main window at startup.
/// If it doesn't meet certain sizing heuristics, abandon manual resize and let the OS
/// decide how to size the app.
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


  if let Ok(Some(monitor)) = window.current_monitor() {
    let scale_factor = monitor.scale_factor();

    if scale_factor > 1.0 {

      let min_width = MAIN_WINDOW_MIN_WIDTH as f64 * scale_factor;
      let min_height = MAIN_WINDOW_MIN_HEIGHT as f64 * scale_factor;

      // Is this safe? https://users.rust-lang.org/t/convert-an-f64-to-an-i32/50991/4
      let min_width = min_width as u32;
      let min_height = min_height as u32;

      if size.width < min_width {
        return Err(anyhow::anyhow!("Width must be at least {} (given scale factor {})",
          min_width, scale_factor));
      } else if size.height < min_height {
        return Err(anyhow::anyhow!("Height must be at least {} (given scale factor {})",
          min_height, scale_factor));
      }
    }
  }

  window.set_size(PhysicalSize::new(size.width, size.height))?;

  Ok(())
}