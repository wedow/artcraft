#!/bin/bash

set -euxo pipefail 

# Add the GIT SHA to the build
# This must be done before everything else, or it will get cached with the build.
# (This might be making the builds less performant?)
# COMMIT_REF is defined by Netlify to be the commit SHA
# We want a short 8 character reference.
echo "Labelling build with short SHA..."
SHORT_SHA=$(echo "${COMMIT_REF}" | cut -c1-8)

echo "Baking current git SHA to code";
find . -type f -exec sed -i "s/%CURRENT_STORYTELLER_GIT_VERSION%/${SHORT_SHA}/g" {} +

echo "Install packages"
npm install

echo "Build Editor 3D"
nx build editor3d --verbose

echo "Change to project dir"
pushd apps/editor3d/

echo "Copy files to putput directory"
cp _headers dist/
#cp _redirects dist/
#cp "404.html" dist/

echo "List final files in build"
find dist/
