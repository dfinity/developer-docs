#!/usr/bin/env bash
# Fails if any .mdx files exist in the docs directory.
set -euo pipefail

DOCS_DIR="src/content/docs"

echo "Checking for .mdx files in $DOCS_DIR..."

matches=$(find "$DOCS_DIR" -name '*.mdx' 2>/dev/null || true)

if [ -n "$matches" ]; then
  echo ""
  echo "ERROR: Found .mdx files:"
  echo "$matches"
  echo ""
  echo "Only plain .md files are allowed. Convert to .md and remove JSX."
  exit 1
fi

echo "No .mdx files found."
