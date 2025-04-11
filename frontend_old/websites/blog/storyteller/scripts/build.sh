#!/bin/bash

echo "Building Tailwind CSS"
npx tailwindcss -c ./tailwind.config.js -i ./static/zola/app.css -o ./static/zola/main.css

echo "Building site via Zola SSG"
zola --config config.toml build --output-dir deploy

echo "Done, please check the deploy folder".
