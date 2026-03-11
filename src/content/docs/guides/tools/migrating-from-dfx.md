---
title: "Migrating from dfx"
description: "Migration guide from dfx to icp-cli"
sidebar:
  order: 2
doc_type: how-to
level: intermediate
source_repo: https://github.com/dfinity/icp-cli
source_ref: null
last_verified: 2026-03-10
---

The `dfx` command-line tool has been replaced by `icp-cli` (invoked as `icp`). This page provides a brief overview of what changed and links to the full migration guide.

> Detailed migration content is synced from the [icp-cli repository](https://github.com/dfinity/icp-cli). This page serves as an entry point.

## Why the change?

The `dfx` CLI was renamed to `icp` to better align with ICP's branding and to accompany architectural improvements:

- Clearer command naming and consistent flag conventions.
- New configuration format (`icp.yaml` replaces `dfx.json`).
- Improved build pipeline with built-in Wasm optimization.
- Better support for multi-canister projects.

## Installing icp-cli

```bash
# npm (recommended)
npm install -g @icp-sdk/icp-cli @icp-sdk/ic-wasm

# or Homebrew
brew install icp-cli ic-wasm

# or shell script
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/dfinity/icp-cli/releases/latest/download/icp-cli-installer.sh | sh
```

Verify the installation:

```bash
icp --version
```

## Quick command mapping

| dfx command | icp equivalent |
|-------------|----------------|
| `dfx new` | `icp new` |
| `dfx start` | `icp network start` |
| `dfx deploy` | `icp deploy` |
| `dfx canister call` | `icp canister call` |
| `dfx canister status` | `icp canister status` |
| `dfx identity whoami` | `icp identity principal` |
| `dfx stop` | `icp network stop` |
| `dfx build` | `icp build` |

Most commands have a direct equivalent. The `icp` CLI maintains backward compatibility for common workflows.

## Configuration migration

Projects using `dfx.json` should migrate to `icp.yaml`. The structure is similar but uses YAML format with updated field names:

**dfx.json (old):**
```json
{
  "canisters": {
    "my_canister": {
      "type": "motoko",
      "main": "src/main.mo"
    }
  }
}
```

**icp.yaml (new):**
```yaml
canisters:
  - name: my_canister
    recipe:
      type: "@dfinity/motoko@v4.1.0"
      configuration:
        main: src/main.mo
```

`icp-cli` can read `dfx.json` files for backward compatibility, but new projects should use `icp.yaml`.

## Identity and wallet compatibility

Your existing identities and cycles wallets work with `icp-cli` without changes. The identity store location remains the same.

## Full migration guide

For the complete migration guide including breaking changes, edge cases, and troubleshooting, see the [icp-cli migration documentation](https://github.com/dfinity/icp-cli/blob/main/docs/migration.md).

## Further reading

- [Developer tools overview](/guides/tools/overview/) -- All ICP development tools.
- [icp-cli repository](https://github.com/dfinity/icp-cli)
