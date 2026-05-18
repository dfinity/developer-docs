#!/usr/bin/env bash
# Syncs Motoko language docs from .sources/motoko into docs/languages/motoko/.
#
# Requires the reorganized upstream structure (numeric prefixes removed, Starlight
# frontmatter in place). See .docs-plan/motoko-repo-sync-proposal.md.
#
# Usage: ./scripts/sync-motoko.sh
set -euo pipefail

SOURCE_DIR=".sources/motoko/doc/md"
TARGET_DIR="docs/languages/motoko"

if [ ! -d "$SOURCE_DIR/fundamentals" ]; then
  echo "ERROR: .sources/motoko not initialized."
  echo "Run: git submodule update --init --depth 1 .sources/motoko"
  exit 1
fi

# ---------------------------------------------------------------------------
# Structure guard: fail early if upstream still has numeric directory prefixes.
# This script requires the reorganized upstream structure — the old structure
# (fundamentals/1-basic-syntax/, fundamentals/3-types/, ...) is not supported.
# Wait for the upstream reorganization PR to merge before running this sync.
# ---------------------------------------------------------------------------
if [ -d "$SOURCE_DIR/fundamentals/1-basic-syntax" ]; then
  echo "ERROR: Upstream still uses numeric directory prefixes (found 'fundamentals/1-basic-syntax/')."
  echo "This script requires the reorganized upstream — see .docs-plan/motoko-repo-sync-proposal.md."
  exit 1
fi

VERSION=$(git -C .sources/motoko describe --tags --exact-match 2>/dev/null \
  || git -C .sources/motoko rev-parse --short HEAD)
echo "Syncing Motoko docs from caffeinelabs/motoko@$VERSION..."

# ---------------------------------------------------------------------------
# Guard: detect new top-level content not in the known lists.
# ---------------------------------------------------------------------------
SYNCED_DIRS="fundamentals icp-features reference"
EXCLUDED_DIRS="base core examples motoko-tooling old"
SYNCED_FILES="base-core-migration.md style-guide.md compiler-ref.md language-manual.md"
EXCLUDED_FILES="home.mdx install.mdx package-lock.json"
SYNC_WARNINGS=""

for item in "$SOURCE_DIR"/*/; do
  section=$(basename "$item")
  if ! echo "$SYNCED_DIRS" | grep -qw "$section" && \
     ! echo "$EXCLUDED_DIRS" | grep -qw "$section"; then
    echo "WARNING: Unknown directory '$section' in $SOURCE_DIR — not synced and not in exclusion list"
    SYNC_WARNINGS="${SYNC_WARNINGS}  - New directory '$section' found but not synced\n"
  fi
done

for f in "$SOURCE_DIR"/*.md "$SOURCE_DIR"/*.mdx; do
  [ -f "$f" ] || continue
  fname=$(basename "$f")
  if ! echo "$SYNCED_FILES" | grep -qw "$fname" && \
     ! echo "$EXCLUDED_FILES" | grep -qw "$fname"; then
    echo "WARNING: Unknown top-level file '$fname' in $SOURCE_DIR — not synced and not in exclusion list"
    SYNC_WARNINGS="${SYNC_WARNINGS}  - New top-level file '$fname' found but not synced\n"
  fi
done

# ---------------------------------------------------------------------------
# Preserve hand-written index.md
# ---------------------------------------------------------------------------
INDEX_BACKUP=$(mktemp)
cp "$TARGET_DIR/index.md" "$INDEX_BACKUP"

# ---------------------------------------------------------------------------
# Sync sections
#
# fundamentals/ — --exclude='/index.md' (leading slash anchors to the transfer
#   root, i.e. fundamentals/ itself). This drops the Docusaurus section landing
#   page (fundamentals/index.md) while keeping subdirectory index.md files
#   (fundamentals/basic-syntax/index.md, actors/index.md, etc.) which are
#   Starlight ordering stubs with sidebar.order frontmatter.
#
# icp-features/ and reference/ — global --exclude='index.md' (no anchor) drops
#   all index.md files; neither section has ordering stubs to preserve.
# ---------------------------------------------------------------------------
rsync -r --delete \
  --exclude='_category_.yml' --exclude='/index.md' \
  "$SOURCE_DIR/fundamentals/" "$TARGET_DIR/fundamentals/"

rsync -r --delete \
  --exclude='_category_.yml' --exclude='index.md' \
  "$SOURCE_DIR/icp-features/" "$TARGET_DIR/icp-features/"

rsync -r --delete \
  --exclude='_category_.yml' --exclude='index.md' \
  "$SOURCE_DIR/reference/" "$TARGET_DIR/reference/"

# ---------------------------------------------------------------------------
# Top-level reference files (live at doc/md/ root, synced into reference/)
# ---------------------------------------------------------------------------
for entry in \
  "language-manual.md:reference/language-manual.md" \
  "style-guide.md:reference/style-guide.md" \
  "compiler-ref.md:reference/compiler-ref.md" \
  "base-core-migration.md:base-core-migration.md"; do
  src_name="${entry%%:*}"
  dst_name="${entry##*:}"
  src_path="$SOURCE_DIR/$src_name"
  if [ -f "$src_path" ]; then
    cp "$src_path" "$TARGET_DIR/$dst_name"
    echo "  Copied $dst_name"
  else
    echo "WARNING: $src_name not found in $SOURCE_DIR"
    SYNC_WARNINGS="${SYNC_WARNINGS}  - $src_name missing from source\n"
  fi
done

# ---------------------------------------------------------------------------
# Restore hand-written index.md
# ---------------------------------------------------------------------------
cp "$INDEX_BACKUP" "$TARGET_DIR/index.md"
rm -f "$INDEX_BACKUP"

file_count=$(find "$TARGET_DIR" -name '*.md' | wc -l | tr -d ' ')
echo ""
echo "Sync complete: $file_count files from caffeinelabs/motoko@$VERSION in $TARGET_DIR/"
echo "Run 'npm run build' to verify."

if [ -n "$SYNC_WARNINGS" ]; then
  printf "%b" "$SYNC_WARNINGS" > /tmp/sync-motoko-warnings.txt
  echo ""
  echo "WARNINGS (manual review required):"
  printf "%b" "$SYNC_WARNINGS"
fi
