
set -euxo pipefail
# calls these
./script/desktop/run_desktop_3d_frontend.sh
./script/desktop/launch_rust_only_3d.sh

echo "All scripts completed!"