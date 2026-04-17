#!/usr/bin/env bash
# Bootstrap script for agents and contributors.
# Run once after cloning, or any time you suspect the environment is stale.
#
# Usage: ./scripts/setup.sh [--skip-build]

set -euo pipefail

SKIP_BUILD=false
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
  esac
done

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

ok()   { printf "${GREEN}✓${NC} %s\n" "$1"; }
warn() { printf "${YELLOW}!${NC} %s\n" "$1"; }
fail() { printf "${RED}✗${NC} %s\n" "$1"; }

errors=0

# ---------------------------------------------------------------------------
# 1. Git submodules (.sources/)
# ---------------------------------------------------------------------------
printf "\n== Source material submodules ==\n"
echo "Initializing submodules (shallow, no-op for already-initialized ones)..."
git submodule update --init --depth 1
ok "Submodules initialized"

# ---------------------------------------------------------------------------
# 2. Node dependencies
# ---------------------------------------------------------------------------
printf "\n== Node dependencies ==\n"
if [ -d "node_modules" ]; then
  ok "node_modules exists"
else
  echo "Installing npm dependencies..."
  npm install
  ok "npm install complete"
fi

# ---------------------------------------------------------------------------
# 3. Build check (skipped when --skip-build is passed)
# ---------------------------------------------------------------------------
if $SKIP_BUILD; then
  printf "\n== Build check (skipped) ==\n"
else
  printf "\n== Build check ==\n"
  if npm run build --silent 2>/dev/null; then
    ok "Site builds successfully"
  else
    fail "Build failed — run 'npm run build' to see errors"
    errors=$((errors + 1))
  fi
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
printf "\n"
if [ $errors -eq 0 ]; then
  ok "All set. Check GitHub Issues for available tasks: https://github.com/dfinity/developer-docs/issues"
else
  warn "$errors issue(s) found — see above."
fi
