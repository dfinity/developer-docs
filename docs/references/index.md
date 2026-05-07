---
title: "References"
description: "Specifications, canister IDs, token standards, cycle costs, and technical reference for ICP"
sidebar:
  hidden: true
---

Technical reference material for ICP development. These pages cover exact specifications, canister IDs, costs, and error codes.

## Tools

- **[Developer Tools](developer-tools.md)**: icp-cli, CDKs, JS SDK, PocketIC, ICP Ninja, and other toolchain components.

## Canisters

- **[Management Canister](management-canister.md)**: API reference for the IC management canister (`aaaaa-aa`): canister lifecycle, signing, randomness, and more.
- **[System Canisters](system-canisters.md)**: NNS canisters, Internet Identity, ICP ledger, and other system-level canisters with IDs.
- **[Protocol Canisters](protocol-canisters.md)**: Bitcoin canister, EVM RPC canister, exchange rate canister, and other protocol-level canisters.
- **[Application Canisters](application-canisters.md)**: Asset canister, SNS canisters, LLM canister, and other application-layer canisters.

## Tokens and costs

- **[ICRC Standards](icrc-standards.md)**: Index of all adopted ICRC standards grouped by category.
- **[Digital Asset Standards](digital-asset-standards.md)**: ICRC-1, ICRC-2, ICRC-3, ICRC-7, and ICRC-37 in full detail.
- **[Chain-Key Token Canister IDs](chain-key-canister-ids.md)**: Mainnet and testnet canister IDs for ckBTC, ckETH, ckERC20, ckDOGE, and ckSOL.
- **[Cycles costs](cycles-costs.md)**: Exact cycle costs for compute, storage, HTTPS outcalls, signing, and canister operations.
- **[Subnet Types](subnet-types.md)**: All subnet types with node counts, replication factors, and cycle cost multipliers.

## Errors and debugging

- **[Execution Errors](execution-errors.md)**: Common canister execution errors with explanations and fixes.

## Specifications

- **[IC Interface Specification](ic-interface-spec/index.md)**: System API, HTTPS interface, certified data, management canister, and formal specification of the Internet Computer.
- **[HTTP Gateway Specification](http-gateway-protocol-spec.md)**: How boundary nodes serve canister HTTP responses with certification verification.
- **[Candid Specification](candid-spec.md)**: The Candid interface description language: type system, encoding, and subtyping rules.
- **[Internet Identity Specification](internet-identity-spec.md)**: Delegation chains, passkey management, and canister signatures.

## Governance

- **[NNS Proposal Types](nns-proposal-types.md)**: All NNS proposal topics and their proposal types, with descriptions of what each type does on adoption.
- **[SNS Settings](sns-settings.md)**: Reference for all SNS nervous system parameters: voting power, governance rules, asset economics, and reward behavior.

## Network observability

- **[IC Dashboard APIs](ic-dashboard-api.md)**: Five public REST APIs for querying live network state: metrics, governance, ICRC tokens, ICP ledger, and SNS data.

## Terminology

- **[Glossary](glossary.md)**: Definitions of ICP-specific terms: canister, cycle, principal, subnet, and more.
