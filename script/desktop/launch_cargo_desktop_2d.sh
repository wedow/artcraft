#!/usr/bin/env bash

set -euxo pipefail

# Tauri CLI is being bad-behaved, so just run via cargo.
# NX will need to launch the frontend separately.
cargo build --bin tauri-artcraft

./target/debug/tauri-artcraft

# # Kill any process running on port 5741, which will block startup
# if lsof -i tcp:5741 &>/dev/null; then
#   lsof -i tcp:5741 -t | xargs kill -9
#   echo "Killed process running on port 5741"
# else
#   echo "No process running on port 5741"
# fi
# 
# # TODO(bt,2025-02-13): This is not the correct way to get the root dir
# root_dir=$(pwd)
# frontend_path="${root_dir}/frontend"
# 
# pushd "${frontend_path}"
# 
# #nvm use stable
# npm install
# popd
# 
# # Tauri doesn't let you configure the frontend project directory statically, though they do provide an
# # environment variable to pass it to the CLI. Without doing this, the tauri cli randomly walks the
# # filesystem and finds the wrong frontend code.
# 
# export TAURI_FRONTEND_PATH="${frontend_path}"
# export TAURI_APP_PATH="${root_dir}/crates/desktop/tauri-artcraft"
# 
# export CONFIG_PATH="${TAURI_APP_PATH}/tauri.artcraft_2d.conf.toml"
# 
# # TODO: --no-watch
# cargo tauri dev --config "${CONFIG_PATH}"

