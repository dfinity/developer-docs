#!/usr/bin/env bash
# Syncs Motoko language docs from caffeinelabs/motoko on release.
# Flattens numbered subdirectories (e.g. 1-basic-syntax/) into the parent.
# Usage: ./scripts/sync-motoko.sh [tag]
# If no tag provided, uses latest release tag.
set -euo pipefail

REPO="caffeinelabs/motoko"
TARGET_DIR="src/content/docs/languages/motoko"
TEMP_DIR=$(mktemp -d)
INDEX_BACKUP=$(mktemp)

TAG="${1:-}"

if [ -z "$TAG" ]; then
  echo "Fetching latest release tag from $REPO..."
  TAG=$(gh release view --repo "$REPO" --json tagName -q '.tagName' 2>/dev/null || echo "")
  if [ -z "$TAG" ]; then
    echo "ERROR: Could not determine latest release tag. Pass a tag as argument."
    exit 1
  fi
fi

echo "Syncing Motoko docs from $REPO@$TAG..."

# Clone at the specific tag
git clone --depth 1 --branch "$TAG" "https://github.com/$REPO.git" "$TEMP_DIR" 2>/dev/null

SOURCE_DIR="$TEMP_DIR/doc/md"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "ERROR: $SOURCE_DIR not found in $REPO@$TAG"
  rm -rf "$TEMP_DIR"
  exit 1
fi

# Preserve our hand-written index.md
if [ -f "$TARGET_DIR/index.md" ]; then
  cp "$TARGET_DIR/index.md" "$INDEX_BACKUP"
  echo "  Backed up index.md"
fi

# Clear target subdirectories
for dir in fundamentals icp-features reference; do
  rm -rf "$TARGET_DIR/$dir"
done

# Sync only fundamentals, icp-features, and reference (NOT base/core library docs)
for dir in fundamentals icp-features reference; do
  if [ -d "$SOURCE_DIR/$dir" ]; then
    cp -r "$SOURCE_DIR/$dir" "$TARGET_DIR/"
    echo "  Copied $dir/"
  fi
done

# Restore our hand-written index.md
if [ -f "$INDEX_BACKUP" ] && [ -s "$INDEX_BACKUP" ]; then
  cp "$INDEX_BACKUP" "$TARGET_DIR/index.md"
  echo "  Restored index.md"
fi
rm -f "$INDEX_BACKUP"

# ── Flatten numbered subdirectories ──
# The Motoko repo uses directories like fundamentals/1-basic-syntax/, fundamentals/2-actors/
# which create deeply nested sidebar groups in Starlight. Flatten them: move all .md files
# up one level, strip the numeric prefix from filenames, and remove empty directories.
echo "  Flattening nested directories..."

for section in fundamentals icp-features reference; do
  section_dir="$TARGET_DIR/$section"
  [ -d "$section_dir" ] || continue

  # Find numbered subdirectories (e.g. 1-basic-syntax, 2-actors, 3-types)
  find "$section_dir" -mindepth 1 -maxdepth 1 -type d | sort | while read -r subdir; do
    dirname=$(basename "$subdir")

    # Move all .md files from the subdirectory up to the section level
    find "$subdir" -maxdepth 1 -name '*.md' -not -name 'index.md' | while read -r file; do
      filename=$(basename "$file")
      # Strip leading number prefix from filename (e.g. 1-defining-an-actor.md -> defining-an-actor.md)
      newname=$(echo "$filename" | sed 's/^[0-9]*-//')
      mv "$file" "$section_dir/$newname"
    done

    # Handle nested sub-subdirectories (e.g. fundamentals/2-actors/6-orthogonal-persistence/)
    find "$subdir" -mindepth 1 -maxdepth 1 -type d | while read -r subsubdir; do
      find "$subsubdir" -name '*.md' -not -name 'index.md' | while read -r file; do
        filename=$(basename "$file")
        newname=$(echo "$filename" | sed 's/^[0-9]*-//')
        # Prefix with parent dir name to avoid collisions
        parent=$(basename "$subsubdir" | sed 's/^[0-9]*-//')
        mv "$file" "$section_dir/${parent}-${newname}"
      done
      rm -rf "$subsubdir"
    done

    # Remove the now-empty subdirectory (and its index.md which was a TOC page)
    rm -rf "$subdir"
    echo "    Flattened $section/$dirname/"
  done
done

# ── Transform .mdx → .md ──
find "$TARGET_DIR" -name '*.mdx' | while read -r file; do
  newfile="${file%.mdx}.md"
  mv "$file" "$newfile"
  sed -i '' '/^import /d' "$newfile" 2>/dev/null || sed -i '/^import /d' "$newfile"
  echo "  Converted $(basename "$file") → $(basename "$newfile")"
done

# ── Inject required frontmatter ──
# Helper: add frontmatter to a file
inject_frontmatter() {
  local file="$1"
  local today
  today=$(date +%Y-%m-%d)

  if grep -q '^---' "$file"; then
    # Has frontmatter — inject missing fields
    if ! grep -q '^title:' "$file"; then
      heading=$(grep -m1 '^# ' "$file" | sed 's/^# //')
      if [ -n "$heading" ]; then
        sed -i '' "2a\\
title: \"$heading\"
" "$file" 2>/dev/null || sed -i "2a\\title: \"$heading\"" "$file"
      fi
    fi
    for field_line in \
      "description: Motoko language documentation" \
      "doc_type: reference" \
      "level: intermediate" \
      "last_verified: $today" \
      "source_repo: https://github.com/$REPO" \
      "source_ref: $TAG"; do
      field=$(echo "$field_line" | cut -d: -f1)
      if ! grep -q "^${field}:" "$file"; then
        sed -i '' "2a\\
$field_line
" "$file" 2>/dev/null || sed -i "2a\\$field_line" "$file"
      fi
    done
  else
    # No frontmatter — create it
    heading=$(grep -m1 '^# ' "$file" | sed 's/^# //')
    title="${heading:-Motoko}"
    tmpfile=$(mktemp)
    cat > "$tmpfile" << FMEOF
---
title: "$title"
description: "Motoko language documentation"
doc_type: reference
level: intermediate
last_verified: $today
source_repo: https://github.com/$REPO
source_ref: $TAG
---

FMEOF
    cat "$file" >> "$tmpfile"
    mv "$tmpfile" "$file"
  fi
}

find "$TARGET_DIR" -name '*.md' -not -path "$TARGET_DIR/index.md" | while read -r file; do
  inject_frontmatter "$file"
done

rm -rf "$TEMP_DIR"

# ── Post-process: fix H1 duplicates, rewrite links, remove nav files ──
echo "  Post-processing (H1 removal, link rewriting)..."
node scripts/postprocess-motoko.mjs

file_count=$(find "$TARGET_DIR" -name '*.md' | wc -l | tr -d ' ')
echo ""
echo "Sync complete. $file_count Motoko docs from $REPO@$TAG in $TARGET_DIR/"
echo "Run 'npm run validate' to check for issues."
