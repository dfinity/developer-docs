---
title: "Chain Fusion"
description: "How ICP connects to Bitcoin, Ethereum, Solana, and other blockchains natively"
sidebar:
  order: 10
---

Chain Fusion is ICP's approach to cross-chain interoperability. Instead of relying on bridges or oracles, canisters interact with other blockchains directly: they can read state, hold assets, and sign and submit transactions on Bitcoin, Ethereum, Solana, and dozens of other chains. All of this runs onchain with the same trust assumptions as the Internet Computer itself.

The foundation is [chain-key cryptography](chain-key-cryptography.md). Each canister can derive keys for external signature schemes (ECDSA and Schnorr) and request threshold signatures from the protocol. This means a canister can control a Bitcoin address, an Ethereum account, or a Solana wallet: without any single node ever holding the private key.

## Why Chain Fusion matters

Most cross-chain solutions introduce a trusted intermediary: a bridge, a multisig, or an oracle network. If that intermediary is compromised, funds are at risk. ICP eliminates this layer entirely.

A canister interacting with Bitcoin or Ethereum has no external dependency beyond the target chain itself. The signing happens inside the protocol through a threshold cryptographic ceremony distributed across subnet nodes. This gives developers several advantages:

- **No bridges.** Canisters hold assets directly on external chains. There is no wrapped token that can depeg, no bridge contract that can be exploited.
- **No oracles.** Canisters can read external chain state themselves: either through a direct protocol integration (Bitcoin) or by querying RPC providers via [HTTPS outcalls](https-outcalls.md).
- **Full autonomy.** Canisters can schedule cross-chain actions using [timers](../guides/backends/timers.md), enabling use cases like automated trading, periodic liquidations, or cronjob services: all without external triggers.
- **Familiar UX.** Because ICP has low-cost computation and [canisters pay for their own cycles](cycles.md), users can interact with cross-chain apps through a standard browser without installing a wallet.

## How it works

Chain Fusion combines three protocol-level capabilities:

### 1. Chain-key signatures

Canisters request threshold ECDSA or Schnorr signatures from the management canister. The protocol derives a unique key for each canister and signs messages without ever reconstructing the private key. This lets canisters control addresses on any blockchain that uses a supported signature scheme.

Two schemes are available:

| Scheme | Supported chains |
|--------|-----------------|
| Threshold ECDSA (`secp256k1`) | Bitcoin, Ethereum, all EVM chains, Filecoin, Cosmos |
| Threshold Schnorr (`bip340secp256k1`) | Bitcoin Taproot, Ordinals |
| Threshold Schnorr (`ed25519`) | Solana, TON, Polkadot, Cardano, NEAR, Stellar |

See [Chain-key cryptography](chain-key-cryptography.md) for details on the threshold signing protocols, key derivation, and deployed keys.

### 2. Reading external chain state

A canister needs to read the state of an external chain to verify events, check balances, or monitor smart contracts. ICP supports two models:

- **Direct integration.** The protocol runs a native adapter that connects to the external chain's peer-to-peer network. Bitcoin uses this model: ICP nodes run a Bitcoin adapter that syncs blocks directly, so canisters can query UTXOs and submit transactions through the management canister's Bitcoin API without any intermediary.

- **RPC integration.** For chains without a direct integration, canisters use [HTTPS outcalls](https-outcalls.md) to query RPC providers. The EVM RPC canister (`7hfb6-caaaa-aaaar-qadga-cai`) provides a typed Candid interface for Ethereum and EVM-compatible chains. It sends each request to at least three independent RPC providers and returns either a `Consistent` result (all providers agree) or an `Inconsistent` result that the caller can handle. Solana has a similar dedicated canister (SOL RPC). For other chains, canisters can make raw HTTPS outcalls to any JSON-RPC endpoint.

### 3. Submitting transactions

Once a canister has signed a transaction, it needs to submit it to the target chain. The submission path depends on the integration model:

- **Bitcoin:** The signed transaction is submitted through the management canister's `bitcoin_send_transaction` API, which broadcasts it via the Bitcoin adapter.
- **Ethereum and EVM chains:** The signed transaction is submitted via the EVM RPC canister's `eth_sendRawTransaction` endpoint, which relays it to RPC providers.
- **Other chains:** The canister submits the transaction by making an HTTPS outcall to the chain's RPC endpoint.

## Integration patterns

The combination of signing, reading, and submitting creates three integration patterns that cover all supported chains:

| Pattern | How state is read | Chains | Trust model |
|---------|------------------|--------|-------------|
| **Direct** | Protocol-level adapter (full node) | Bitcoin, Dogecoin | ICP subnet consensus only |
| **Dedicated RPC canister** | Typed canister queries multiple providers | Ethereum, EVM chains, Solana | ICP consensus + RPC provider agreement |
| **Raw HTTPS outcalls** | Canister makes HTTP requests to RPC endpoints | Any chain with an RPC API | ICP consensus + RPC provider trust |

Direct integration provides the strongest trust guarantees. The only assumption is that a supermajority of subnet nodes are honest. RPC-based integration adds the assumption that at least one of the queried RPC providers returns correct data, which is mitigated by querying multiple independent providers and comparing results.

## Chain-key tokens

