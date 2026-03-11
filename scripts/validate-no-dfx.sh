#!/usr/bin/env bash
# Fails if any .md file references 'dfx' outside of HTML comments (except in the migration guide).
set -euo pipefail

DOCS_DIR="src/content/docs"
EXCLUDE_DIR="tools/migrating-from-dfx"
EXCLUDE_FILE="tools/migrating-from-dfx.md"

echo "Checking for dfx references in $DOCS_DIR (excluding $EXCLUDE_DIR)..."

# Find all .md files excluding migration guide and synced content (which may reference dfx)
files=$(find "$DOCS_DIR" -name '*.md' \
  -not -path "*/$EXCLUDE_DIR/*" \
  -not -path "*/$EXCLUDE_FILE" \
  -not -path "*/languages/motoko/fundamentals/*" \
  -not -path "*/languages/motoko/icp-features/*" \
  -not -path "*/languages/motoko/reference/*" \
  2>/dev/null)

found_errors=false

for file in $files; do
  # Strip HTML comments, then check for dfx references
  # This allows writing briefs to mention dfx in <!-- --> comments
  # Also allow references to "migrating from dfx" and "deprecated `dfx`" etc.
  stripped=$(sed '/<!--/,/-->/d' "$file" 2>/dev/null || cat "$file")
  if echo "$stripped" | grep -v -i 'migrating.*from.*dfx\|deprecated.*dfx\|replaces.*dfx\|from dfx' | grep -q '\bdfx\b'; then
    echo "  $file"
    found_errors=true
  fi
done

if [ "$found_errors" = true ]; then
  echo ""
  echo "ERROR: Found dfx references in the files listed above."
  echo "dfx is deprecated. Use icp-cli instead."
  echo "If this is a migration guide, move it to $DOCS_DIR/$EXCLUDE_DIR/"
  echo "(Note: references inside HTML comments <!-- --> are allowed for writing briefs)"
  exit 1
fi

echo "No dfx references found."
