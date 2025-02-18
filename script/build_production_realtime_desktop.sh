#!/usr/bin/env bash

# Tauri doesn't let you configure the frontend project directory statically, though they do provide an
# environment variable to pass it to the CLI. Without doing this, the tauri cli randomly walks the
# filesystem and finds the wrong frontend code.

# TODO(bt,2025-02-13): This is not the correct way to get the root dir
root_dir=$(pwd)
export TAURI_FRONTEND_PATH="${root_dir}/frontend/realtime"

cargo tauri build

