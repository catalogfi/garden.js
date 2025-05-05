#!/bin/bash
set -e

if [[ -z "$1" ]]; then
  echo "No package names provided."
  exit 1
fi

PACKAGE_NAMES=($@)
echo "Packages to release: ${PACKAGE_NAMES[@]}"

yarn install
yarn workspaces foreach --all --topological --no-private run build

increment_beta_version() {
  PACKAGE_NAME=$1
  LATEST_STABLE_VERSION=$(npm view $PACKAGE_NAME version || jq -r .version package.json)
  
  BETA_PATTERN="${LATEST_STABLE_VERSION}-beta."
  LATEST_BETA_VERSION=$(npm view $PACKAGE_NAME versions --json | jq -r '[.[] | select(contains("'"$BETA_PATTERN"'"))] | last')

  if [[ -n "$LATEST_BETA_VERSION" && "$LATEST_BETA_VERSION" != "null" ]]; then
      BETA_NUMBER=$(echo "$LATEST_BETA_VERSION" | sed -E "s/.*-beta\.([0-9]+)$/\1/")
      NEW_BETA_NUMBER=$((BETA_NUMBER + 1))
      NEW_VERSION="${LATEST_STABLE_VERSION}-beta.${NEW_BETA_NUMBER}"
  else
      NEW_VERSION="${LATEST_STABLE_VERSION}-beta.0"
  fi

  echo "Bumping $PACKAGE_NAME to $NEW_VERSION"
  jq --arg new_version "$NEW_VERSION" '.version = $new_version' package.json > package.tmp.json && mv package.tmp.json package.json

  yarn npm publish --tag beta --access public
}

for PACKAGE in "${PACKAGE_NAMES[@]}"; do
  echo "📦 Processing package: $PACKAGE"
  
  PKG_NAME_NO_SCOPE=$(basename "$PACKAGE")
  PKG_DIR="packages/$PKG_NAME_NO_SCOPE"
  
  if [[ ! -d "$PKG_DIR" ]]; then
    echo "Package directory $PKG_DIR not found. Skipping."
    continue
  fi

  cd "$PKG_DIR"

  increment_beta_version "$PACKAGE"

  cd - > /dev/null
done