Chain-key tokens are digital twins of native assets from other blockchains (for example, ckBTC for Bitcoin and ckETH for Ethereum). Each token is backed 1:1 by the native asset, which is held in a canister-controlled address on the source chain. Minting and burning happen entirely onchain. No bridge, no custodian.

These tokens implement the [ICRC-2](../guides/defi/token-ledgers.md) token standard, so they can be transferred and traded within the ICP ecosystem with the same speed and cost as any other ICP token. When a user wants to redeem the underlying asset, the minter canister signs and submits a withdrawal transaction on the source chain.

For details on integrating with chain-key tokens, see the [Chain-key tokens guide](../guides/defi/chain-key-tokens.md).

## Supported chains

Any blockchain whose transactions use ECDSA (secp256k1), Schnorr (BIP340 over secp256k1), or Ed25519 signatures can be integrated with ICP. The following table lists chains with established integrations or community-built tooling:

| Chain | Signature scheme | Integration method | Chain-key token |
|-------|-----------------|-------------------|-----------------|
| Bitcoin | ECDSA, Schnorr | Direct | ckBTC |
| Ethereum | ECDSA | EVM RPC canister | ckETH, ckERC20 |
| EVM chains (Arbitrum, Base, Optimism, etc.) | ECDSA | EVM RPC canister | - |
| Solana | Ed25519 | SOL RPC canister | ckSOL |
| Dogecoin | ECDSA | Direct | ckDOGE |
| Aptos | ECDSA, Ed25519 | HTTPS outcalls | - |
| Avalanche | ECDSA | HTTPS outcalls | - |
| Cardano | Ed25519 | HTTPS outcalls | - |
| Cosmos | ECDSA | HTTPS outcalls | - |
| NEAR | Ed25519 | HTTPS outcalls | - |
| Polkadot | ECDSA, Ed25519 | HTTPS outcalls | - |
| Stellar | Ed25519 | HTTPS outcalls | - |
| TON | Ed25519 | HTTPS outcalls | - |
| XRP | ECDSA, Ed25519 | HTTPS outcalls | - |

This is not exhaustive. If a chain uses a supported signature scheme and has RPC providers accessible over IPv6, integration is possible.

## Building blocks

Several reusable canisters and protocol APIs are available for building Chain Fusion applications:

- **Bitcoin API.** The management canister exposes `bitcoin_get_utxos`, `bitcoin_get_balance`, and `bitcoin_send_transaction`: a direct protocol-level integration with no intermediary. See [Bitcoin integration](../guides/chain-fusion/bitcoin.md).
- **EVM RPC canister** (`7hfb6-caaaa-aaaar-qadga-cai`). A canister providing a typed Candid interface for Ethereum and EVM-compatible chains. Queries multiple RPC providers and returns consensus results. See [Ethereum integration](../guides/chain-fusion/ethereum.md).
- **SOL RPC canister.** A similar canister for Solana, providing typed access to Solana's JSON-RPC API. See [Solana integration](../guides/chain-fusion/solana.md).
- **Chain-key tokens.** Minter and ledger canisters that implement ckBTC, ckETH, and ckERC20: trustless 1:1 representations of external assets on ICP. See [Chain-key tokens](../guides/defi/chain-key-tokens.md).
- **Chain Fusion Signer.** A reusable canister that exposes threshold signature APIs directly to web apps and CLI users, with cycle payments via ICRC-2 approval. [OISY Wallet](https://oisy.com) is a prominent production example: a multichain wallet built on ICP that uses the Chain Fusion Signer to manage keys for Bitcoin, Ethereum, and other chains. See the [chain-fusion-signer repository](https://github.com/dfinity/chain-fusion-signer).

## Example use cases

Chain Fusion enables application patterns that are difficult or impossible with bridge-based approaches:

- **Trustless cronjob service.** A canister monitors an Ethereum DeFi contract via the EVM RPC canister and triggers loan liquidations or batch settlements automatically using timers. No Gelato or Chainlink Keepers needed.
- **Multichain wallet.** A single canister controls addresses on Bitcoin, Ethereum, and Solana simultaneously. Users interact through a web frontend served from ICP without installing chain-specific wallets.
- **Onchain frontend.** An immutable or DAO-governed frontend for an Ethereum smart contract, hosted on ICP as a certified asset. Users interact with the Ethereum contract through the ICP-hosted UI.
- **Cross-chain DeFi.** A lending protocol that accepts Bitcoin as collateral (held in a canister-controlled BTC address) and issues stablecoins as ICRC-2 tokens.
- **Trustless oracle.** A canister fetches real-world data via HTTPS outcalls and posts it to a smart contract on another chain: replacing centralized oracle networks.

## Next steps

- [Bitcoin integration](../guides/chain-fusion/bitcoin.md): build with BTC on ICP
- [Ethereum integration](../guides/chain-fusion/ethereum.md): interact with Ethereum and EVM chains
- [Chain-key tokens](../guides/defi/chain-key-tokens.md): ckBTC, ckETH, and ckERC20
- [Chain-key cryptography](chain-key-cryptography.md): the threshold signing protocols behind Chain Fusion
- [HTTPS outcalls](https-outcalls.md): make HTTP requests from canisters

<!-- Upstream: informed by dfinity/portal docs/building-apps/chain-fusion/overview.mdx, docs/building-apps/chain-fusion/supported-chains.mdx, docs/building-apps/chain-fusion/evm-rpc/how-it-works.mdx -->
