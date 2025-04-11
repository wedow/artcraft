#!/bin/bash

if [ -d "deploy" ]; then
  echo "deleting the deploy directory..."
  rm -rf deploy
  echo "done."
fi

if [ -d "public" ]; then
  echo "deleting the public directory..."
  rm -rf public
  echo "done."
fi