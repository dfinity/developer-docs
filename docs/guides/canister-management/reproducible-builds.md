---
title: "Reproducible Builds"
description: "Verify that deployed canister Wasm matches the source code using deterministic builds"
sidebar:
  order: 6
---

TODO: Write content for this page.

<!-- Content Brief -->
Build and verify canisters deterministically so users can confirm deployed code matches the published source. Cover Docker-based reproducible builds, sha256 hash verification, the @dfinity/prebuilt recipe for deploying verified Wasm, and how to document your build process. Explain why reproducibility matters for canister trust.

<!-- Source Material -->
- Portal: building-apps/best-practices/reproducible-builds.mdx
- Recipe: @dfinity/prebuilt (sha256 verification)
- icp-cli: prebuilt recipe configuration

<!-- Cross-Links -->
- guides/canister-management/lifecycle -- build and deploy workflow
- concepts/security -- trust model for canisters
- guides/canister-management/cycles-management -- deploying verified builds
