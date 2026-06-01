---
title: "Cycle costs"
description: "Exact cycle costs for compute, storage, messaging, threshold signing, HTTPS outcalls, and chain integration APIs"
sidebar:
  order: 8
---

Canisters pay for the resources they consume and operations they perform using [**cycles**](../concepts/cycles.md). The price of cycles is pegged to [XDR](glossary.md#xdr) (Special Drawing Rights): **1 trillion cycles = 1 XDR**. USD values throughout this page use **1 XDR = $1.366430**; see [XDR exchange rate](#xdr-exchange-rate) at the end of this page for the current rate and how to look it up programmatically.

You can use the [pricing calculator](https://3d5wy-5aaaa-aaaag-qkhsq-cai.icp0.io/) to estimate the cost for your app.

## Cycle units

| Abbreviation | Name     | In numbers        | XDR value | Approx. USD value |
|--------------|----------|-------------------|-----------|-------------------|
| T            | Trillion | 1_000_000_000_000 | 1         | ~$1.37            |
| B            | Billion  | 1_000_000_000     | 0.001     | ~$0.00137         |
| M            | Million  | 1_000_000         | 0.000001  | ~$0.00000137      |
| k            | Thousand | 1_000             | 10⁻⁹      | ~$0.00000000137   |

## Replication factors

Costs scale with the number of nodes in the [subnet](../concepts/network-overview.md#subnets). The base cost tables below assume a **13-node application subnet**. For a 34-node (fiduciary) subnet, costs scale as `34 * (cost / 13)`:

- **13-node subnet**: Standard application subnets. No scaling needed: costs are as listed.
- **34-node subnet**: Fiduciary subnets (higher security for financial applications). Costs are approximately **2.6×** the 13-node cost.

See [Subnet types](subnet-types.md) for subnet-specific details.

## Cost table

USD values use the rate stated in the intro. Use cycle counts for precise budgeting.

<!-- Needs human verification: cloud pricing comparison requested in content brief — no upstream source found in .sources/ for ICP vs. cloud provider cost comparison. -->

| Operation | Description | Who pays | 13-node cycles | ~USD | 34-node cycles | ~USD |
|-----------|-------------|----------|----------------|------|----------------|------|
| Query call | Query information from a canister | N/A | Free | Free | Free | Free |
| Canister creation | Create a new canister | Created canister | 500_000_000_000 | ~$0.683 | 1_307_692_307_692 | ~$1.787 |
| Compute allocation (per % per second) | Reserved compute per second | Canister with allocation | 10_000_000 | ~$0.0000137 | 26_153_846 | ~$0.0000357 |
| Update message execution | Per update message executed (base fee) | Target canister | 5_000_000 | ~$0.0000068 | 13_076_923 | ~$0.0000179 |
| 1B instructions executed | Per 1B Wasm instructions (on top of base fee) | Executing canister | 1_000_000_000 | ~$0.00137 | 2_615_384_615 | ~$0.00357 |
| Xnet call (request + response) | Inter-canister call overhead | Sending canister | 260_000 | ~$0.00000036 | 680_000 | ~$0.00000093 |
| Xnet byte transmission | Per byte in inter-canister call | Sending canister | 1_000 | ~$0.00000000137 | 2_615 | ~$0.0000000036 |
| Ingress message reception | Per ingress message received | Receiving canister | 1_200_000 | ~$0.0000016 | 3_138_461 | ~$0.0000043 |
| Ingress byte reception | Per byte in ingress message | Receiving canister | 2_000 | ~$0.0000000027 | 5_230 | ~$0.0000000071 |
| GiB storage per second | Storage cost per GiB per second | Canister with storage | 127_000 | ~$0.000000174 | 332_153 | ~$0.000000454 |

**Storage cost per GiB per month (30 days):**

| Subnet | Cycles | ~USD |
|--------|--------|------|
| 13-node | ~329 billion | ~$0.45 |
| 34-node | ~861 billion | ~$1.18 |

## Execution cost formula

Each update message execution is charged as a base fee plus a per-instruction fee (the *Update message execution* and *1B instructions executed* rows in the Cost table above):

```
total = base_fee + per_instruction_fee * num_instructions
```

Current values (13-node subnet):
- `base_fee` = 5_000_000 cycles (~$0.0000068 USD)
- `per_instruction_fee` = 1 cycle (so 1B instructions = 1B cycles ≈ $0.00137 USD)

## Compute allocation

By default canisters are scheduled best-effort. Setting `compute_allocation` guarantees execution slots:

- **1%**: Scheduled every 100 rounds
- **2%**: Scheduled every 50 rounds
- **100%**: Scheduled every round

Total allocatable compute capacity per subnet is 299%. The per-second cost is `10M cycles * allocation_percent` on a 13-node subnet: see the *Compute allocation* row in the [Cost table](#cost-table) above for exact figures.

## Storage reservation

When a canister grows its memory (via `memory.grow`, `ic0.stable_grow()`, or Wasm installation), the system moves cycles from the canister's main balance into a **reserved cycles balance** to cover future storage payments.

- If subnet usage is **below 750 GiB**: reservation per byte = 0 (no advance reservation).
- If subnet usage is **above 750 GiB**: reservation per byte scales linearly from 0 up to 10 years of payments at subnet capacity (2 TiB).

Reserved cycles are non-transferable. Controllers can disable reservation by setting `reserved_cycles_limit = 0`, but opted-out canisters cannot allocate new memory when subnet usage exceeds 750 GiB.

## Threshold cryptography

Threshold signing and key derivation are core ICP protocol capabilities: the cryptographic operations happen entirely within the ICP network, distributed across the nodes of a designated subnet. The extra cost reflects computationally intensive threshold cryptography and cross-subnet coordination.

### Threshold ECDSA and Schnorr signing

`sign_with_ecdsa` and `sign_with_schnorr` are charged per signature. The fee is determined by the subnet where the signing key resides, not the calling canister's subnet. `ecdsa_public_key` and `schnorr_public_key` carry no cycle cost.

| Key name | Algorithm(s) | Environment | Signing subnet | Cycles | ~USD |
|----------|-------------|------------|----------------|--------|------|
| `test_key_1` | ECDSA (`secp256k1`), Schnorr (`bip340secp256k1`, `ed25519`) | Testing | 13-node (`fuqsr`) | 10_000_000_000 | ~$0.0137 |
| `key_1` | ECDSA (`secp256k1`), Schnorr (`bip340secp256k1`, `ed25519`) | Production | 34-node fiduciary (`pzp6e`) | 26_153_846_153 | ~$0.0357 |

If the canister may be blackholed or called by other canisters, send more cycles than the listed cost: unused cycles are refunded, and this ensures calls succeed if the signing subnet grows in node count.

### VetKeys

`vetkd_derive_key` is charged per key derivation. `vetkd_public_key` carries no cycle cost. The fee is determined by the subnet where the VetKey resides, not the calling canister's subnet.

| Key name | Environment | Signing subnet | Cycles | ~USD |
|----------|------------|----------------|--------|------|
| `test_key_1` | Testing | 13-node (`fuqsr`) | 10_000_000_000 | ~$0.0137 |
| `key_1` | Production | 34-node fiduciary (`pzp6e`) | 26_153_846_153 | ~$0.0357 |

If the canister may be blackholed or called by other canisters, send more cycles than the listed cost: unused cycles are refunded.

## External integrations

These features involve outbound calls to external networks. Every node on the relevant subnet participates in each call, which is the primary driver of the additional cost. The subsections below are ordered by pricing mechanism: HTTPS outcalls first as the base primitive, then the two RPC canisters that build on it, then the native chain integrations that use a two-tier pricing model.

### HTTPS outcalls

HTTPS outcall costs scale with subnet size (`n` = number of nodes):

```
total_fee  = base_fee + size_fee
base_fee   = (3_000_000 + 60_000 * n) * n
size_fee   = (400 * request_bytes + 800 * max_response_bytes) * n
```

`request_bytes` is the total serialized request size (URL + headers + body + transform name/context). `max_response_bytes` defaults to 2 MiB if not explicitly set by the canister.

| Component | 13-node cycles | ~USD | 34-node cycles | ~USD |
|-----------|----------------|------|----------------|------|
| Per call (base) | 49_140_000 | ~$0.0000671 | 171_360_000 | ~$0.000234 |
| Per request byte | 5_200 | ~$0.0000000071 | 13_600 | ~$0.0000000186 |
| Per reserved response byte | 10_400 | ~$0.0000000142 | 27_200 | ~$0.0000000372 |

### EVM RPC canister

Calls to the EVM RPC canister use an HTTPS-outcall-based pricing structure with higher per-byte constants than standard HTTPS outcalls, scaled by the number of RPC services used for multi-provider consistency:

```
(
  5_912_000
  + 60_000 * nodes_in_subnet
  + 2400 * request_size_bytes
  + 800 * max_response_size_bytes
) * nodes_in_subnet * rpc_services
```

Typical cost: 10^8 to 10^9 cycles (~$0.0001 to $0.001 USD). On a 34-node subnet with a 1 kB request and 1 kB response using one RPC service: ~$0.00052.

An additional `10_000_000 * nodes_in_subnet * rpc_services` collateral cycles must be attached per call; these are consumed by the EVM RPC canister as a reserve for future pricing changes and are not returned to the caller. Any cycles you attach above the total minimum (formula + collateral) are returned, so it is safe to send more than needed. Start with 10_000_000_000 cycles and adjust based on observed costs. Use the `requestCost` query method on the EVM RPC canister to get an exact estimate before calling.

### SOL RPC canister

The SOL RPC canister prices each call using the standard HTTPS outcall formula plus a `10_000_000 cycles × n` per-node processing fee, scaled by the number of RPC providers used:

```
total_fee = (
  (3_000_000 + 60_000 * n) * n             // base HTTP outcall fee
  + (400 * request_bytes + 800 * max_response_bytes) * n  // size fee
  + 10_000_000 * n                         // processing fee
) * rpc_providers
```

`n` is the number of nodes in the subnet hosting the SOL RPC canister. Because each method uses a different default `max_response_bytes` and request serialization size, costs vary per method. As a reference point: `getBalance` with 3 RPC providers on a 34-node subnet costs approximately 1.7 billion cycles (~$0.0023 USD).

To get the exact cycle estimate for a specific call before attaching cycles, use the corresponding query endpoint on the SOL RPC canister: `getBalanceCyclesCost`, `getBlockCyclesCost`, `getSlotCyclesCost`, `getTransactionCyclesCost`, `sendTransactionCyclesCost`, and equivalents for each method.

See the [Solana guide](../guides/chain-fusion/solana.mdx) for integration examples.

### Bitcoin integration API

The Bitcoin API uses a two-tier pricing model: a base cost that is actually charged, and a higher minimum to attach with the call. The minimum is set above the base cost to allow for future subnet growth; any cycles not consumed are refunded. `bitcoin_get_utxos` and `bitcoin_get_block_headers` add a per-instruction component on top of their base fee because the Bitcoin canister executes Wasm to process those requests. `bitcoin_send_transaction` has no minimum: its cost is deterministic (base fee plus a per-byte fee), and the full amount attached is charged.

**Bitcoin Testnet / Regtest:**

| API call | Base cost (cycles) | Min. cycles to attach | ~USD (base) | ~USD (min. to attach) |
|----------|--------------------|-----------------------|-------------|----------------------|
| `bitcoin_get_balance` | 4_000_000 | 40_000_000 | ~$0.0000055 | ~$0.0000547 |
| `bitcoin_get_utxos` | 20_000_000 + 0.4 × instructions | 4_000_000_000 | ~$0.0000273 + inst. | ~$0.00547 |
| `bitcoin_get_current_fee_percentiles` | 4_000_000 | 40_000_000 | ~$0.0000055 | ~$0.0000547 |
| `bitcoin_get_block_headers` | 20_000_000 + 0.4 × instructions | 4_000_000_000 | ~$0.0000273 + inst. | ~$0.00547 |
| `bitcoin_send_transaction` (base) | 2_000_000_000 | N/A | ~$0.00273 | N/A |
| `bitcoin_send_transaction` (per payload byte) | 8_000_000 | N/A | ~$0.0000109 | N/A |
| `get_blockchain_info` | 4_000_000 | 40_000_000 | ~$0.0000055 | ~$0.0000547 |

**Bitcoin Mainnet:**

| API call | Base cost (cycles) | Min. cycles to attach | ~USD (base) | ~USD (min. to attach) |
|----------|--------------------|-----------------------|-------------|----------------------|
| `bitcoin_get_balance` | 10_000_000 | 100_000_000 | ~$0.0000137 | ~$0.000137 |
| `bitcoin_get_utxos` | 50_000_000 + 1 × instructions | 10_000_000_000 | ~$0.0000683 + inst. | ~$0.0137 |
| `bitcoin_get_current_fee_percentiles` | 10_000_000 | 100_000_000 | ~$0.0000137 | ~$0.000137 |
| `bitcoin_get_block_headers` | 50_000_000 + 1 × instructions | 10_000_000_000 | ~$0.0000683 + inst. | ~$0.0137 |
| `bitcoin_send_transaction` (base) | 5_000_000_000 | N/A | ~$0.00683 | N/A |
| `bitcoin_send_transaction` (per payload byte) | 20_000_000 | N/A | ~$0.0000273 | N/A |
| `get_blockchain_info` | 10_000_000 | 100_000_000 | ~$0.0000137 | ~$0.000137 |

In Rust, the `ic-cdk-bitcoin-canister` crate handles cycle attachment automatically. In Motoko, use `(with cycles = amount)`. See the [Bitcoin guide](../guides/chain-fusion/bitcoin.md#cycle-costs) for implementation details.

### Dogecoin integration API

The Dogecoin integration API follows the same two-tier pricing model as the Bitcoin API. There is no testnet pricing tier: the fees below apply to Dogecoin Mainnet only.

| API call | Base cost (cycles) | Min. cycles to attach | ~USD (base) | ~USD (min. to attach) |
|----------|--------------------|-----------------------|-------------|----------------------|
| `dogecoin_get_balance` | 10_000_000 | 100_000_000 | ~$0.0000137 | ~$0.000137 |
| `dogecoin_get_utxos` | 50_000_000 + 1 × instructions | 10_000_000_000 | ~$0.0000683 + inst. | ~$0.0137 |
| `dogecoin_get_current_fee_percentiles` | 10_000_000 | 100_000_000 | ~$0.0000137 | ~$0.000137 |
| `dogecoin_get_block_headers` | 50_000_000 + 1 × instructions | 10_000_000_000 | ~$0.0000683 + inst. | ~$0.0137 |
| `dogecoin_send_transaction` (base) | 5_000_000_000 | N/A | ~$0.00683 | N/A |
| `dogecoin_send_transaction` (per payload byte) | 20_000_000 | N/A | ~$0.0000273 | N/A |

`dogecoin_get_utxos` and `dogecoin_get_block_headers` add a per-instruction component because the Dogecoin canister executes Wasm to process those requests; the minimum to attach covers this variable cost. `dogecoin_send_transaction` has no minimum: its cost is deterministic, and the full amount attached is charged.

See the [Dogecoin guide](../guides/chain-fusion/dogecoin.md) for integration patterns.

## XDR exchange rate

The cycle price is fixed by protocol: **1 trillion cycles = 1 XDR**. This ratio is set by NNS governance and does not change with ICP token price movements.

All USD values on this page use **1 XDR = $1.366430** (May 22, 2026). Use cycle counts for precise budgeting; only the USD conversion fluctuates.

### How the CMC tracks the rate

The [Cycles Minting Canister (CMC)](../references/system-canisters.md#cycles-minting-canister-cmc) (`rkp4c-7iaaa-aaaaa-aaaca-cai`) calls the [exchange rate canister (XRC)](../references/protocol-canisters.md#exchange-rate-canister-xrc) every 5 minutes for the current ICP/XDR rate. The CMC exposes `get_icp_xdr_conversion_rate`, which returns `xdr_permyriad_per_icp`: the number of XDR per ICP, expressed in units of 1/10000 (for example, `19482` means 1 ICP = 1.9482 XDR). This is an ICP/XDR rate; the CMC does not track XDR/USD.

### Getting the current XDR/USD rate

**Manual lookup:** The [IMF's SDR valuation page](https://www.imf.org/external/np/fin/data/rms_sdrv.aspx) is the authoritative source. The page returns HTTP 403 to automated HTTP clients and cannot be fetched programmatically.

**ICP Dashboard API (unsigned, easy for scripts):** Fetch the ICP/USD price and the ICP/XDR rate, then derive XDR/USD:

```bash
# ICP/USD (returns [[timestamp, "price_as_string"]])
GET https://ic-api.internetcomputer.org/api/v3/icp-usd-rate

# ICP/XDR in permyriad (returns [[timestamp, xdr_permyriad_per_icp]])
GET https://ic-api.internetcomputer.org/api/v3/icp-xdr-conversion-rates?limit=1

xdr_usd = icp_usd / (xdr_permyriad_per_icp / 10_000)
```

Example: ICP/USD = $2.67, ICP/XDR = 19482 / 10000 = 1.9482 → XDR/USD = 2.67 / 1.9482 ≈ $1.37.

The ICP Dashboard API is not certified: responses are unsigned and not verifiable by the network.

**CMC metrics endpoint (Prometheus, unsigned):** The CMC exposes a Prometheus metrics endpoint at `https://rkp4c-7iaaa-aaaaa-aaaca-cai.raw.icp0.io/metrics` that includes `cmc_icp_xdr_conversion_rate` (current ICP/XDR) and `cmc_avg_icp_xdr_conversion_rate` (30-day moving average used for node provider rewards). Neither is certified. Apply the same formula to derive XDR/USD.

**From canister code (certified):** Call the XRC for `ICP/USD` as a crypto/fiat pair (1B cycles, refunded if unused), and call the CMC `get_icp_xdr_conversion_rate` for ICP/XDR. Derive XDR/USD = ICP_USD / (xdr_permyriad_per_icp / 10_000). See [Fetch exchange rates](../guides/chain-fusion/exchange-rates.md) for XRC integration code.

## Related pages

- [Cycles management](../guides/canister-management/cycles-management.md): Topping up and monitoring canister balances
- [Cycles](../concepts/cycles.md): Why canisters (not users) pay for execution
- [Chain-key cryptography](../concepts/chain-key-cryptography.md): Threshold signing and VetKeys
- [Subnet types](subnet-types.md): Cost multipliers per subnet type
- [Resource limits](resource-limits.md): Instruction limits, memory caps, and message size constraints

<!-- Upstream: informed by dfinity/portal docs/building-apps/essentials/gas-cost.mdx, docs/references/cycles-cost-formulas.mdx, docs/references/t-sigs-how-it-works.mdx, docs/references/bitcoin-how-it-works.mdx, docs/building-apps/network-features/vetkeys/api.mdx, docs/building-apps/chain-fusion/ethereum/evm-rpc/costs.mdx; dfinity/dogecoin-canister interface/src/lib.rs, docs/src/endpoints.md; dfinity/sol-rpc-canister canister/src/constants.rs, canister/src/memory/mod.rs, canister/src/http/mod.rs, integration_tests/tests/tests.rs -->
