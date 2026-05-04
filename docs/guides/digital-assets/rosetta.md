---
title: "Rosetta API"
description: "Run a Rosetta node for ICP or ICRC-1 tokens; query balances and blocks; construct and sign transactions offline; manage NNS neurons."
sidebar:
  order: 3
---

The Rosetta API is a standardized blockchain integration specification developed by Coinbase (the open specification is sometimes referred to as the Mesh API in Coinbase's developer platform, but remains called "Rosetta" in the broader ecosystem). ICP provides two Rosetta implementations: one for the ICP ledger (with NNS governance support), and one for ICRC-1 compatible tokens such as ckBTC and ckETH.

This guide covers both implementations, focusing on what exchange operators and block explorer developers need to get started: running a node, querying chain data, and constructing transactions.

## What is Rosetta?

Rosetta defines a uniform HTTP API for blockchain integrations. Clients (exchanges, custody platforms, analytics tools) interact with a Rosetta node rather than directly with chain-specific APIs. This lowers integration cost for operators already supporting other chains.

ICP Rosetta exposes the standard Rosetta endpoints:

- **Data API**: query balances, blocks, and transactions
- **Construction API**: create and sign transactions offline, then submit them
- **Network API**: network status and configuration

Both ICP Rosetta and ICRC Rosetta implement the full Rosetta specification and pass all `rosetta-cli` tests.

## Choosing an implementation

| | ICP Rosetta | ICRC Rosetta |
|---|---|---|
| **Ledger** | ICP ledger (`ryjl3-tyaaa-aaaaa-aaaba-cai`) | Any ICRC-1 ledger (ckBTC, ckETH, SNS tokens, …) |
| **Default port** | 8081 | 8082 |
| **Docker image** | `dfinity/rosetta-api` | `dfinity/ic-icrc-rosetta-api` |
| **Extra operations** | Neuron staking, voting, NNS governance queries | Multi-token support |
| **Network identifier** | `00000000000000020101` | Canister ID of the target ledger |

If you need to work with ICP and governance neurons, use ICP Rosetta. For ckBTC, ckETH, or any other ICRC-1 token, use ICRC Rosetta.

## Running ICP Rosetta

### Docker (recommended)

Pull the official image:

```bash
docker pull dfinity/rosetta-api
```

**Test environment**: uses TESTICP tokens with no real value. Ideal for learning and development.

```bash
docker run \
    --publish 8081:8081 \
    --rm \
    dfinity/rosetta-api \
    --environment test
```

Get free TESTICP tokens from the [faucet](https://faucet.internetcomputer.org/). The test ICP ledger canister ID is `xafvr-biaaa-aaaai-aql5q-cai`.

**Production with data persistence**: mount `/data` so the node does not re-sync from scratch on restart:

```bash
docker volume create rosetta

docker run \
    --volume rosetta:/data \
    --publish 8081:8081 \
    --detach \
    dfinity/rosetta-api:v2.1.7 \
    --environment production
```

Use a specific version tag in production. Check available versions on [DockerHub](https://hub.docker.com/r/dfinity/rosetta-api/tags).

**Custom canister**: connect to a specific test ledger:

```bash
docker run \
    --publish 8081:8081 \
    --rm \
    dfinity/rosetta-api \
    --environment test \
    --canister <ledger-canister-id>
```

### Building from source

Requires [Bazel](https://bazel.build/) and the IC repository:

```bash
git clone https://github.com/dfinity/ic.git
cd ic

bazel run //rs/rosetta-api/icp:ic-rosetta-api -- \
    --port 8081 \
    --environment production \
    --store-location /tmp
```

### Managed endpoints

[Validation Cloud](https://www.validationcloud.io/icp) offers hosted ICP Rosetta endpoints without local infrastructure setup, including free and paid tiers with SLA guarantees.

### Verify the node is running

Check node status:

```bash
curl -H "Content-Type: application/json" \
  -d '{"network_identifier": {"blockchain": "Internet Computer", "network": "00000000000000020101"}}' \
  -X POST http://localhost:8081/network/status
```

Wait for the log entry `You are all caught up to block XX` before treating the node as ready.

Check the node version:

```bash
curl -H "Content-Type: application/json" \
  -d '{"network_identifier": {"blockchain": "Internet Computer", "network": "00000000000000020101"}}' \
  -X POST http://localhost:8081/network/options | jq '.version.node_version'
```

## Running ICRC Rosetta

### Docker (recommended)

Pull the official image:

```bash
docker pull dfinity/ic-icrc-rosetta-api
```

**Quickstart**: connects to the TICRC1 test token (`3jkp5-oyaaa-aaaaj-azwqa-cai`):

```bash
docker run \
    --publish 8082:8082 \
    --rm \
    dfinity/ic-icrc-rosetta-api \
    --port 8082 \
    --multi-tokens 3jkp5-oyaaa-aaaaj-azwqa-cai \
    --store-type in-memory
```

Get free TICRC1 test tokens from the [faucet](https://faucet.internetcomputer.org/).

**Single-token production**: connects to ckBTC with data persistence:

```bash
docker volume create ic-icrc-rosetta

docker run \
    --volume ic-icrc-rosetta:/data \
    --publish 8082:8082 \
    --detach \
    dfinity/ic-icrc-rosetta-api:v1.2.7 \
    --port 8082 \
    --network-type mainnet \
    --multi-tokens mxzaz-hqaaa-aaaar-qaada-cai \
    --multi-tokens-store-dir /data
```

**Multi-token deployment**: track ckBTC and ckETH simultaneously:

```bash
docker run \
    --volume ic-icrc-rosetta:/data \
    --publish 8082:8082 \
    --detach \
    dfinity/ic-icrc-rosetta-api:v1.2.7 \
    --port 8082 \
    --network-type mainnet \
    --multi-tokens mxzaz-hqaaa-aaaar-qaada-cai,ss2fx-dyaaa-aaaar-qacoq-cai \
    --multi-tokens-store-dir /data
```

Each tracked token maintains a separate SQLite database named after its canister ID (e.g., `mxzaz-hqaaa-aaaar-qaada-cai.db`). Logs include a `sync{token=...}` prefix per token:

```
INFO sync{token=ckBTC-mxzaz}: Fully synched to block height: 2365800
INFO sync{token=ckETH-ss2fx}: Fully synched to block height: 801941
```

### Common ICRC-1 canister IDs

**Mainnet:**

| Token | Canister ID |
|-------|-------------|
| ckBTC | `mxzaz-hqaaa-aaaar-qaada-cai` |
| ckETH | `ss2fx-dyaaa-aaaar-qacoq-cai` |

**Test tokens:**

| Token | Canister ID |
|-------|-------------|
| TICRC1 | `3jkp5-oyaaa-aaaaj-azwqa-cai` |
| ckTestBTC | `mc6ru-gyaaa-aaaar-qaaaq-cai` |
| ckTestETH | `apia6-jaaaa-aaaar-qabma-cai` |

### Building from source

```bash
git clone https://github.com/dfinity/ic.git
cd ic

bazel run //rs/rosetta-api/icrc1:ic-icrc-rosetta-bin -- \
    --port 8082 \
    --multi-tokens 3jkp5-oyaaa-aaaaj-azwqa-cai \
    --store-type in-memory
```

### Verify the ICRC Rosetta node

```bash
curl -H "Content-Type: application/json" \
  -d '{
    "network_identifier": {
      "blockchain": "Internet Computer",
      "network": "mxzaz-hqaaa-aaaar-qaada-cai"
    }
  }' \
  -X POST http://localhost:8082/network/status
```

## Data API

The Data API provides read-only access to chain data. This section covers: network information, account balances (including neuron balances), block fetching, transaction search, and ICP-specific NNS governance queries. All examples below use ICP Rosetta (port 8081, network `00000000000000020101`). For ICRC Rosetta, change the port to 8082 and use the ledger's canister ID as the network identifier.

### Fetch network information

Retrieve the network identifier: use this as a health check and to confirm the correct `network_identifier` for subsequent calls:

```bash
curl --location 'localhost:8081/network/list' \
  --header 'Content-Type: application/json' \
  --data '{"metadata": {}}'
```

Response:

```json
{
    "network_identifiers": [
        {
            "blockchain": "Internet Computer",
            "network": "00000000000000020101"
        }
    ]
}
```

### Query account balance

Fetch the balance of an account at the most recent block:

```bash
curl --location 'localhost:8081/account/balance' \
  --header 'Content-Type: application/json' \
  --data '{
    "network_identifier": {
        "blockchain": "Internet Computer",
        "network": "00000000000000020101"
    },
    "account_identifier": {
        "address": "8b84c3a3529d02a9decb5b1a27e7c8d886e17e07ea0a538269697ef09c2a27b4"
    }
}'
```

Response:

```json
{
    "block_identifier": {
        "index": 9890652,
        "hash": "30217e980397e9a8e14793563511e2d3191aa2df6d623866fa71f967e2ce3f08"
    },
    "balances": [
        {
            "value": "62841206500025",
            "currency": {
                "symbol": "ICP",
                "decimals": 8
            }
        }
    ]
}
```

To query a staked neuron's balance, include the `account_type` and `neuron_index` in the metadata:

```bash
curl --location 'localhost:8081/account/balance' \
  --header 'Content-Type: application/json' \
  --data '{
    "network_identifier": {
        "blockchain": "Internet Computer",
        "network": "00000000000000020101"
    },
    "account_identifier": {
        "address": "a4ac33c6a25a102756e3aac64fe9d3267dbef25392d031cfb3d2185dba93b4c4"
    },
    "metadata": {
        "account_type": "neuron",
        "neuron_index": 0,
        "public_key": {
            "hex_bytes": "ba5242d02642aede88a5f9fe82482a9fd0b6dc25f38c729253116c6865384a9d",
            "curve_type": "edwards25519"
        }
    }
}'
```

### Fetch a block

Provide either the block index, hash, or both. You can look up a block index in the [ICP dashboard](https://dashboard.internetcomputer.org/transactions):

```bash
curl --location 'localhost:8081/block' \
  --header 'Content-Type: application/json' \
  --data '{
    "network_identifier": {
        "blockchain": "Internet Computer",
        "network": "00000000000000020101"
    },
    "block_identifier": {
        "index": 9840566
    }
}'
```

Each ICP ledger block contains exactly one transaction. The response includes the operation type, amounts, and ICP-specific metadata such as `memo` and `created_at_time`.

### Search transactions

Query transactions by account, hash, or operation type:

```bash
curl --location 'localhost:8081/search/transactions' \
  --header 'Content-Type: application/json' \
  --data '{
    "network_identifier": {
        "blockchain": "Internet Computer",
        "network": "00000000000000020101"
    },
    "account_identifier": {
        "address": "8b84c3a3529d02a9decb5b1a27e7c8d886e17e07ea0a538269697ef09c2a27b4"
    }
}'
```

The search covers a maximum range of 10,000 blocks. See the [full specification](https://docs.cdp.coinbase.com/mesh/reference/searchtransactions/) for all query parameters.

### ICP-specific: NNS governance queries

ICP Rosetta exposes NNS governance data through the `/call` endpoint.

**List pending proposals:**

```bash
curl --location 'localhost:8081/call' \
  --header 'Content-Type: application/json' \
  --data '{
    "network_identifier": {
        "blockchain": "Internet Computer",
        "network": "00000000000000020101"
    },
    "method_name": "get_pending_proposals",
    "parameters": {}
}'
```

**Get proposal info:**

```bash
curl --location 'localhost:8081/call' \
  --header 'Content-Type: application/json' \
  --data '{
    "network_identifier": {
        "blockchain": "Internet Computer",
        "network": "00000000000000020101"
    },
    "method_name": "get_proposal_info",
    "parameters": {
        "proposal_id": 127049
    }
}'
```

**List known neurons:**

```bash
curl --location 'localhost:8081/call' \
  --header 'Content-Type: application/json' \
  --data '{
    "network_identifier": {
        "blockchain": "Internet Computer",
        "network": "00000000000000020101"
    },
    "method_name": "list_known_neurons",
    "parameters": {}
}'
```

These calls require an online Rosetta node with internet access, since they proxy directly to the NNS governance canister (`rrkah-fqaaa-aaaaa-aaaaq-cai`).

## Construction API

The Construction API enables offline transaction signing: you prepare and sign transactions on an air-gapped machine, then submit the signed payload when online. No private keys are ever sent to the Rosetta node.

The construction flow consists of these endpoints, called in order:

1. **`construction/derive`**: derive an account identifier from a public key
2. **`construction/preprocess`**: get parameters needed for metadata fetch
3. **`construction/metadata`**: fetch transaction-specific metadata (e.g., nonce, fee)
4. **`construction/payloads`**: get signable hex payloads for the requested operations
5. **`construction/combine`**: combine signatures with the unsigned transaction
6. **`construction/submit`**: broadcast the signed transaction

Two additional optional endpoints are supported and used by some integrators:
- **`construction/parse`**: parse a signed or unsigned transaction back into operations, useful for verifying intent before broadcast
- **`construction/hash`**: compute the transaction hash from a signed transaction, useful for tracking before submission

### Key generation

ICP Rosetta supports **Ed25519** and **secp256k1** key types. Generate keys with OpenSSL:

```bash
# Ed25519 private key (32-byte public key)
openssl genpkey -algorithm ed25519 -out my_ed25519_key.pem

# Extract compressed public key hex
openssl pkey -in my_ed25519_key.pem -pubout -outform DER | tail -c 32 | xxd -p -c 32
```

```bash
# secp256k1 private key (33-byte compressed public key)
openssl ecparam -name secp256k1 -genkey -noout -out my_secp256k1_key.pem

# Extract compressed public key hex (starts with 02 or 03)
openssl ec -in my_secp256k1_key.pem -pubout -conv_form compressed -outform DER | tail -c 33 | xxd -p -c 33
```

### ICP operations

ICP Rosetta supports these operation types. The full list is returned by the `network/options` endpoint at runtime:

**Token operations:**
- `TRANSACTION`: token transfer
- `MINT`: mint new tokens (minting account only)
- `BURN`: burn tokens
- `APPROVE`: approve a spender (ICRC-2)
- `FEE`: explicit fee debit (used internally and in transaction representation)

**Neuron and governance operations:**
- `STAKE`: stake ICP to create a neuron
- `START_DISSOLVING` / `STOP_DISSOLVING`: change neuron dissolve state
- `SET_DISSOLVE_TIMESTAMP`: set a neuron's dissolve deadline
- `CHANGE_AUTO_STAKE_MATURITY`: toggle automatic maturity restaking
- `DISBURSE`: disburse matured neuron funds
- `ADD_HOTKEY` / `REMOVE_HOTKEY`: manage neuron hotkeys
- `SPAWN`: spawn a new neuron from maturity
- `MERGE_MATURITY` / `STAKE_MATURITY`: handle accumulated maturity
- `REGISTER_VOTE`: vote on NNS proposals
- `FOLLOW`: configure neuron following
- `NEURON_INFO`: retrieve neuron metadata
- `LIST_NEURONS`: list neurons controlled by a principal

For a complete reference of the construction flow with request/response examples for each operation type, see the [ICP Rosetta construction API](https://github.com/dfinity/ic/tree/master/rs/rosetta-api) in the IC repository.

### ICRC Rosetta operations

ICRC Rosetta supports two categories of construction operations:

- **`TRANSFER`**: direct token transfer between accounts (ICRC-1). Two operations per request: one debit (`TRANSFER` with negative amount) and one credit (`TRANSFER` with positive amount).
- **`APPROVE` + `SPENDER`**: authorize a spender to transfer tokens on your behalf (ICRC-2). The `APPROVE` operation sets the allowance amount; the `SPENDER` operation identifies the authorized principal.

The construction flow is the same as for ICP. The network identifier is the ledger canister ID and the port is 8082. You do not need to include a `FEE` operation: ICRC Rosetta deducts the fee automatically, though you may include it to make the debit explicit.

## Requirements and limitations

### Transaction timing

For both ICP and ICRC Rosetta, an unsigned transaction must be created and signed within 24 hours before the node receives the signed payload. This is enforced by the [ICRC-1 deduplication mechanism](https://github.com/dfinity/ICRC-1/blob/main/standards/ICRC-1/README.md#transaction_deduplication). Transactions referencing a `created_at_time` older than 24 hours are rejected.

### Signature schemes

ICP and ICRC Rosetta support:
- **Ed25519** (`edwards25519` curve type)
- **secp256k1** (`secp256k1` curve type)

### Compliance

Both implementations:
- Fully comply with all standard Rosetta endpoints
- Pass all `rosetta-cli` tests
- Accept any valid Rosetta request

Neither implementation supports UTXO features. No UTXO messages appear in responses.

## Example scripts

The DFINITY IC repository contains Python example scripts for both implementations:

- **ICP Rosetta examples**: [`rs/rosetta-api/examples/icp/python`](https://github.com/dfinity/ic/tree/master/rs/rosetta-api/examples/icp/python): balance queries, transfers, block reading, NNS governance interactions
- **ICRC Rosetta examples**: [`rs/rosetta-api/examples/icrc1/python`](https://github.com/dfinity/ic/tree/master/rs/rosetta-api/examples/icrc1/python): ICRC-1 token operations with a `RosettaClient` library supporting automatic token discovery

Each directory includes a `requirements.txt` and a `run_tests.sh` script for isolated test environments.

## Next steps

- [Ledgers](ledgers.md): transfer and manage assets directly from canister code
- [Digital Asset Standards](../../references/digital-asset-standards.md): formal ICRC standard specifications for fungible assets, NFTs, and their extensions

<!-- Upstream: informed by dfinity/portal docs/defi/rosetta/icp_rosetta/index.mdx, docs/defi/rosetta/icp_rosetta/running-rosetta.mdx, docs/defi/rosetta/icp_rosetta/data_api/index.mdx, docs/defi/rosetta/icp_rosetta/construction_api/index.mdx, docs/defi/rosetta/icp_rosetta/examples.mdx, docs/defi/rosetta/icrc_rosetta/index.mdx, docs/defi/rosetta/icrc_rosetta/running-rosetta.mdx, docs/defi/rosetta/icrc_rosetta/examples.mdx -->
