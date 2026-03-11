---
title: "Rosetta API"
description: "Integrating with the ICP Rosetta API for exchanges and custody providers"
sidebar:
  order: 4
doc_type: how-to
level: advanced
last_verified: 2026-03-10
---

The [Rosetta API](https://www.rosetta-api.org/) is an open standard by Coinbase for blockchain integration. ICP provides Rosetta-compliant nodes for both the ICP ledger and ICRC-1 ledgers, enabling exchanges, custody platforms, and compliance tools to integrate ICP tokens using a familiar interface.

## ICP Rosetta vs ICRC Rosetta

ICP offers two Rosetta implementations:

| Implementation | Ledger | Canister | Use case |
|----------------|--------|----------|----------|
| **ICP Rosetta** | ICP native ledger | `ryjl3-tyaaa-aaaaa-aaaba-cai` | ICP token integration, NNS governance operations |
| **ICRC Rosetta** | Any ICRC-1 ledger | Configurable | Custom token integration |

ICP Rosetta additionally supports governance operations such as neuron staking, dissolving, and voting.

## Running a Rosetta node

The easiest deployment method is Docker:

```bash
docker run \
  --publish 8081:8081 \
  --detach \
  dfinity/rosetta-api
```

### Connect to mainnet

```bash
docker run \
  --publish 8081:8081 \
  --detach \
  dfinity/rosetta-api \
  --mainnet --not-whitelisted
```

### Persist synced data

Mount a volume to retain block data across container restarts:

```bash
docker volume create rosetta
docker run \
  --volume rosetta:/data \
  --publish 8081:8081 \
  --detach \
  dfinity/rosetta-api
```

The node listens on port **8081** by default. Wait for the log entry `You are all caught up to block XX` before querying.

### Test environment

For development, connect to the test ICP ledger (`xafvr-biaaa-aaaai-aql5q-cai`) on mainnet, which uses TESTICP tokens. Get free test tokens from the [faucet](https://faucet.internetcomputer.org/).

## Data API

The Data API allows querying blockchain state: blocks, transactions, balances, and network information.

### Query account balance

```bash
curl -X POST http://localhost:8081/account/balance \
  -H 'Content-Type: application/json' \
  -d '{
    "network_identifier": {
      "blockchain": "Internet Computer",
      "network": "00000000000000020101"
    },
    "account_identifier": {
      "address": "YOUR_ACCOUNT_ADDRESS"
    }
  }'
```

### Query a block

```bash
curl -X POST http://localhost:8081/block \
  -H 'Content-Type: application/json' \
  -d '{
    "network_identifier": {
      "blockchain": "Internet Computer",
      "network": "00000000000000020101"
    },
    "block_identifier": {
      "index": 1234
    }
  }'
```

### Network status

```bash
curl -X POST http://localhost:8081/network/status \
  -H 'Content-Type: application/json' \
  -d '{
    "network_identifier": {
      "blockchain": "Internet Computer",
      "network": "00000000000000020101"
    }
  }'
```

## Construction API

The Construction API is used to build, sign, and submit transactions. It follows a multi-step flow:

1. **`/construction/derive`** -- Derive an account identifier from a public key.
2. **`/construction/preprocess`** -- Determine metadata needed for the transaction.
3. **`/construction/metadata`** -- Fetch required metadata (suggested fee, etc.).
4. **`/construction/payloads`** -- Create unsigned transaction payloads.
5. **`/construction/parse`** -- Validate the unsigned transaction.
6. **`/construction/combine`** -- Combine the unsigned transaction with signatures.
7. **`/construction/parse`** -- Validate the signed transaction.
8. **`/construction/submit`** -- Submit the signed transaction to the network.

### Supported signature schemes

- **Ed25519**
- **SECP256k1**

### Transaction timing

Unsigned transactions must be signed and submitted within **24 hours** of creation. The deduplication mechanism rejects transactions that reference operations older than 24 hours.

## Governance operations via ICP Rosetta

ICP Rosetta supports NNS neuron management through special operation types:

- **STAKE** -- Lock ICP in a neuron.
- **SET_DISSOLVE_TIMESTAMP** -- Set when the neuron can dissolve.
- **START_DISSOLVE** / **STOP_DISSOLVE** -- Control dissolve state.
- **SPAWN** -- Spawn maturity into a new neuron.
- **MERGE_MATURITY** -- Merge maturity into the neuron's stake.
- **DISBURSE** -- Withdraw staked ICP from a dissolved neuron.
- **REGISTER_VOTE** -- Vote on an NNS proposal.

These operations use the same Construction API flow as transfers.

## ICRC Rosetta

For ICRC-1 tokens (including chain-key tokens like ckBTC), use the ICRC Rosetta implementation. It supports:

- Balance queries
- Transfer construction and submission
- Block and transaction history

Run ICRC Rosetta with a custom ledger canister ID:

```bash
docker run \
  --publish 8082:8082 \
  --detach \
  dfinity/icrc-rosetta-api \
  --ledger-id YOUR_LEDGER_CANISTER_ID
```

## Versioning

Docker images are published on [DockerHub](https://hub.docker.com/r/dfinity/rosetta-api/tags). Use specific version tags in production:

```bash
docker run dfinity/rosetta-api:v2.0.0
```

Query the version of a running node:

```bash
curl -X POST http://localhost:8081/network/options \
  -H 'Content-Type: application/json' \
  -d '{
    "network_identifier": {
      "blockchain": "Internet Computer",
      "network": "00000000000000020101"
    }
  }' | jq '.version.node_version'
```

## Further reading

- [Rosetta API specification](https://www.rosetta-api.org/docs/welcome.html)
- [ICP Rosetta source code](https://github.com/dfinity/ic/tree/master/rs/rosetta-api)
