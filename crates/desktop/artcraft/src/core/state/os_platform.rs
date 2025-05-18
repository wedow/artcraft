
#[derive(Copy,Clone,Eq,PartialEq,Debug)]
pub enum OsPlatform {
  Linux,
  MacOs,
  Windows,
}

impl OsPlatform {
  pub fn maybe_get() -> Option<Self> {
    // Totally scientific.
    // https://doc.rust-lang.org/std/env/consts/constant.OS.html
    match std::env::consts::OS {
      "linux" => Some(Self::Linux),
      "windows" => Some(Self::Windows),
      "macos" | "apple" => Some(Self::MacOs),
      _ => None,
    }
  }

  pub fn get() -> Self {
    Self::maybe_get().unwrap_or(Self::Linux)
  }
}
