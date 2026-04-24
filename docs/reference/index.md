---
title: "Reference"
description: "Specifications, canister IDs, token standards, cycle costs, and technical reference for ICP"
sidebar:
  hidden: true
---

Technical reference material for ICP development. These pages cover exact specifications, canister IDs, costs, and error codes.

## Canisters

- **[Management Canister](management-canister.md)**: API reference for the IC management canister (`aaaaa-aa`): canister lifecycle, signing, randomness, and more.
- **[System Canisters](system-canisters.md)**: NNS canisters, Internet Identity, ICP ledger, and other system-level canisters with IDs.
- **[Protocol Canisters](protocol-canisters.md)**: Bitcoin canister, EVM RPC canister, exchange rate canister, and other protocol-level canisters.
- **[Application Canisters](application-canisters.md)**: Asset canister, SNS canisters, LLM canister, and other application-layer canisters.

## Tokens and costs

- **[Token Standards](token-standards.md)**: ICRC-1 fungible tokens, ICRC-2 approval, ICRC-3 transaction log, and ICRC-7 NFTs.
- **[Cycles Costs](cycles-costs.md)**: Exact cycle costs for compute, storage, HTTPS outcalls, signing, and canister operations.
- **[Subnet Types](subnet-types.md)**: All subnet types with node counts, replication factors, and cycle cost multipliers.

## Errors and debugging

- **[Execution Errors](execution-errors.md)**: Common canister execution errors with explanations and fixes.

## Specifications

- **[IC Interface Specification](ic-interface-spec.md)**: System API, HTTP interface, and certified data specification.
- **[HTTP Gateway Specification](http-gateway-spec.md)**: How boundary nodes serve canister HTTP responses with certification verification.
- **[Candid Specification](candid-spec.md)**: The Candid interface description language: type system, encoding, and subtyping rules.
- **[Internet Identity Specification](internet-identity-spec.md)**: Delegation chains, passkey management, and canister signatures.

## Other

- **[Glossary](glossary.md)**: Definitions of ICP-specific terms: canister, cycle, principal, subnet, and more.
