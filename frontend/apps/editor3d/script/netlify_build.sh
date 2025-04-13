#!/bin/bash

set -euxo pipefail 

#   echo "Run build script"
#   npm install
#   npm run build
#   
#   #echo "Emit built files."
#   #pwd
#   #find .
#   
#   # echo "Copy test files into dist"
#   # cp -r test/* dist/
#   # 
#   # echo "Copy netlify configs into dist"
#   # cp _headers dist/
#   # cp _redirects dist/
#   # 
#   # echo "Copy netlify 404.html page into dist"
#   # cp "404.html" dist/
#   # 
#   # echo "List files after build"
#   # find dist/

echo "Run build script (TODO: Make strict)"
nx build editor3d

echo "Current dir (1)"
pwd

echo "List directory files (1)"
pwd
ls -lA .

echo "Find build manifest"
find . | grep manifest.json

echo "Change to project dir"
pushd apps/editor3d/

echo "Current dir (2)"
pwd

echo "List directory files (2)"
pwd
ls -lA .

echo "List build directory files"
ls -lA build/

#echo "Copy netlify configs into dist"
#cp _headers dist/
#cp _redirects dist/

#echo "Copy netlify 404.html page into dist"
#cp "404.html" dist/

echo "List files after build"
find dist/

