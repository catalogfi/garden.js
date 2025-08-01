#!/bin/bash

# Script to set up portal links for GardenJS packages in any project
# Usage: ./scripts/portal-setup.sh /path/to/target/project

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GARDEN_ROOT="$(dirname "$SCRIPT_DIR")"

if [ -z "$1" ]; then
    echo -e "\033[31m [ERROR] Usage: $0 /path/to/target/project\033[0m"
    exit 1
fi

TARGET_DIR="$1"

if [ ! -d "$TARGET_DIR" ]; then
    echo -e "\033[31m [ERROR] Target directory does not exist: $TARGET_DIR\033[0m"
    exit 1
fi

if [ ! -f "$TARGET_DIR/package.json" ]; then
    echo -e "\033[31m [ERROR] Target directory does not contain package.json: $TARGET_DIR\033[0m"
    exit 1
fi

echo -e "\033[34m [INFO] Setting up portal links for GardenJS packages in: $TARGET_DIR\033[0m"

TEMP_PACKAGE_JSON="$TARGET_DIR/package.json.temp"

cat "$TARGET_DIR/package.json" | jq --arg garden_root "$GARDEN_ROOT" '
.resolutions = {
  "@gardenfi/core": ("portal:" + $garden_root + "/packages/core"),
  "@gardenfi/orderbook": ("portal:" + $garden_root + "/packages/orderbook"), 
  "@gardenfi/react-hooks": ("portal:" + $garden_root + "/packages/react-hooks"),
  "@gardenfi/utils": ("portal:" + $garden_root + "/packages/utils"),
  "@gardenfi/wallet-connectors": ("portal:" + $garden_root + "/packages/walletConnectors")
} + (.resolutions // {})
' > "$TEMP_PACKAGE_JSON"

cp "$TARGET_DIR/package.json" "$TARGET_DIR/package.json.backup"

mv "$TEMP_PACKAGE_JSON" "$TARGET_DIR/package.json"

rm "$TARGET_DIR/package.json.backup"

echo -e "\033[32m [SUCCESS] Updated package.json with portal resolutions\033[0m"

cd "$TARGET_DIR"

if ! grep -q '"@gardenfi/core"' package.json; then
    echo -e "\033[34m [INFO] Adding GardenJS packages as dependencies...\033[0m"
    yarn add @gardenfi/core@2.4.2 @gardenfi/orderbook@2.4.2 @gardenfi/react-hooks@2.4.2 @gardenfi/utils@2.4.2 @gardenfi/wallet-connectors@2.3.1
else
    echo -e "\033[34m [INFO] GardenJS packages already in dependencies, running install...\033[0m"
    yarn install
fi

echo -e "\033[32m [SUCCESS] Portal links set up successfully!\033[0m"
