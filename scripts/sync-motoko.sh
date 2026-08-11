#!/usr/bin/env bash
# Syncs Motoko language docs from .sources/motoko/doc/md/ into docs/languages/motoko/.
#
# The upstream source (caffeinelabs/motoko doc/md/) is Starlight-ready as of
# PR #6132: clean filenames, sidebar.order frontmatter, no numeric prefixes,
# no _category_.yml files, no .mdx files. This script is a plain rsync +
# postprocess pass.
#
# Usage: ./scripts/sync-motoko.sh
set -euo pipefail

SOURCE_DIR=".sources/motoko/doc/md"
TARGET_DIR="docs/languages/motoko"

if [ ! -d "$SOURCE_DIR/fundamentals" ]; then
  echo "ERROR: .sources/motoko not initialized. Run: git submodule update --init --depth 1 .sources/motoko"
  exit 1
fi

VERSION=$(git -C .sources/motoko describe --tags --exact-match 2>/dev/null \
  || git -C .sources/motoko rev-parse --short HEAD)
echo "Syncing Motoko docs from caffeinelabs/motoko@$VERSION..."

# Wipe and rebuild from scratch so deleted upstream files don't linger.
rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"

# Plain rsync. Exclude examples/ (referenced via <motokoExamples> file embeds,
# resolved at build time from the pinned submodule — not page content).
rsync -a \
  --exclude="examples/" \
  "$SOURCE_DIR/" "$TARGET_DIR/"

echo "  Post-processing..."
POSTPROCESS_OUTPUT=$(node scripts/postprocess-motoko.mjs 2>&1)
echo "$POSTPROCESS_OUTPUT"

file_count=$(find "$TARGET_DIR" -name '*.md' | wc -l | tr -d ' ')
echo ""
echo "Sync complete: $file_count files from caffeinelabs/motoko@$VERSION in $TARGET_DIR/"
echo "Run 'npm run build' to verify."
