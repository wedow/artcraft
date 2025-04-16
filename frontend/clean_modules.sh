#!/bin/bash

set -euxo pipefail

echo "NX reset..."
npx nx reset

echo "Removing Node Modules..."
rm -rf ./node_modules/
rm -rf ./apps/editor2d/node_modules/
rm -rf ./apps/editor3d/node_modules/

echo "Removing Build Directories..."
rm -rf ./libs/components/login/dist/
rm -rf ./libs/utils/api/dist/

