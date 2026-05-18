#!/usr/bin/env bash
# Syncs Motoko language docs from .sources/motoko into docs/languages/motoko/.
#
# Strategy:
#   - fundamentals/: preserve subdirectory structure (basic-syntax/, actors/, types/,
#     declarations/, control-flow/). Strip numeric prefixes from dir and file names.
#     Rename types/functions.md → types/function-types.md to avoid slug collision with
#     basic-syntax/functions.md.
#   - icp-features/: copy flat (no subdirs).
#   - reference/: copy flat, plus three top-level reference files (language-manual,
#     style-guide, compiler-ref).
#   - base-core-migration.md: copied to root of motoko/ (not in sidebar, linked from index).
#
# Usage: ./scripts/sync-motoko.sh
set -euo pipefail

SOURCE_DIR=".sources/motoko/doc/md"
TARGET_DIR="docs/languages/motoko"

if [ ! -d "$SOURCE_DIR/fundamentals" ]; then
  echo "ERROR: .sources/motoko not initialized. Run: git submodule update --init --depth 1 .sources/motoko"
  exit 1
fi

SYNC_WARNINGS=""

# ---------------------------------------------------------------------------
# Guard: detect new top-level content not in the known lists.
# ---------------------------------------------------------------------------
SYNCED_DIRS="fundamentals icp-features reference"
EXCLUDED_DIRS="base core examples motoko-tooling old"
SYNCED_FILES="12-base-core-migration.md 14-style.md 15-compiler-ref.md 16-language-manual.md"
EXCLUDED_FILES="1-home.mdx 2-install.mdx package-lock.json"

