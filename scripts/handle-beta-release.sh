#!/bin/bash
set -e

COMMIT_EMAIL=$(git log -1 --pretty=format:'%ae')
COMMIT_NAME=$(git log -1 --pretty=format:'%an')

if [[ -z "$1" ]]; then
  echo "No package names provided."
  exit 1
fi

git checkout $PR_BRANCH
PACKAGE_NAMES=($@)
echo "Packages to release: ${PACKAGE_NAMES[@]}"

yarn install
yarn install
if ! yarn workspaces foreach --all --topological --no-private run build; then
  echo "Build failed. Exiting."
  exit 1
fi

increment_beta_version() {
  PACKAGE_NAME=$1

  # Check if package exists on npm
  if npm view $PACKAGE_NAME version >/dev/null 2>&1; then
    LATEST_STABLE_VERSION=$(npm view $PACKAGE_NAME version)
  else
    # Package doesn't exist yet, use version from package.json
    LATEST_STABLE_VERSION=$(jq -r .version package.json)
    echo "Package $PACKAGE_NAME not found on npm, using local version: $LATEST_STABLE_VERSION"
  fi

  BETA_PATTERN="${LATEST_STABLE_VERSION}-beta."
  LATEST_BETA_VERSION=$(npm view $PACKAGE_NAME versions --json 2>/dev/null | jq -r '[.[] | select(contains("'"$BETA_PATTERN"'"))] | last')

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
