#!/bin/bash

if [ -d "deploy" ]; then
  pushd deploy
  echo "Running Python HTTP Server on deploy"
  python3 -m http.server 9000
  echo "Closing Python HTTP Server"
  popd
else
  echo "deploy directory does not exist."
  echo "please build the deployment first."
fi
