#!/bin/bash
set +e +o pipefail
diesel migration run --database-url="${MYSQL_URL}"
set -e -o pipefail
./target/x86_64-unknown-linux-musl/release/storyteller-web

