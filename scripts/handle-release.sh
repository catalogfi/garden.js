#!/bin/bash
set -e

COMMIT_EMAIL=$(git log -1 --pretty=format:'%ae')
COMMIT_NAME=$(git log -1 --pretty=format:'%an')

git fetch --tags
git fetch origin main:refs/remotes/origin/main

IS_PR=false
if [[ "$GITHUB_EVENT_NAME" == "issue_comment" ]]; then
  IS_PR=true
fi

ROOT_VERSION=$(git tag --list 'v*' --sort=-v:refname | head -n 1 | sed 's/^v//')
echo "Current root version: $ROOT_VERSION"

if [[ $1 == "beta" ]]; then
  VERSION_BUMP="prerelease"
  PRERELEASE_SUFFIX="beta"
else
  LAST_COMMIT_MSG=$(git log -1 --pretty=%B)

  if [[ $LAST_COMMIT_MSG == patch:* || $LAST_COMMIT_MSG == patch:/* ]]; then
    VERSION_BUMP="patch"
  elif [[ $LAST_COMMIT_MSG == chore:* || $LAST_COMMIT_MSG == chore/* ]]; then
    VERSION_BUMP="patch"
  elif [[ $LAST_COMMIT_MSG == fix:* || $LAST_COMMIT_MSG == fix/* ]]; then
    VERSION_BUMP="minor"
  elif [[ $LAST_COMMIT_MSG == feat:* || $LAST_COMMIT_MSG == feat:* ]]; then
    VERSION_BUMP="major"
  else
    echo "Commit message does not match patch, chore, fix, or feat. Skipping publishing."
    exit 0
  fi
fi

echo "Version bump type detected: $VERSION_BUMP"

if [[ "$IS_PR" == "true" && -n "$PR_BRANCH" ]]; then
  git fetch origin "$PR_BRANCH:$PR_BRANCH"
  RAW_CHANGED=$(git diff --name-only origin/main..."$PR_BRANCH" | grep '^packages/' | awk -F/ '{print $2}' | sort -u)

  CHANGED=""
  for DIR in $RAW_CHANGED; do
    PKG_JSON="packages/$DIR/package.json"
    if [[ -f "$PKG_JSON" ]]; then
      PKG_NAME=$(jq -r .name "$PKG_JSON")
      if [[ "$PKG_NAME" != "null" && -n "$PKG_NAME" ]]; then
        CHANGED+="$PKG_NAME"$'\n'
      fi
    fi
  done

  CHANGED=$(echo "$CHANGED" | sort -u)

elif [[ "$GITHUB_EVENT_NAME" == "push" ]]; then
  if git describe --tags --abbrev=0 >/dev/null 2>&1; then
    LATEST_TAG=$(git describe --tags --abbrev=0)
    RAW_CHANGED=$(git diff --name-only "$LATEST_TAG"...HEAD | grep '^packages/' | awk -F/ '{print $2}' | sort -u)
  else
    RAW_CHANGED=$(git diff --name-only HEAD~1 | grep '^packages/' | awk -F/ '{print $2}' | sort -u)
  fi

  CHANGED=""
  for DIR in $RAW_CHANGED; do
    PKG_JSON="packages/$DIR/package.json"
    if [[ -f "$PKG_JSON" ]]; then
      PKG_NAME=$(jq -r .name "$PKG_JSON")
      if [[ "$PKG_NAME" != "null" && -n "$PKG_NAME" ]]; then
        CHANGED+="$PKG_NAME"$'\n'
      fi
    fi
  done

  CHANGED=$(echo "$CHANGED" | sort -u)
fi

echo "Changed packages:"
echo "$CHANGED"

if [[ -z "$CHANGED" ]]; then
  echo "No packages changed. Skipping publish."
  exit 0
fi

TOPO_ORDER=$(yarn workspaces foreach --all --topological --no-private exec node -p "require('./package.json').name" 2>/dev/null | grep '^@' | sed 's/\[//;s/\]://')

declare -A PKG_NAME_TO_DIR
for DIR in packages/*; do
  if [[ -f "$DIR/package.json" ]]; then
    NAME=$(jq -r .name "$DIR/package.json")
    if [[ "$NAME" != "null" && -n "$NAME" ]]; then
      DIR_NAME=$(basename "$DIR")
      PKG_NAME_TO_DIR[$NAME]="$DIR_NAME"
    fi
  fi
done

declare -A REVERSE_DEP_MAP
for PKG in $TOPO_ORDER; do
  PKG_DIR="${PKG_NAME_TO_DIR[$PKG]}"
  if [[ -z "$PKG_DIR" ]]; then
    echo "⚠️ Skipping $PKG: Directory not found in PKG_NAME_TO_DIR"
    continue
  fi

  DEPS=$(jq -r '.dependencies // {} | keys[]' "packages/$PKG_DIR/package.json" 2>/dev/null | grep '^@gardenfi/' || true)
  for DEP in $DEPS; do
    if [[ -n "${REVERSE_DEP_MAP[$DEP]}" ]]; then
      REVERSE_DEP_MAP[$DEP]="${REVERSE_DEP_MAP[$DEP]} $PKG"
    else
      REVERSE_DEP_MAP[$DEP]="$PKG"
    fi
  done
done

declare -A SHOULD_PUBLISH
queue=()
for CHG in $CHANGED; do
  CHG_PKG="$CHG"
  SHOULD_PUBLISH[$CHG_PKG]=1
  queue+=("$CHG_PKG")
done

while [ ${#queue[@]} -gt 0 ]; do
  CURRENT=${queue[0]}
  queue=("${queue[@]:1}")
  for DEP in ${REVERSE_DEP_MAP[$CURRENT]}; do
    if [[ -z "${SHOULD_PUBLISH[$DEP]}" ]]; then
      SHOULD_PUBLISH[$DEP]=1
      queue+=("$DEP")
    fi
  done
done

PUBLISH_ORDER=()
for PKG in $TOPO_ORDER; do
  if [[ ${SHOULD_PUBLISH[$PKG]} == 1 ]]; then
    PUBLISH_ORDER+=("$PKG")
  fi
done

increment_version() {
  VERSION=$1
  VERSION_TYPE=$2
  IFS='.' read -r -a VERSION_PARTS <<< "$VERSION"
  MAJOR=${VERSION_PARTS[0]}
  MINOR=${VERSION_PARTS[1]}
  PATCH=${VERSION_PARTS[2]}

  if [[ -z "$MAJOR" || -z "$MINOR" || -z "$PATCH" ]]; then
    echo "Invalid version number: $VERSION"
    exit 1
  fi

  case $VERSION_TYPE in
    "major") MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
    "minor") MINOR=$((MINOR + 1)); PATCH=0 ;;
    "patch") PATCH=$((PATCH + 1)) ;;
    "prerelease")
      if [[ $VERSION =~ -beta\.[0-9]+$ ]]; then
        PRERELEASE_NUM=$(( ${VERSION##*-beta.} + 1 ))
      else
        PRERELEASE_NUM=1
      fi
      PRERELEASE="beta.${PRERELEASE_NUM}"
      ;;
    *) echo "Invalid version bump type: $VERSION_TYPE"; exit 1 ;;
  esac

  if [[ $VERSION_TYPE == "prerelease" ]]; then
    echo "${MAJOR}.${MINOR}.${PATCH}-${PRERELEASE}"
  else
    echo "${MAJOR}.${MINOR}.${PATCH}"
  fi
}
export -f increment_version

if [[ "$IS_PR" == "true" && -n "$PR_BRANCH" ]]; then
  git checkout $PR_BRANCH
else
  git checkout main
fi

yarn install
if ! yarn workspaces foreach --all --topological --no-private run build; then
  echo "Build failed. Exiting."
  exit 1
fi

if [[ "$VERSION_BUMP" == "prerelease" ]]; then
  if [[ "$ROOT_VERSION" =~ -beta\.[0-9]+$ ]]; then
    ROOT_VERSION_BETA="${ROOT_VERSION%-beta.*}"
    BETA_NUMBER=$(echo "$ROOT_VERSION" | sed -E "s/.*-beta\.([0-9]+)$/\1/")
    NEW_BETA_NUMBER=$((BETA_NUMBER + 1))
    NEW_ROOT_VERSION="${ROOT_VERSION_BETA}-beta.${NEW_BETA_NUMBER}"
  else
    ROOT_VERSION_BETA="${ROOT_VERSION}"
    NEW_ROOT_VERSION="${ROOT_VERSION_BETA}-beta.1"
  fi

else
  if [[ "$ROOT_VERSION" =~ -beta\.[0-9]+$ ]]; then
    ROOT_VERSION="${ROOT_VERSION%-beta.*}"
    NEW_ROOT_VERSION=$(increment_version "$ROOT_VERSION" "$VERSION_BUMP")
  else
    NEW_ROOT_VERSION=$(increment_version "$ROOT_VERSION" "$VERSION_BUMP")
  fi
fi

echo "Publishing in order: ${PUBLISH_ORDER[@]}"

for PKG in "${PUBLISH_ORDER[@]}"; do
  echo ""
  echo "📦 Processing $PKG..."
  PKG_DIR="${PKG_NAME_TO_DIR[$PKG]}"
  cd "packages/$PKG_DIR"

  PACKAGE_NAME=$(jq -r .name package.json)
  LATEST_STABLE_VERSION=$(npm view $PACKAGE_NAME version || jq -r .version package.json)
  if [[ "$VERSION_BUMP" == "prerelease" ]]; then
    BETA_PATTERN="${LATEST_STABLE_VERSION}-beta."

    LATEST_BETA_VERSION=$(npm view $PACKAGE_NAME versions --json | jq -r '[.[] | select(contains("'"$BETA_PATTERN"'"))] | last')

    if [[ -n "$LATEST_BETA_VERSION" && "$LATEST_BETA_VERSION" != "null" ]]; then
        BETA_NUMBER=$(echo "$LATEST_BETA_VERSION" | sed -E "s/.*-beta\.([0-9]+)$/\1/")
        NEW_BETA_NUMBER=$((BETA_NUMBER + 1))
        NEW_VERSION="${LATEST_STABLE_VERSION}-beta.${NEW_BETA_NUMBER}"
    else
        echo "No beta version found. Creating the first beta version."
        NEW_VERSION="${LATEST_STABLE_VERSION}-beta.1"
    fi
    jq --arg new_version "$NEW_VERSION" '.version = $new_version' package.json > package.tmp.json && mv package.tmp.json package.json
  else
    NEW_VERSION=$(increment_version "$LATEST_STABLE_VERSION" "$VERSION_BUMP")
    jq --arg new_version "$NEW_VERSION" '.version = $new_version' package.json > package.tmp.json && mv package.tmp.json package.json
    git add package.json
  fi

  echo "Bumping $PACKAGE_NAME to $NEW_VERSION"

  if [[ "$VERSION_BUMP" == "prerelease" ]]; then
    yarn npm publish --tag beta --access public
  else
    yarn npm publish --access public
  fi

  cd - > /dev/null
done

if [[ "$VERSION_BUMP" != "prerelease" ]]; then
  git tag "v$NEW_ROOT_VERSION"
  git push https://x-access-token:${GH_PAT}@github.com/catalogfi/garden.js.git HEAD:main --tags
fi

if [[ "$IS_PR" != "true" ]]; then
  jq --arg new_version "$NEW_ROOT_VERSION" '.version = $new_version' package.json > package.tmp.json && mv package.tmp.json package.json

  git add package.json
    git -c user.email="$COMMIT_EMAIL" \
        -c user.name="$COMMIT_NAME" \
        commit -m "v$NEW_ROOT_VERSION"
  git push https://x-access-token:${GH_PAT}@github.com/catalogfi/garden.js.git HEAD:main
fi

yarn config unset yarnPath
jq 'del(.packageManager)' package.json > temp.json && mv temp.json package.json
