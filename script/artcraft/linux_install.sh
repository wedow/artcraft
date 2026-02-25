#!/usr/bin/env bash
# Build and install ArtCraft to ~/.local/ on Linux
#
# Usage: ./script/artcraft/linux_install.sh
# Update workflow: git pull && ./script/artcraft/linux_install.sh

set -euxo pipefail

root_dir="$(cd "$(dirname "$0")/../.." && pwd)"
rust_crate_path="${root_dir}/crates/desktop/artcraft"
frontend_path="${root_dir}/frontend"

bin_dir="$HOME/.local/bin"
app_dir="$HOME/.local/share/applications"
icon_dir="$HOME/.local/share/icons/hicolor/128x128/apps"

# Install frontend dependencies
pushd "${frontend_path}" > /dev/null
npm install
popd > /dev/null

# Build production binary (no .deb/.appimage packaging)
export TAURI_FRONTEND_PATH="${frontend_path}"
export TAURI_APP_PATH="${rust_crate_path}"
export VITE_ENVIRONMENT_TYPE="production"
export SQLX_OFFLINE=true

# Override release profile to avoid OOM on machines with <=16GB RAM.
# LTO + codegen-units=1 can need 20GB+ for the link step.
export CARGO_PROFILE_RELEASE_LTO=false
export CARGO_PROFILE_RELEASE_CODEGEN_UNITS=8

cargo tauri build --no-bundle --config "${rust_crate_path}/tauri.conf.json"

# Install binary
mkdir -p "${bin_dir}"
cp "${root_dir}/target/release/artcraft" "${bin_dir}/artcraft"
echo "Installed binary to ${bin_dir}/artcraft"

# Install icon
mkdir -p "${icon_dir}"
cp "${rust_crate_path}/icons/128x128.png" "${icon_dir}/artcraft.png"
echo "Installed icon to ${icon_dir}/artcraft.png"

# Install .desktop file
mkdir -p "${app_dir}"
cat > "${app_dir}/artcraft.desktop" << DESKTOP
[Desktop Entry]
Name=ArtCraft
Comment=AI IDE for image and video creation
Exec=env WEBKIT_DISABLE_DMABUF_RENDERER=1 WEBKIT_DISABLE_COMPOSITING_MODE=1 ${bin_dir}/artcraft
Icon=artcraft
Type=Application
Categories=Graphics;
DESKTOP
echo "Installed desktop entry to ${app_dir}/artcraft.desktop"

# Stop the Nx daemon that lingers after the build
npx nx daemon --stop --cwd "${frontend_path}" 2>/dev/null || true

echo ""
echo "Done! ArtCraft is installed."
echo "Launch from your app launcher or run: artcraft"
