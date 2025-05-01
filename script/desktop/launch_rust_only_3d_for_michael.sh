#!/usr/bin/env bash

set -euxo pipefail

# Kill any process running on port 5741, which will block startup
if lsof -i tcp:5173 &>/dev/null; then
  lsof -i tcp:5173 -t | xargs kill -9
  echo "Killed process running on port 5173"
else
  echo "No process running on port 5173"
fi

root_dir=$(pwd)
frontend_path="${root_dir}/frontend"
rust_crate_path="${root_dir}/crates/desktop/tauri-artcraft"

# The tauri dev server integration is super annoying: It eats ctrl-c interrupts, 
# it decoheres the and corrupts terminal output, and it's slow. This configuration
# allows us to start without it. Simply launch `nx` and the dev server as a separate
# process and leave tauri out of the loop
config_path="${rust_crate_path}/tauri.artcraft_3d.no_dev.conf.toml"

export TAURI_FRONTEND_PATH="${frontend_path}"
export TAURI_APP_PATH="${rust_crate_path}"

# Launch nx dev editor3d in the background
(cd "$frontend_path" && npx nx dev editor3d &)

RUSTFLAGS="-Awarnings" cargo tauri dev --no-dev-server \
  --no-dev-server-wait \
  --no-watch \
  --config "${config_path}"


