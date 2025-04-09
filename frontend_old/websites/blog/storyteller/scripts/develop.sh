#!/bin/bash

echo "Building and Watching Tailwind CSS"
npx tailwindcss -c ./tailwind.config.js -i ./static/zola/app.css -o ./static/zola/main.css --watch &


echo "Building with Live-Reload via Zola SSG"
zola  --config config.toml serve

echo "Closing... BYE!".
