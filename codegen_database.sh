#!/bin/bash

# NB: This format can be used without changing directory:
# SQLX_OFFLINE=true cargo sqlx prepare -- --bin storyteller-web --manifest-path crates/service/storyteller_web/Cargo.toml

set -euxo pipefail

# NB: Database used by desktop app for AiChatBot sidecar.
# Make sure it has been migrated (use aichatbot-sidecar app directory as root).
SQLITE_DATABASE_PATH=./runtime_data/database.db

# NB: OpenSSL is broken on Ubuntu 22.04 (this is documented elsewhere)
# See https://askubuntu.com/a/1403961
# For some reason, the choice of "rustls" or the vendored openssl is not persistent between calls.
#cargo install sqlx-cli --features openssl-vendored,mysql

build_shared_mysql_database_library() {
  # NB: For now, this is our monolithic DB that serves all of our microservices (gross)
  # It's a single package so that queries can be shared (again, gross)
  pushd crates/lib/mysql_queries
  SQLX_OFFLINE=true cargo sqlx prepare
  popd
}

build_shared_sqlite_database_library() {
  # NB(1): These are *SQLite* queries for the desktop AiChatBot app.
  # NB(2): Make sure to run migrations first.
  # NB(3): SqLite has trouble with relative paths, so we copy the file to /
  cp $SQLITE_DATABASE_PATH /tmp
  pushd crates/lib/sqlite_queries
  DATABASE_URL=sqlite:///tmp/database.db cargo sqlx prepare --merged
  popd
}

echo 'mysql prepare'
build_shared_mysql_database_library

#echo 'sqlite prepare'
#build_shared_sqlite_database_library

echo 'done'


