#!/bin/bash

set -euxo pipefail 

echo "Install packages"
npm install

echo "Build Editor 3D"
nx build editor3d --verbose

echo "Change to project dir"
pushd apps/editor3d/

#echo "List build directory files"
#ls -lA build/

#echo "Make output directory"
#mkdir dist/

echo "Copy files to putput directory"
#cp -r build/server/* dist/
#cp -r build/client/* dist/
cp _headers dist/
#cp _redirects dist/
#cp "404.html" dist/

echo "List final files in build"
find dist/


