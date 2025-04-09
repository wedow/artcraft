#!/bin/bash
# NB: This file is executed by Netlify to build the website

# Verbose printing, exit on failure.
set -euxo pipefail

# Echo env vars
env

# Add the GIT SHA to the build
# This must be done before everything else, or it will get cached with the build.
# (This might be making the builds less performant?)
# COMMIT_REF is defined by Netlify to be the commit SHA
# We want a short 8 character reference.
echo "Labelling build with short SHA..."
SHORT_SHA=$(echo "${COMMIT_REF}" | cut -c1-8)

echo "Baking current git SHA to code";

find . -type f -exec sed -i "s/%CURRENT_STORYTELLER_GIT_VERSION%/${SHORT_SHA}/g" {} +

####
# Expressions hack
####

echo "Baking expressions feature flag ENV to code";

echo "Value of EXPRESSIONS env var is: ${EXPRESSIONS}"

if [ "$EXPRESSIONS" = "TRUE" ] || [ "$EXPRESSIONS" = "true" ] ; then
    expressions_value="true"
else
    expressions_value="false"
fi

echo "Value of expressions is: ${expressions_value}"

find . -type f -exec sed -i "s/%EXPRESSIONS_VALUE%/${expressions_value}/g" {} +

echo "Baking URL/API ENV configs to code";

# NB: We can't use slashes as the sed escape character: 
# https://stackoverflow.com/a/27787551
d=$'\03'
find . -type f -exec sed -i "s${d}%BUILD_BASE_API%${d}${BASE_API}${d}g" {} +
find . -type f -exec sed -i "s${d}%BUILD_GOOGLE_API%${d}${GOOGLE_API}${d}g" {} +
find . -type f -exec sed -i "s${d}%BUILD_FUNNEL_API%${d}${FUNNEL_API}${d}g" {} +
find . -type f -exec sed -i "s${d}%BUILD_CDN_API%${d}${CDN_API}${d}g" {} +
find . -type f -exec sed -i "s${d}%BUILD_UPLOAD_VIDEO%${d}${UPLOAD_VIDEO_API}${d}g" {} +
find . -type f -exec sed -i "s${d}%BUILD_MEDIA_VIDEO%${d}${MEDIA_VIDEO_API}${d}g" {} +
find . -type f -exec sed -i "s${d}%BUILD_GRAVATAR_VIDEO%${d}${GRAVATAR_API}${d}g" {} +
find . -type f -exec sed -i "s${d}%DEPLOY_PRIME_URL%${d}${DEPLOY_PRIME_URL}${d}g" {} +
find . -type f -exec sed -i "s${d}%DEPLOY_CONTEXT%${d}${DEPLOY_CONTEXT}${d}g" {} +
find . -type f -exec sed -i "s${d}%CONTEXT%${d}${CONTEXT}${d}g" {} +
find . -type f -exec sed -i "s${d}%UPLOAD_API_VIDEO%${d}${UPLOAD_API_VIDEO}${d}g" {} +

# Replace Posthog env variables in the code
find . -type f -exec sed -i "s${d}%REACT_APP_PUBLIC_POSTHOG_KEY%${d}${REACT_APP_PUBLIC_POSTHOG_KEY}${d}g" {} +
find . -type f -exec sed -i "s${d}%REACT_APP_PUBLIC_POSTHOG_UI%${d}${REACT_APP_PUBLIC_POSTHOG_UI}${d}g" {} +

# TODO: Run tests when we add them.

# Ensure the environment variables are exported
export REACT_APP_PUBLIC_POSTHOG_KEY
export REACT_APP_PUBLIC_POSTHOG_UI
export CONTEXT
# Run build.x
npm run build

