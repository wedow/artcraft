#!/bin/bash
# NB: This file is executed by Netlify to build fakeyou.com

set -euxo pipefail

# Control certain build switches between FakeYou.com and Storyteller.ai
export WEBSITE="fakeyou" 

function replace_commit_ref {
  # Add the GIT SHA to the build
  # This must be done before everything else, or it will get cached with the build.
  # (This might be making the builds less performant?)
  # COMMIT_REF is defined by Netlify to be the commit SHA
  # We want a short 8 character reference.
  SHORT_SHA=$(echo "${COMMIT_REF}" | cut -c1-8)
  find . -type f -exec sed -i "s/CURRENT_STORYTELLER_VERSION/${SHORT_SHA}/g" {} +
  # The above command won't work with Mac's version of find/sed. The following is a Mac-friendly version:
  # find . -type f -exec sed -i '' -e "s/CURRENT_STORYTELLER_VERSION/${SHORT_SHA}/g" {} + 
}

function build_website {
  pushd src/website
  yarn install 
  yarn test-fakeyou --verbose
  # --ignore-engines: https://stackoverflow.com/a/59615348
  yarn build-fakeyou --verbose --ignore-optional --ignore-engines
  popd
}

function build_blog {
  zola --root blog/fakeyou build 
}

echo "Current working directory:"
pwd

echo "Labelling build with short SHA..."
replace_commit_ref

echo "Building blog..."
build_blog

echo "Building website..."
build_website

echo "Create final output directory..."
mkdir -p fakeyou.com/blog
mkdir -p fakeyou.com/website

echo "Copying blog artifacts..."
cp -r blog/fakeyou/public/* fakeyou.com/blog/

echo "Copying 404 page..."
cp src/website/packages/fakeyou.com/build/404_fakeyou.html fakeyou.com/404.html

echo "Moving website artifacts..."
mv src/website/packages/fakeyou.com/build/* fakeyou.com/website/

echo "Copying redirects configuration to Netlify build dir..."
cp src/netlify_configs/fakeyou.com/_redirects fakeyou.com/
cp src/netlify_configs/fakeyou.com/netlify.toml fakeyou.com/
cp src/netlify_configs/fakeyou.com/netlify.toml ./

echo "List files in build directory"
find fakeyou.com/
