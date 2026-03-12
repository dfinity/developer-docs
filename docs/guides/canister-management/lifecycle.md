---
title: "Canister Lifecycle"
description: "Create, install, upgrade, and delete canisters with icp-cli"
sidebar:
  order: 1
icskills: [cycles-management, stable-memory]
---

TODO: Write content for this page.

<!-- Content Brief -->
Walk through the full canister lifecycle: creation, code installation, upgrades (with pre/post-upgrade hooks), reinstallation, and deletion. Cover the canister factory pattern for programmatic creation. Explain state management across upgrades, the difference between install and upgrade modes, and migration between subnets. Show icp-cli commands for each operation.

<!-- Source Material -->
- Portal: building-apps/canister-management/upgrade.mdx, state.mdx, developing-canisters/create.mdx, compile.mdx, install.mdx, deploy.mdx, delete.mdx, history.mdx, trapping.mdx, advanced/canister-migration.mdx
- icp-cli: concepts/build-deploy-sync.md, guides/canister-migration.md
- icskills: cycles-management, stable-memory
- Examples: canister_factory (Motoko), classes (Motoko), canister-info (Rust)
- Learn Hub: [Canister Control](https://learn.internetcomputer.org/hc/en-us/articles/34573932107796)

<!-- Cross-Links -->
- concepts/canisters -- what is a canister
- guides/backends/data-persistence -- state across upgrades
- guides/canister-management/cycles-management -- cycles for canister creation
- guides/security/canister-upgrades -- upgrade safety
- icp-cli docs: https://dfinity.github.io/icp-cli/
