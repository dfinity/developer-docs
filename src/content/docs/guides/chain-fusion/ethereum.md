---
title: "Ethereum Integration"
description: "Interact with Ethereum and EVM chains from ICP canisters"
sidebar:
  order: 3
doc_type: how-to
level: intermediate
features: [chain-fusion, chain-key, threshold-ecdsa]
icskills: [evm-rpc]
last_verified: 2026-03-10
---

# Ethereum integration

ICP canisters can interact with Ethereum and any EVM-compatible chain (Arbitrum, Base, Optimism, Polygon, Avalanche, and others) through the **EVM RPC canister** and **threshold ECDSA** signatures. This combination lets canisters read on-chain state, sign EIP-1559 transactions, and submit them to the network.

## EVM RPC canister

The [EVM RPC canister](https://github.com/dfinity/evm-rpc-canister) (`7hfb6-caaaa-aaaar-qadga-cai`) is an NNS-controlled canister that provides an on-chain API for calling Ethereum JSON-RPC methods. It uses HTTPS outcalls to contact multiple independent providers (Alchemy, Ankr, BlockPI, Cloudflare, Public Node, LlamaNodes) and returns results as `Consistent` or `Inconsistent` depending on whether providers agree.

Supported JSON-RPC methods:

| Method | Description |
|---|---|
| `eth_getLogs` | Query event logs |
| `eth_getBlockByNumber` | Get block information |
| `eth_getTransactionCount` | Get nonce for an address |
| `eth_getTransactionReceipt` | Get receipt for a submitted transaction |
| `eth_feeHistory` | Query historical gas fee data |
| `eth_call` | Read smart contract state |
| `eth_sendRawTransaction` | Submit a signed transaction |

For methods not in the Candid interface, use the `request` method to send arbitrary JSON-RPC payloads. See the [evm-rpc skill file](https://github.com/dfinity/icskills/blob/main/skills/evm-rpc/SKILL.md) for integration details.

### Adding the EVM RPC canister to your project

Add it to your `icp.yaml` project configuration. On mainnet, the EVM RPC canister is already deployed at `7hfb6-caaaa-aaaar-qadga-cai` — your backend calls it by principal directly. For local development, include it as a pre-built canister:

```yaml
canisters:
  - name: backend
    recipe:
      type: "@dfinity/motoko@v4.1.0"
      configuration:
        main: src/backend/main.mo
  - name: evm_rpc
    build:
      steps:
        - type: pre-built
          url: https://github.com/dfinity/evm-rpc-canister/releases/download/v2.2.0/evm_rpc.wasm.gz
    init_args: "(record {})"
```

Then start the local network and deploy:

```bash
icp network start -d
icp deploy
```

For Rust projects, the [`evm_rpc_client`](https://crates.io/crates/evm_rpc_client) crate simplifies interaction and provides [Alloy](https://alloy.rs/) compatibility.

## Generating an Ethereum address

To create an Ethereum address controlled by your canister, retrieve an ECDSA public key and convert it:

```rust
// 1. Get the ECDSA public key
let (key,) = ic_cdk::api::management_canister::ecdsa::ecdsa_public_key(
    EcdsaPublicKeyArgument {
        canister_id: None,
        derivation_path: vec![],
        key_id: EcdsaKeyId {
            curve: EcdsaCurve::Secp256k1,
            name: "key_1".to_string(),
        },
    },
)
.await
.unwrap();

// 2. Derive the Ethereum address from the uncompressed public key
//    Hash the public key with Keccak-256 and take the last 20 bytes
let address = keccak256(&key.public_key[1..])[12..].to_vec();
```

## Signing transactions

Ethereum transactions are signed with threshold ECDSA. For EIP-1559 transactions:

1. Build the transaction (set `to`, `value`, `data`, `max_fee_per_gas`, `max_priority_fee_per_gas`, `nonce`, `chain_id`).
2. RLP-encode and hash with Keccak-256.
3. Call `sign_with_ecdsa` on the management canister to get the signature.
4. Reconstruct the signed transaction with the `v`, `r`, `s` values.

```rust
let (sig,) = ic_cdk::api::management_canister::ecdsa::sign_with_ecdsa(
    SignWithEcdsaArgument {
        message_hash: keccak_hash.to_vec(),
        derivation_path: vec![],
        key_id: EcdsaKeyId {
            curve: EcdsaCurve::Secp256k1,
            name: "key_1".to_string(),
        },
    },
)
.await
.unwrap();
```

## Reading chain state

Query Ethereum state through the EVM RPC canister. Example: reading event logs in Motoko:

```motoko
import EvmRpc "canister:evm_rpc";
import Cycles "mo:base/ExperimentalCycles";

actor {
  public func getLogs() : async ?[EvmRpc.LogEntry] {
    let services = #EthMainnet(null);
    Cycles.add<system>(2_000_000_000);
    let result = await EvmRpc.eth_getLogs(
      services, null,
      {
        addresses = ["0xdAC17F958D2ee523a2206206994597C13D831ec7"];
        fromBlock = ?#Number 19520540;
        toBlock = ?#Number 19520940;
        topics = null;
      },
    );
    switch result {
      case (#Consistent(#Ok value)) { ?value };
      case _ { null };
    };
  };
};
```

## Submitting transactions

After signing a raw transaction, submit it through the EVM RPC canister:

```rust
let (result,) = EVM_RPC
    .eth_send_raw_transaction(
        RpcServices::EthMainnet(None),
        None,
        raw_signed_tx_hex,
        cycles,
    )
    .await
    .expect("Call failed");
```

Note: because HTTPS outcalls send the same transaction to multiple providers, you may see an `"already known"` error from some providers. This is expected -- the transaction has been accepted by the network. Verify inclusion by polling `eth_getTransactionCount` or `eth_getTransactionReceipt`.

## Targeting other EVM chains

Specify a chain by its chain ID:

```rust
let services = RpcServices::Custom {
    chainId: 137, // Polygon mainnet
    services: vec![RpcApi {
        url: "https://polygon-rpc.com".to_string(),
        headers: None,
    }],
};
```

Built-in variants include `ArbitrumOne`, `BaseMainnet`, `OptimismMainnet`, and `EthSepolia`.

## ckETH and ckERC20

**ckETH** and **ckERC20** are ICRC-2 tokens on ICP backed 1:1 by their native counterparts. They are managed by NNS-controlled minter and ledger canisters that use threshold ECDSA to hold the underlying assets.

- Transfer finality in 1-2 seconds
- Transaction fees of fractions of a cent
- No bridge -- assets are held by canister-controlled Ethereum addresses

## Resources

- [EVM RPC canister source](https://github.com/dfinity/evm-rpc-canister)
- [`evm_rpc_client` Rust crate](https://crates.io/crates/evm_rpc_client)
- [Chain Fusion starter project](https://github.com/letmejustputthishere/chain-fusion-starter)
- [Vite + React + Motoko + EVM RPC example](https://github.com/rvanasa/vite-react-motoko/tree/evm-rpc)
- [Vite + React + Rust + EVM RPC example](https://github.com/fxgst/evm-rpc-rust)
