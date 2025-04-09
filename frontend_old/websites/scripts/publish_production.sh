#!/bin/bash

set -euxo pipefail

MASTER_BRANCH='master'
PRODUCTION_BRANCH='production-fakeyou'

git stash
git branch --set-upstream-to="origin/${MASTER_BRANCH}" ${MASTER_BRANCH}
git checkout $MASTER_BRANCH
git pull

if git show-ref --verify --quiet "refs/heads/$PRODUCTION_BRANCH"; then
    echo "Deleting branch ${PRODUCTION_BRANCH}"
    git branch -D $PRODUCTION_BRANCH
fi

git checkout -b $PRODUCTION_BRANCH
git push --set-upstream origin $PRODUCTION_BRANCH

git checkout $MASTER_BRANCH

