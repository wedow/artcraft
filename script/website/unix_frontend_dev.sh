#!/usr/bin/env bash
# This works on Linux and MacOS to launch the frontend dev server

root_dir=$(pwd)
frontend_path="${root_dir}/frontend"

echo "Running Artcraft Website in Dev Mode..."
echo ""

# Kill any process running on port 5741, which will block startup
if lsof -i tcp:4200 &>/dev/null; then
  lsof -i tcp:4200 -t | xargs kill -9
  echo "Killed process running on port 4200"
else
  echo "No process running on port 4200"
fi

pushd "${frontend_path}" || exit

npm install --verbose

export VITE_ENVIRONMENT_TYPE="production"

nx dev artcraft-website

popd || exit
