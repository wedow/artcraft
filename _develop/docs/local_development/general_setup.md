FakeYou Development Setup (bare metal)
======================================

This document describes how to run the FakeYou infrastructure on your development 
machine's bare metal (no containers).

Setup instructions and development were tested and known to work on the following
platforms:

- Mac OS (Apple M2 silicon)
- Ubuntu 22.04

The applications (binary targets) you might be interested in running include, but 
are not limited to:

- `storyteller-web`, the HTTP API server
- `download-job`, which downloads models from the web and stores them in GCS
- `inference-job`, which downloads models from GCS and runs inference with them

Setup Instructions
------------------

### (1) Install Rust

Install Rust [using this guide](https://www.rust-lang.org/learn/get-started). If it asks, 
you'll want "stable" Rust, not "nightly" Rust. If it doesn't ask, it defaults to "stable".

### (2) Install the necessary libraries

Mac: (Lost the list, but it should match Linux. Install Homebrew.)

Ubuntu 22.04:

```bash
sudo apt install jq \
  libmysqlclient-dev \
  libsqlite3-dev \
  pkgconf
```

(Note: jq is for combining mysql codegen outputs; pkgconf is if using openssl instead of rustls.)

### (3) Install MySQL server

Mac:

```bash
brew install mysql
```

If `mysql -uroot` fails, reboot the machine:

```bash
sudo reboot now
```

Ubuntu 22.04:

```bash
sudo apt install mysql-server
```


### (4) Install a `storyteller` user and table in MySQL

Connect to mysql:

```bash
# If the following command asks for a password, the password is typically "root"
sudo mysql -u root -p
```

Once in MySQL, run the following:

```mysql
use mysql;
CREATE DATABASE storyteller;
CREATE USER 'storyteller'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON storyteller.* TO 'storyteller'@'localhost';
```

Then verify access with `./dev_mysql_connect.sh`

### (5) Install Diesel CLI (for MySQL migrations):

```bash
cargo install diesel_cli \
  --no-default-features \
  --features mysql,sqlite
```

As of this writing, Mac [has some issues with Diesel CLI](https://github.com/diesel-rs/diesel/issues/2605)
and requires a few extra dependencies to be installed:

```bash
brew install libpq
```

### (6) Run the pending database migrations:

```bash
diesel migration run
```

You might get a scary message about `"Encountered unknown type for Mysql: enum"` -- you can ignore this 
error (see below).

### (7) (optional) Install the SQLx CLI (if doing database development)

```bash
# NB(bt,2023-10-04): "--no-default-features" not working
# cargo install sqlx-cli --no-default-features --features rustls,mysql,sqlite
cargo install sqlx-cli --features rustls,mysql,sqlite
```

We'll be using diesel to manage the migrations, but sqlx within the app to actually perform queries.
Diesel is an immature ORM, which isn't a good tech bet, so we use sqlx as at-compile-time
typesafe SQL.

### (8) Install hosts file:

(This should be the same on Linux and Mac, but might differ for Windows.)

If you're developing against the frontend, it'll target development domains (eg. `dev.fakeyou.com`) instead 
of `127.0.0.1` or `localhost`. You can make your machine route domains to localhost by editing your hosts 
file (located at `/etc/hosts`) to include the following configuration lines:

```
127.0.0.1    dev.fakeyou.com
127.0.0.1    api.dev.fakeyou.com
127.0.0.1    devproxy.fakeyou.com

127.0.0.1    dev.storyteller.ai
127.0.0.1    api.dev.storyteller.ai
127.0.0.1    devproxy.storyteller.ai
```

### (9a) Install Redis

```
sudo apt install redis
```

### (9b) Run one or more applications:
DO NOT CHECK THESE TWO FILES INTO THE REPO
Ask Brandon for the .env-secrets and .storteller-web.development-secrets.env and place it in the root of the folder.

To start the HTTP API server,

```bash
cargo run --bin storyteller-web
```
Note that this compiles and runs the "development" binary. It's faster and easier to debug than the
optimized "production" build. To build a fully optimized production release,
run `cargo build --release --bin storyteller-web` . Note that this will take much longer.

DO NOT CHECK THESE TWO FILES INTO THE REPO

Ask Brandon for the .download-job.development-secrets.env and place it in
crates/service/job/download_job/config

Ask Brandon for the .inference-job.development-secrets.env and place it in
crates/service/job/inference_job/config

To download some ML models, run:

```bash
cargo run --bin download-job
cargo run --bin tts-download-job
```

If you want to run both the HTTP API and the jobs, you'll need to run both processes in different
terminals or tmux sessions.

Note also that the configurations pointing to the ML monorepo must be set up for each application.
Additionally, some development secrets may be needed (ask the team to share).

To execute ML inference, run:

```bash
cargo run --bin inference-job
cargo run --bin tts-inference-job
```

Again, note that the configurations pointing to the ML monorepo must be set up for each application.
Additionally, some development secrets may be needed (ask the team to share).

Solutions to Common Setup Problems 
-----------------------------------

### [Fix] Sqlx Error when Performing Schema Migrations

You might get this error message during migration,

```
Encountered unknown type for Mysql: enum
thread 'main' panicked at 'internal error: entered unreachable code: Mysql only supports a closed set of types.
                         If you ever see this error message please open an issue at https://github.com/diesel-rs/diesel 
                         containing a dump of your schema definition.', diesel_cli/src/print_schema.rs:310:17
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

I haven't found the cause (it doesn't happen on newer installs), but the migrations appear to work regardless 
of this error message. You can essentially ignore it.

### [Fix] Can't connect to local MySQL after install on Ubuntu

- If MySql in local dev can't be connected to, [reset the accounts](https://linuxconfig.org/how-to-reset-root-mysql-mariadb-password-on-ubuntu-20-04-focal-fossa-linux).
