---
title: "Chain Fusion Signer"
description: "Use the Chain Fusion Signer canister to sign transactions for Bitcoin, Ethereum, and other chains from web apps and the command line. No backend canister required."
sidebar:
  order: 5
---

The [Chain Fusion Signer](https://github.com/dfinity/chain-fusion-signer) is a public canister on ICP that exposes the IC's threshold signature APIs directly to web apps and CLI users. Normally, accessing threshold ECDSA or Schnorr requires deploying your own backend canister. With the Chain Fusion Signer, you call a shared, governance-controlled canister instead.

**Canister ID (mainnet):** `grghe-syaaa-aaaar-qabyq-cai`

The signer charges callers in cycles for each API call. You pre-approve the signer to withdraw from your cycles ledger account using ICRC-2 before making calls.

## Prerequisites

- An ICP identity with cycles in the [Cycles Ledger](../../references/system-canisters.md#cycles-ledger) (`um5iw-rqaaa-aaaaq-qaaba-cai`)
- icp-cli installed and authenticated (`icp identity whoami`)
- For offline address derivation: Node.js and `npx`

## Approve payment

Every signer API call deducts cycles from your cycles ledger account. Before calling the signer, approve it to spend cycles on your behalf. One approval covers multiple calls until the allowance is exhausted.

```bash
SIGNER="grghe-syaaa-aaaar-qabyq-cai"
CYCLES_LEDGER="um5iw-rqaaa-aaaaq-qaaba-cai"

# Approve 1 trillion cycles: enough for ~27 signing operations
icp canister call "$CYCLES_LEDGER" icrc2_approve \
  "(record {
    amount = 1_000_000_000_000 : nat;
    spender = record { owner = principal \"${SIGNER}\" };
  })" \
  --network ic
```

See [API fees](#api-fees) for per-method costs.

## Get your Ethereum address

Each principal has a deterministic Ethereum address on the signer. Retrieve it with:

```bash
icp canister call "$SIGNER" eth_address_of_caller \
  '(opt variant { CallerPaysIcrc2Cycles })' \
  --network ic
```

```candid
(variant { Ok = record { address = "0xf53e047376e37eAc56d48245B725c47410cf6F1e" } })
```

To look up the address of another principal:

```bash
icp canister call "$SIGNER" eth_address \
  "(record { \"principal\" = opt principal \"<TARGET_PRINCIPAL>\" },
   opt variant { CallerPaysIcrc2Cycles })" \
  --network ic
```

### Derive offline (no cycles)

Address derivation involves no secret key material, so it can be done offline using `@dfinity/ic-pub-key`:

```bash
npx @dfinity/ic-pub-key signer eth address -u <YOUR_PRINCIPAL>
```

This produces the same address as the canister call but costs no cycles.

## Sign an Ethereum transaction

Build and sign an EIP-1559 transaction:

```bash
icp canister call "$SIGNER" eth_sign_transaction \
  "(record {
    to            = \"0xRecipientAddress\";
    chain_id      = 1 : nat;
    nonce         = 0 : nat;
    gas           = 21000 : nat;
    max_fee_per_gas           = 20_000_000_000 : nat;
    max_priority_fee_per_gas  = 1_000_000_000 : nat;
    value         = 1_000_000_000_000_000_000 : nat;
    data          = null;
  },
  opt variant { CallerPaysIcrc2Cycles })" \
  --network ic
```

To sign a pre-hashed message:

```bash
icp canister call "$SIGNER" eth_sign_prehash \
  "(record { hash = \"0x<32-byte-hex-hash>\" },
   opt variant { CallerPaysIcrc2Cycles })" \
  --network ic
```

## Get your Bitcoin address

```bash
icp canister call "$SIGNER" btc_caller_address \
  "(record { network = variant { mainnet }; address_type = variant { P2WPKH } },
   opt variant { CallerPaysIcrc2Cycles })" \
  --network ic
```

### Derive offline (no cycles)

```bash
npx @dfinity/ic-pub-key signer btc address -u <YOUR_PRINCIPAL> -n mainnet
```

For testnet, use `-n testnet`.

## Check your Bitcoin balance

```bash
icp canister call "$SIGNER" btc_caller_balance \
  "(record {
    network           = variant { mainnet };
    address_type      = variant { P2WPKH };
    min_confirmations = null;
  },
  opt variant { CallerPaysIcrc2Cycles })" \
  --network ic
```

## Send Bitcoin

```bash
icp canister call "$SIGNER" btc_caller_send \
  "(record {
    network      = variant { mainnet };
    address_type = variant { P2WPKH };
    utxos_to_spend = vec {};
    fee_satoshis = null;
    outputs = vec {
      record {
        destination_address = \"bc1qRecipientAddress\";
        sent_satoshis = 10000 : nat64;
      }
    };
  },
  opt variant { CallerPaysIcrc2Cycles })" \
  --network ic
```

`utxos_to_spend` selects specific UTXOs. Pass `vec {}` to let the signer choose automatically.

## Generic ECDSA signing

Use `generic_sign_with_ecdsa` when you need raw threshold ECDSA signatures for chains the signer does not have dedicated methods for:

```bash
icp canister call "$SIGNER" generic_sign_with_ecdsa \
  "(opt variant { CallerPaysIcrc2Cycles },
   record {
     key_id = record { name = \"key_1\"; curve = variant { secp256k1 } };
     derivation_path = vec { blob \"my_app\"; blob \"user_key_1\" };
     message_hash = blob \"<32-byte-message-hash>\";
   })" \
  --network ic
```

Use a stable derivation path to get the same key every time. Different paths yield independent keys.

## Schnorr signing

```bash
icp canister call "$SIGNER" schnorr_sign \
  "(record {
    key_id = record { algorithm = variant { ed25519 }; name = \"key_1\" };
    derivation_path = vec { blob \"my_app\"; blob \"user_key_1\" };
    message = blob \"<message-bytes>\";
  },
  opt variant { CallerPaysIcrc2Cycles })" \
  --network ic
```

## Web app integration

In a web app, call the signer from the browser using a generated TypeScript actor. Generate bindings from the signer's Candid interface:

```bash
# Download the signer's Candid interface
icp canister metadata "$SIGNER" candid:service --network ic > signer.did

# Generate TypeScript bindings (requires @icp-sdk/bindgen)
npx @icp-sdk/bindgen --did-file signer.did --out-dir src/declarations/signer
```

Then create actors for both the Cycles Ledger (for payment approval) and the signer:

```typescript
import { createActor as createCyclesLedgerActor } from './declarations/cycles_ledger';
import { createActor as createSignerActor } from './declarations/signer';

async function approveAndSign(identity: Identity, messageHash: string) {
  const agent = await HttpAgent.create({ identity });

  const cyclesLedger = createCyclesLedgerActor('um5iw-rqaaa-aaaaq-qaaba-cai', { agent });
  const signer = createSignerActor('grghe-syaaa-aaaar-qabyq-cai', { agent });

  // Pre-approve 1 trillion cycles
  await cyclesLedger.icrc2_approve({
    amount: 1_000_000_000_000n,
    spender: { owner: Principal.fromText('grghe-syaaa-aaaar-qabyq-cai'), subaccount: [] },
    expires_at: [],
    fee: [],
    memo: [],
    from_subaccount: [],
    created_at_time: [],
    expected_allowance: [],
  });

  // Sign the prehash
  const result = await signer.eth_sign_prehash(
    { hash: messageHash },
    [{ CallerPaysIcrc2Cycles: null }]
  );

  if ('Err' in result) throw new Error(JSON.stringify(result.Err));
  return result.Ok.signature;
}
```

<!-- Needs human verification: TypeScript actor creation pattern — verify against generated bindings for the actual signer IDL -->

OISY Wallet uses the Chain Fusion Signer as its production signing backend and serves as a reference implementation. OISY uses `PatronPaysIcrc2Cycles`: the OISY backend canister pre-approves cycles on each user's behalf, so individual users pay no cycles directly.

## API fees

Fees are charged per call in cycles. Verify against the [source](https://github.com/dfinity/chain-fusion-signer/blob/main/src/signer/api/src/methods.rs) for the latest values (table reflects v0.3.0):

| Method | Fee (cycles) |
|--------|-------------|
| `eth_address`, `eth_address_of_caller` | 77,000,000 |
| `btc_caller_address` | 79,000,000 |
| `generic_caller_ecdsa_public_key`, `schnorr_public_key` | 77,000,000 |
| `btc_caller_balance` | 113,000,000 |
| `eth_personal_sign`, `eth_sign_prehash`, `eth_sign_transaction` | 37,000,000,000 |
| `generic_sign_with_ecdsa`, `schnorr_sign` | 37,000,000,000 |
| `btc_caller_send`, `btc_caller_sign` | 132,000,000,000 |

Fees are set at approximately 140% of the typical call cost to cover failed-call overhead.

## Payment variants

The `opt PaymentType` argument accepts these variants:

| Variant | Description |
|---------|-------------|
| `CallerPaysIcrc2Cycles` | Caller pre-approves the Cycles Ledger; recommended for CLI and web apps |
| `CallerPaysIcrc2Tokens { ledger }` | Pay via ICRC-2 token transfer; for this canister the ledger is hardcoded to the Cycles Ledger |
| `PatronPaysIcrc2Cycles { owner; subaccount }` | A patron account covers costs on the caller's behalf |
| `PatronPaysIcrc2Tokens { owner; subaccount }` | Patron pays via ICRC-2 token; for this canister the ledger is hardcoded to the Cycles Ledger |
| `AttachedCycles` | Cycles attached directly to the call (requires proxy canister support) |

Pass `null` instead of a payment type to use the canister's default, which is `CallerPaysIcrc2Cycles`.

**Note on token variants:** `CallerPaysIcrc2Tokens` and `PatronPaysIcrc2Tokens` are supported by this canister, but the ledger is hardcoded to the Cycles Ledger: they do not accept arbitrary tokens such as ckBTC or ckETH. All five variants settle in cycles.

These variants are defined by [papi](https://github.com/dfinity/papi), an open-source Rust library for adding payment gateways to ICP canisters. The Chain Fusion Signer uses papi internally to handle fee collection. If you want to charge callers in your own canister (using the same `CallerPaysIcrc2Cycles` or `PatronPaysIcrc2Cycles` patterns) papi provides the implementation.

## Next steps

- [Bitcoin integration guide](bitcoin.md): build a full Bitcoin app with your own signing backend
- [Ethereum integration guide](ethereum.md): EVM RPC canister for reading Ethereum state
- [Cycles Ledger](../../references/system-canisters.md#cycles-ledger): fund your account with cycles
- [Offline key derivation](offline-key-derivation.md): derive ETH/BTC addresses for any canister principal without a management canister call
- [papi](https://github.com/dfinity/papi): add the same `CallerPaysIcrc2Cycles` / `PatronPaysIcrc2Cycles` payment pattern to your own canister

<!-- Upstream: informed by dfinity/chain-fusion-signer — src/signer/canister/signer.did, src/signer/api/src/methods.rs, README.md, check-pricing.report.md; dfinity/papi — README.md (payment variants and patron pattern); dfinity/ic-pub-key — README.md, src/cli.ts -->
