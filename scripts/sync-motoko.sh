#!/usr/bin/env bash
# Syncs Motoko language docs from .sources/motoko into docs/languages/motoko/.
# Flattens numbered subdirectories, converts .mdx -> .md, injects frontmatter.
# Usage: ./scripts/sync-motoko.sh
set -euo pipefail

SOURCE_DIR=".sources/motoko/doc/md"
TARGET_DIR="docs/languages/motoko"

if [ ! -d "$SOURCE_DIR/fundamentals" ]; then
  echo "ERROR: .sources/motoko not initialized. Run: git submodule update --init --depth 1 .sources/motoko"
  exit 1
fi

# Guard: detect new content sections not in the known lists.
# SYNCED_SECTIONS: directories we actively copy into docs/languages/motoko/.
# EXCLUDED_SECTIONS: directories intentionally skipped (links redirected or not doc content).
SYNCED_SECTIONS="fundamentals icp-features reference"
EXCLUDED_SECTIONS="base core examples motoko-tooling old"
SYNC_WARNINGS=""
for dir in "$SOURCE_DIR"/*/; do
  section=$(basename "$dir")
  if ! echo "$SYNCED_SECTIONS" | grep -qw "$section" && \
     ! echo "$EXCLUDED_SECTIONS" | grep -qw "$section"; then
    echo "WARNING: Unknown section '$section' in $SOURCE_DIR — not synced and not in exclusion list"
    SYNC_WARNINGS="${SYNC_WARNINGS}  - New section '$section' found but not synced — add it to sync-motoko.sh\n"
  fi
done

# Guard: base-core-migration.md must exist (filename prefix may change across releases)
MIGRATION_SOURCE=$(ls "$SOURCE_DIR"/[0-9]*-base-core-migration.md 2>/dev/null | head -1)
if [ -z "$MIGRATION_SOURCE" ]; then
  echo "WARNING: base-core-migration.md not found in $SOURCE_DIR — check filename"
  SYNC_WARNINGS="${SYNC_WARNINGS}  - base-core-migration.md missing from source — filename may have changed\n"
fi

VERSION=$(git -C .sources/motoko describe --tags --exact-match 2>/dev/null \
  || git -C .sources/motoko rev-parse --short HEAD)
echo "Syncing Motoko docs from caffeinelabs/motoko@$VERSION..."

# Preserve hand-written index.md
INDEX_BACKUP=$(mktemp)
cp "$TARGET_DIR/index.md" "$INDEX_BACKUP"

# Clear synced content
for dir in fundamentals icp-features reference; do
  rm -rf "$TARGET_DIR/$dir"
done
rm -f "$TARGET_DIR/base-core-migration.md"

# Copy sections
for dir in fundamentals icp-features reference; do
  if [ -d "$SOURCE_DIR/$dir" ]; then
    cp -r "$SOURCE_DIR/$dir" "$TARGET_DIR/"
    echo "  Copied $dir/"
  fi
done

# Copy base-core-migration guide (linked from index, intentionally not in sidebar)
if [ -n "$MIGRATION_SOURCE" ]; then
  cp "$MIGRATION_SOURCE" "$TARGET_DIR/base-core-migration.md"
  echo "  Copied base-core-migration.md"
fi

# Restore hand-written index.md
cp "$INDEX_BACKUP" "$TARGET_DIR/index.md"
rm -f "$INDEX_BACKUP"

# Flatten: move files from numbered subdirectories up to the section level
echo "  Flattening numbered directories..."
for section in fundamentals icp-features reference; do
  section_dir="$TARGET_DIR/$section"
  [ -d "$section_dir" ] || continue

  find "$section_dir" -mindepth 1 -maxdepth 1 -type d | sort | while read -r subdir; do
    # Move files one level up, stripping numeric prefix from filenames
    find "$subdir" -maxdepth 1 \( -name '*.md' -o -name '*.mdx' \) ! -name 'index.md' | while read -r file; do
      newname=$(basename "$file" | sed 's/^[0-9]*-//')
      mv "$file" "$section_dir/$newname"
    done

    # Handle one level deeper (e.g. 2-actors/6-orthogonal-persistence/)
    find "$subdir" -mindepth 1 -maxdepth 1 -type d | while read -r subsubdir; do
      parent=$(basename "$subsubdir" | sed 's/^[0-9]*-//')
      find "$subsubdir" \( -name '*.md' -o -name '*.mdx' \) ! -name 'index.md' | while read -r file; do
        newname=$(basename "$file" | sed 's/^[0-9]*-//')
        mv "$file" "$section_dir/${parent}-${newname}"
      done
      rm -rf "$subsubdir"
    done

    rm -rf "$subdir"
    echo "    Flattened $section/$(basename "$subdir")/"
  done

  # Strip numeric prefix from top-level files within each section
  find "$section_dir" -maxdepth 1 \( -name '*.md' -o -name '*.mdx' \) | while read -r file; do
    newname=$(basename "$file" | sed 's/^[0-9]*-//')
    if [ "$(basename "$file")" != "$newname" ]; then
      mv "$file" "$section_dir/$newname"
    fi
  done
done

# Convert .mdx -> .md, stripping import lines
echo "  Converting .mdx to .md..."
find "$TARGET_DIR" -name '*.mdx' | while read -r file; do
  newfile="${file%.mdx}.md"
  mv "$file" "$newfile"
  sed -i '' '/^import /d' "$newfile" 2>/dev/null || sed -i '/^import /d' "$newfile"
done

# Inject frontmatter where missing or incomplete
echo "  Injecting frontmatter..."
find "$TARGET_DIR" -name '*.md' ! -path "$TARGET_DIR/index.md" | while read -r file; do
  if ! grep -q '^---' "$file"; then
    heading=$(grep -m1 '^# ' "$file" | sed 's/^# //')
    title="${heading:-Motoko}"
    tmpfile=$(mktemp)
    printf -- '---\ntitle: "%s"\ndescription: "Motoko language documentation"\n---\n\n' "$title" > "$tmpfile"
    cat "$file" >> "$tmpfile"
    mv "$tmpfile" "$file"
  else
    if ! grep -q '^title:' "$file"; then
      heading=$(grep -m1 '^# ' "$file" | sed 's/^# //')
      if [ -n "$heading" ]; then
        sed -i '' "2a\\
title: \"$heading\"" "$file" 2>/dev/null || sed -i "2a\\title: \"$heading\"" "$file"
      fi
    fi
    if ! grep -q '^description:' "$file"; then
      sed -i '' "2a\\
description: \"Motoko language documentation\"" "$file" 2>/dev/null \
        || sed -i "2a\\description: \"Motoko language documentation\"" "$file"
    fi
  fi
done

# Post-process: remove duplicate H1s, rewrite relative links, clean up nav files
echo "  Post-processing..."
node scripts/postprocess-motoko.mjs

file_count=$(find "$TARGET_DIR" -name '*.md' | wc -l | tr -d ' ')
echo ""
echo "Sync complete: $file_count files from caffeinelabs/motoko@$VERSION in $TARGET_DIR/"
echo "Run 'npm run build' to verify."

# Write warnings to a file so CI can include them in the PR body
if [ -n "$SYNC_WARNINGS" ]; then
  printf "%b" "$SYNC_WARNINGS" > /tmp/sync-motoko-warnings.txt
  echo ""
  echo "WARNINGS (manual review required):"
  printf "%b" "$SYNC_WARNINGS"
fi
