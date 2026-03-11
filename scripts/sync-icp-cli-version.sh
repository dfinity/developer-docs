#!/usr/bin/env bash
# Updates the icp-cli version in src/versions.json from the latest GitHub release.
# Usage: ./scripts/sync-icp-cli-version.sh [tag]
# If no tag provided, uses latest release tag.
set -euo pipefail

REPO="dfinity/icp-cli"
VERSIONS_FILE="src/versions.json"

TAG="${1:-}"

if [ -z "$TAG" ]; then
  echo "Fetching latest release tag from $REPO..."
  TAG=$(gh release view --repo "$REPO" --json tagName -q '.tagName' 2>/dev/null || echo "")
  if [ -z "$TAG" ]; then
    echo "ERROR: Could not determine latest release tag. Pass a tag as argument."
    exit 1
  fi
fi

# Extract major.minor from tag (v0.2.1 → 0.2, 0.3.0 → 0.3)
VERSION=$(echo "$TAG" | sed 's/^v//' | cut -d. -f1,2)

if [ -z "$VERSION" ]; then
  echo "ERROR: Could not parse version from tag '$TAG'"
  exit 1
fi

CURRENT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$VERSIONS_FILE','utf-8'))['icp-cli'])" 2>/dev/null || echo "")

if [ "$CURRENT" = "$VERSION" ]; then
  echo "icp-cli version already at $VERSION (from $TAG). No update needed."
  exit 0
fi

# Update versions.json
node -e "
const fs = require('fs');
const v = JSON.parse(fs.readFileSync('$VERSIONS_FILE', 'utf-8'));
v['icp-cli'] = '$VERSION';
fs.writeFileSync('$VERSIONS_FILE', JSON.stringify(v, null, 2) + '\n');
"

echo "Updated icp-cli version: ${CURRENT:-unknown} → $VERSION (from $TAG)"
echo "Rebuild to apply versioned links."
