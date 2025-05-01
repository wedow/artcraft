#!/usr/bin/env bash

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Go up to the root of the repository (assumes src/app/pages is always 3 levels deep)
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

cd "${REPO_ROOT}"
echo "${REPO_ROOT}"


# Run the launch script
./script/desktop/run_desktop_3d.sh