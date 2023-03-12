use log::info;
use log::warn;
use std::fs;
use std::path::Path;

pub fn safe_delete_temp_file<P: AsRef<Path>>(file_path: P) {
  // NB: We should be using a tempdir, but to make absolutely certain we don't overflow the disk...
  let printable_name = file_path.as_ref().to_str().unwrap_or("bad filename");
  match fs::remove_file(&file_path) {
    Ok(_) => info!("Temp file deleted: {}", printable_name),
    Err(e) => warn!("Could not delete temp file {:?} (not a fatal error): {:?}",
                    printable_name, e),
  }
}
