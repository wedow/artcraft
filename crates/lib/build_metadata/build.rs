
fn main() {
  // Tell Cargo that if the given file changes, to rerun this build script.
  println!("cargo::rerun-if-changed=Cargo.toml");
  
  // Make build info available in the main crate sources.
  build_info_build::build_script();
}
