use std::env;
use std::env::VarError;

const RUST_LOG: &str = "RUST_LOG";

pub fn print_startup_debug_info() {
  print_env_var(RUST_LOG);
}

pub fn print_env_var(var_name: &str) {
  match env::var(var_name) {
    Ok(value) => println!("Environment variable `{}` = {}", var_name, value),
    Err(VarError::NotPresent) => println!("Environment variable `{}` is not set.", var_name),
    Err(VarError::NotUnicode(_)) => println!("Environment variable `{}` is not a valid Unicode string", var_name),
  }
}
