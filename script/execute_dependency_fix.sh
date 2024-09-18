#!/bin/bash

set -euxo pipefail

echo 'Updating and checking hakari (dependency graph build optimization)'

cargo hakari generate
cargo hakari manage-deps
cargo hakari verify

echo 'Looking for unused dependencies'

# https://github.com/est31/cargo-udeps
# https://stackoverflow.com/a/72082679
# Needs nightly to run
cargo +nightly udeps --all-targets

# TODO(bt,2024-09-17): Solve this issue:
#   error: rustc 1.80.0-nightly is not supported by the following package:
#   parse-size@1.1.0 requires rustc 1.81.0
#   Either upgrade rustc or select compatible dependency versions with
#   `cargo update <name>@<current-ver> --precise <compatible-ver>`
#   where `<compatible-ver>` is the latest version supporting rustc 1.80.0-nightly

# TODO: Ask for user input before applying some automated heuristics

echo 'Done.'

