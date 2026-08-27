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

# Prune directories left behind by submodules this repo no longer vendors. An
# existing clone keeps them on disk after the submodule is removed, and a stale
# .sources/icp-cli/ is exactly the trap the "verify at the pinned ref" rule
# exists to close: it looks authoritative while being frozen at whatever ref it
# was last checked out at.
#
# A directory is removed only when it is both undeclared in .gitmodules and
# recognisable as a former submodule working tree, meaning it is empty or holds
# a .git entry. Anything else parked under .sources/ is reported and left alone,
# so this never deletes someone's scratch directory.
declared=$(git config -f .gitmodules --get-regexp path 2>/dev/null | awk '{print $2}')
stale=0
for dir in .sources/*/; do
  [ -d "$dir" ] || continue
  path="${dir%/}"
  if printf '%s\n' "$declared" | grep -qxF "$path"; then
    continue
  fi
  if [ -e "$path/.git" ] || [ -z "$(ls -A "$path" 2>/dev/null)" ]; then
    rm -rf "$path"
    warn "removed stale $path (no longer a submodule)"
    stale=$((stale + 1))
  else
    warn "left $path alone: not declared in .gitmodules and not a submodule working tree"
  fi
done
if [ $stale -gt 0 ]; then
  echo "  Verify watched upstreams at the ref pinned in .sources/upstream.json;"
  echo "  see AGENTS.md \"Source material\"."
fi

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