for item in "$SOURCE_DIR"/*/; do
  section=$(basename "$item")
  if ! echo "$SYNCED_DIRS"    | grep -qw "$section" && \
     ! echo "$EXCLUDED_DIRS"  | grep -qw "$section"; then
    echo "WARNING: Unknown directory '$section' in $SOURCE_DIR — not synced and not in exclusion list"
    SYNC_WARNINGS="${SYNC_WARNINGS}  - New directory '$section' found but not synced\n"
  fi
done

for f in "$SOURCE_DIR"/*.md "$SOURCE_DIR"/*.mdx; do
  [ -f "$f" ] || continue
  fname=$(basename "$f")
  if ! echo "$SYNCED_FILES"   | grep -qw "$fname" && \
     ! echo "$EXCLUDED_FILES" | grep -qw "$fname"; then
    echo "WARNING: Unknown top-level file '$fname' in $SOURCE_DIR — not synced and not in exclusion list"
    SYNC_WARNINGS="${SYNC_WARNINGS}  - New top-level file '$fname' found but not synced\n"
  fi
done

# Guard: base-core-migration.md must exist
MIGRATION_SOURCE=$(ls "$SOURCE_DIR"/[0-9]*-base-core-migration.md 2>/dev/null | head -1)
if [ -z "$MIGRATION_SOURCE" ]; then
  echo "WARNING: base-core-migration.md not found in $SOURCE_DIR — check filename"
  SYNC_WARNINGS="${SYNC_WARNINGS}  - base-core-migration.md missing from source\n"
fi

# ---------------------------------------------------------------------------
# Guard: detect slug collisions — two source files that would produce the same
# basename after stripping numeric prefixes. Each collision requires a rename
# entry in both sync-motoko.sh and syncRenames in postprocess-motoko.mjs.
# ---------------------------------------------------------------------------
echo "  Checking for slug collisions in source..."
python3 - <<'PYEOF'
import os, re, sys
from collections import defaultdict

source = ".sources/motoko/doc/md"
sections = ["fundamentals", "icp-features", "reference"]
found = False
for section in sections:
    seen = defaultdict(list)
    base = os.path.join(source, section)
    if not os.path.isdir(base):
        continue
    for root, dirs, files in os.walk(base):
        for f in files:
            if not (f.endswith(".md") or f.endswith(".mdx")):
                continue
            if f == "index.md":
                continue
            flat = re.sub(r"^\d+-", "", f)
            rel = os.path.relpath(os.path.join(root, f), base)
            seen[flat].append(rel)
    for name, paths in sorted(seen.items()):
        if len(paths) > 1:
            print(f"WARNING: slug collision in {section}/: '{name}' produced by: {', '.join(paths)}")
            print(f"  Add a rename entry to sync-motoko.sh and syncRenames in postprocess-motoko.mjs")
            found = True
if not found:
    print("  No slug collisions found.")
PYEOF

VERSION=$(git -C .sources/motoko describe --tags --exact-match 2>/dev/null \
  || git -C .sources/motoko rev-parse --short HEAD)
echo "Syncing Motoko docs from caffeinelabs/motoko@$VERSION..."

# ---------------------------------------------------------------------------
# Preserve hand-written index.md
# ---------------------------------------------------------------------------
INDEX_BACKUP=$(mktemp)
cp "$TARGET_DIR/index.md" "$INDEX_BACKUP"

# ---------------------------------------------------------------------------
# Clear previously-synced content
# ---------------------------------------------------------------------------
for dir in fundamentals icp-features reference; do
  rm -rf "$TARGET_DIR/$dir"
done
rm -f "$TARGET_DIR/base-core-migration.md"

# ---------------------------------------------------------------------------
# Helper: strip numeric prefix from a filename (e.g. "3-functions.md" → "functions.md")
# ---------------------------------------------------------------------------
strip_num() {
  basename "$1" | sed 's/^[0-9]*-//'
}

# ---------------------------------------------------------------------------
# Copy fundamentals/ preserving subdirectory structure
#
# Source layout (after init):
#   fundamentals/
#     0-hello-world.md          top-level standalone page
#     1-basic-syntax/           → basic-syntax/
#     2-actors/                 → actors/
#       6-orthogonal-persistence/ → actors/orthogonal-persistence/
#     3-types/                  → types/
#     4-declarations/           → declarations/
#     5-control-flow/           → control-flow/
#     7-modules-imports.md      top-level standalone
#     8-pattern-matching.md     top-level standalone
#     9-error-handling.md       top-level standalone
#     10-contextual-dot.md      top-level standalone
#     11-implicit-parameters.md top-level standalone
# ---------------------------------------------------------------------------
FUND_SRC="$SOURCE_DIR/fundamentals"
FUND_DST="$TARGET_DIR/fundamentals"
mkdir -p "$FUND_DST"
echo "  Copying fundamentals/..."

# Top-level standalone .md files (skip index.md, _category_.yml)
find "$FUND_SRC" -maxdepth 1 -name '*.md' -o -name '*.mdx' | while read -r f; do
  base=$(basename "$f")
  [ "$base" = "index.md" ] && continue
  dest=$(strip_num "$f")
  cp "$f" "$FUND_DST/$dest"
done

# First-level subdirectories → clean-named subdirs
find "$FUND_SRC" -mindepth 1 -maxdepth 1 -type d | sort | while read -r subdir; do
  clean=$(basename "$subdir" | sed 's/^[0-9]*-//')
  dst_sub="$FUND_DST/$clean"
  mkdir -p "$dst_sub"

  # Files directly inside this subdirectory
  find "$subdir" -maxdepth 1 \( -name '*.md' -o -name '*.mdx' \) ! -name 'index.md' | sort | while read -r f; do
    dest=$(strip_num "$f")
    # Rename types/functions.md → function-types.md to avoid slug collision
    # with basic-syntax/functions.md (both would otherwise flatten to "functions")
    if [ "$clean" = "types" ] && [ "$dest" = "functions.md" ]; then
      dest="function-types.md"
    fi
    cp "$f" "$dst_sub/$dest"
  done

  # Second-level subdirectories (e.g. actors/6-orthogonal-persistence/)
  find "$subdir" -mindepth 1 -maxdepth 1 -type d | sort | while read -r subsubdir; do
    clean2=$(basename "$subsubdir" | sed 's/^[0-9]*-//')
    dst_sub2="$dst_sub/$clean2"
    mkdir -p "$dst_sub2"
    find "$subsubdir" \( -name '*.md' -o -name '*.mdx' \) ! -name 'index.md' | sort | while read -r f; do
      dest=$(strip_num "$f")
      cp "$f" "$dst_sub2/$dest"
    done
  done
done
echo "    Copied fundamentals/ with subdirectory structure"

# ---------------------------------------------------------------------------
# Copy icp-features/ flat
# ---------------------------------------------------------------------------
ICP_SRC="$SOURCE_DIR/icp-features"
ICP_DST="$TARGET_DIR/icp-features"
mkdir -p "$ICP_DST"
find "$ICP_SRC" -maxdepth 1 \( -name '*.md' -o -name '*.mdx' \) ! -name 'index.md' | sort | while read -r f; do
  dest=$(strip_num "$f")
  cp "$f" "$ICP_DST/$dest"
done
echo "  Copied icp-features/ (flat)"

# ---------------------------------------------------------------------------
# Copy reference/ flat (the three files in the subdir)
# ---------------------------------------------------------------------------
REF_SRC="$SOURCE_DIR/reference"
REF_DST="$TARGET_DIR/reference"
mkdir -p "$REF_DST"
find "$REF_SRC" -maxdepth 1 \( -name '*.md' -o -name '*.mdx' \) ! -name 'index.md' | sort | while read -r f; do
  dest=$(strip_num "$f")
  cp "$f" "$REF_DST/$dest"
done

# Add the three top-level reference files (previously missing)
for entry in \
  "14-style.md:style-guide.md" \
  "15-compiler-ref.md:compiler-ref.md" \
  "16-language-manual.md:language-manual.md"; do
  src_name="${entry%%:*}"
  dst_name="${entry##*:}"
  src_path="$SOURCE_DIR/$src_name"
  if [ -f "$src_path" ]; then
    cp "$src_path" "$REF_DST/$dst_name"
    echo "  Copied reference/$dst_name (from $src_name)"
  else
    echo "WARNING: $src_name not found — check filename"
    SYNC_WARNINGS="${SYNC_WARNINGS}  - $src_name not found in source\n"
  fi
done
echo "  Copied reference/"

# ---------------------------------------------------------------------------
# Copy base-core-migration guide
# ---------------------------------------------------------------------------
if [ -n "$MIGRATION_SOURCE" ]; then
  cp "$MIGRATION_SOURCE" "$TARGET_DIR/base-core-migration.md"
  echo "  Copied base-core-migration.md"
fi

# ---------------------------------------------------------------------------
# Restore hand-written index.md
# ---------------------------------------------------------------------------
cp "$INDEX_BACKUP" "$TARGET_DIR/index.md"
rm -f "$INDEX_BACKUP"

# ---------------------------------------------------------------------------
# Convert .mdx → .md, stripping import lines
# ---------------------------------------------------------------------------
echo "  Converting .mdx to .md..."
find "$TARGET_DIR" -name '*.mdx' | while read -r f; do
  newfile="${f%.mdx}.md"
  mv "$f" "$newfile"
  sed -i '' '/^import /d' "$newfile" 2>/dev/null || sed -i '/^import /d' "$newfile"
done

# ---------------------------------------------------------------------------
# Inject frontmatter where missing or incomplete
# ---------------------------------------------------------------------------
echo "  Injecting frontmatter..."
find "$TARGET_DIR" -name '*.md' ! -path "$TARGET_DIR/index.md" | while read -r f; do
  if ! grep -q '^---' "$f"; then
    heading=$(grep -m1 '^# ' "$f" | sed 's/^# //')
    title="${heading:-Motoko}"
    tmpfile=$(mktemp)
    printf -- '---\ntitle: "%s"\ndescription: "Motoko language documentation"\n---\n\n' "$title" > "$tmpfile"
    cat "$f" >> "$tmpfile"
    mv "$tmpfile" "$f"
  else
    if ! grep -q '^title:' "$f"; then
      heading=$(grep -m1 '^# ' "$f" | sed 's/^# //')
      if [ -n "$heading" ]; then
        sed -i '' "2a\\
title: \"$heading\"" "$f" 2>/dev/null || sed -i "2a\\title: \"$heading\"" "$f"
      fi
    fi
    if ! grep -q '^description:' "$f"; then
      sed -i '' "2a\\
description: \"Motoko language documentation\"" "$f" 2>/dev/null \
        || sed -i "2a\\description: \"Motoko language documentation\"" "$f"
    fi
  fi
done

# ---------------------------------------------------------------------------
# Post-process: remove duplicate H1s, rewrite links, expand file-embeds,
#               clean up nav files, and rewrite external → internal links.
# ---------------------------------------------------------------------------
echo "  Post-processing..."
POSTPROCESS_OUTPUT=$(node scripts/postprocess-motoko.mjs 2>&1)
echo "$POSTPROCESS_OUTPUT"
while IFS= read -r line; do
  case "$line" in
    *"UNRESOLVED-EXTERNAL:"*) SYNC_WARNINGS="${SYNC_WARNINGS}  - $line\n" ;;
  esac
done <<< "$POSTPROCESS_OUTPUT"

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
