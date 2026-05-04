---
title: "ICRC Standards"
description: "Index of all adopted ICRC standards on ICP, grouped by category"
sidebar:
  order: 5
---

ICRC stands for Internet Computer Request for Comments. Standards are proposed by the [ICRC working group](https://github.com/dfinity/ICRC), refined through community consensus, and adopted or rejected through NNS governance proposals.

## Digital asset standards

Standards for fungible assets, NFTs, and their extension protocols.

| Standard | Purpose | Extends | Status |
|----------|---------|---------|--------|
| [ICRC-1](digital-asset-standards.md#icrc-1-fungible-tokens) | Fungible token base standard | none | Adopted |
| [ICRC-2](digital-asset-standards.md#icrc-2-approve-and-transfer-from) | Approve and transfer-from | ICRC-1 | Adopted |
| [ICRC-3](digital-asset-standards.md#icrc-3-transaction-log) | Transaction log and block archive | ICRC-1 | Adopted |
| [ICRC-7](digital-asset-standards.md#icrc-7-non-fungible-tokens) | Non-fungible token (NFT) base standard | none | Adopted |
| [ICRC-37](digital-asset-standards.md#icrc-37-nft-approvals) | Approve and transfer-from for NFTs | ICRC-7 | Adopted |

For full method signatures, Candid types, and implementation details, see [Digital Asset Standards](digital-asset-standards.md).

## Wallet signer standards

Standards for wallet and signer interactions between apps and user accounts.

| Standard | Purpose | Status |
|----------|---------|--------|
| [ICRC-21](https://github.com/dfinity/wg-identity-authentication/blob/main/topics/ICRC-21/icrc_21_consent_msg.md) | Canister call consent messages | Adopted |
| [ICRC-25](https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_25_signer_interaction_standard.md) | Signer interaction (permissions) | Adopted |
| [ICRC-27](https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_27_accounts.md) | Account discovery | Adopted |
| [ICRC-29](https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_29_window_post_message_transport.md) | Window PostMessage transport | Adopted |
| [ICRC-49](https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_49_call_canister.md) | Call canister via signer | Adopted |

For implementation details and code examples, see the [wallet integration guide](../guides/digital-assets/wallet-integration.md).

## Next steps

- [Digital Asset Standards](digital-asset-standards.md): complete method signatures, Candid types, and error definitions for each standard
- [Ledgers](../guides/digital-assets/ledgers.md): transfer assets and set up local test ledgers
- [Wallet integration](../guides/digital-assets/wallet-integration.md): add wallet signing to your app
- [ICRC working group](https://github.com/dfinity/ICRC): browse proposed and in-progress standards

<!-- Upstream: informed by dfinity/portal — docs/defi/token-standards/; dfinity/icskills — skills/icrc-ledger/SKILL.md, skills/wallet-integration/SKILL.md -->
