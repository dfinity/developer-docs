---
title: "Chain-key tokens"
description: "Trustless 1:1 representations of external chain assets on ICP"
---

Chain-key tokens are ICP-native assets backed 1:1 by assets native to another chain. ckBTC represents bitcoin, ckETH represents ether, ckUSDC represents USDC on Ethereum, and so on. Each is fully backed by the underlying asset (held in a canister-controlled address on the origin chain), and all minting and burning happens entirely on the network, with no third-party custodian.

## Why chain-key tokens instead of wrapped assets

Traditional wrapped assets depend on an offchain custodian that holds the underlying asset and instructs a contract to mint or burn the wrapped version. If the custodian is compromised, hacked, or goes out of business, the backing can be lost entirely. Additionally, nothing prevents a dishonest custodian from using the custodied assets for other purposes, risking a depeg.

Chain-key tokens eliminate the custodian. The underlying assets are held by a minter canister at a network address derived from a chain-key key, an address no single party controls. Minting and burning are triggered by verified events on the origin chain (confirmed Bitcoin UTXOs, Ethereum event logs), and the minter signs withdrawal transactions using threshold cryptography distributed across a subnet's nodes.

## Architecture

Every chain-key token uses a set of canisters:

1. **Minter**: manages the underlying asset on the origin chain. It controls the deposit address (or Ethereum helper contract), detects incoming deposits, instructs the ledger to mint tokens, and signs and submits withdrawals when tokens are burned.
2. **Ledger**: an ICRC-1/ICRC-2 compliant ledger. It records all balances and executes mint, burn, and transfer operations.
3. **Index**: provides indexed access to ledger transactions, enabling efficient lookup of an account's transaction history.
4. **Archive** (optional): stores historical transaction data that has been offloaded from the ledger to keep it compact.

All canisters in a chain-key token system are controlled by the NNS, making the asset governance controlled by the NNS.

## Minting (getting chain-key tokens)

The minting process differs slightly by chain:

**Bitcoin-based tokens (ckBTC, ckDOGE).** The user requests a deposit address from the minter. This is a chain-key ECDSA address controlled by the minter. The user sends the underlying asset to this address on the Bitcoin or Dogecoin network. Once the transaction reaches the required confirmation threshold (4 confirmations for ckBTC), the user calls `update_balance` on the minter. The minter verifies the deposit via the Bitcoin canister and mints the corresponding amount on the ledger.

**EVM-based tokens (ckETH, ckERC20).** A helper smart contract deployed on Ethereum receives deposits. When a user sends ETH or an ERC-20 asset to the helper contract, it emits an event. The minter periodically queries these event logs via the EVM RPC canister (see [Ethereum integration](ethereum.md)) and mints the corresponding chain-key tokens on the ICP ledger.

## Burning (redeeming underlying assets)

All chain-key token redemptions use ICRC-2 approval:

1. The user calls `icrc2_approve` on the ledger to authorize the minter to withdraw the desired amount.
2. The user calls the minter's withdrawal endpoint (for example, `retrieve_btc_with_approval` for ckBTC).
3. The minter burns the chain-key tokens from the user's account.
4. The minter constructs a transaction on the origin chain, signs it using chain-key cryptography (threshold ECDSA for Bitcoin and Ethereum; threshold Ed25519 for Solana), and submits it.

For EVM-based tokens, the gas fee on Ethereum must be covered. ckETH acts as the fee currency: when redeeming ckERC20 tokens, the user also approves a small ckETH amount to cover the Ethereum gas cost.

## Chain-key token security

The security of a chain-key token rests on two properties:

- **Supply bound.** The minter never mints more chain-key tokens than the underlying assets it controls. The total ckBTC supply, for example, is always at most equal to the BTC held at minter-controlled Bitcoin addresses.
- **Threshold custody.** The minter's private key is never held by a single party. Withdrawal transactions are signed collectively by the subnet nodes through the chain-key protocol, so a single compromised node cannot authorize unauthorized withdrawals.

## Deployed assets

| Asset | Underlying | Origin chain | Integration method |
|---|---|---|---|
| ckBTC | BTC | Bitcoin | Direct |
| ckETH | ETH | Ethereum | EVM RPC canister |
| ckERC20 (ckUSDC, ckUSDT, ...) | ERC-20 assets | Ethereum | EVM RPC canister |
| ckSOL | SOL | Solana | SOL RPC canister |
| ckDOGE | DOGE | Dogecoin | Direct |

## Next steps

- [Bitcoin integration](bitcoin.md): ckBTC minter and ledger in detail
- [Ethereum integration](ethereum.md): ckETH and ckERC20 architecture
- [Chain Fusion overview](index.md): the full landscape of ICP crosschain capabilities
- [Chain-key tokens guide](../../guides/digital-assets/chain-key-tokens.md): how to integrate chain-key tokens into an application
- [Chain-key cryptography](../chain-key-cryptography.md): the threshold signing that makes chain-key tokens possible
- [Chain-Key Token Canister IDs](../../references/chain-key-canister-ids.md): minter, ledger, and index IDs for all chain-key tokens
- [Protocol canisters reference](../../references/protocol-canisters.md): minter parameters and endpoints for ckBTC, ckETH, ckDOGE, and ckSOL

<!-- Upstream: informed by Learn Hub articles "Chain-Key Tokens" (migrated, source retired) -->
