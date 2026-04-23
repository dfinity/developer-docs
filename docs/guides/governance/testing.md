---
title: "Testing SNS Governance"
description: "Test your SNS configuration locally and with a mainnet testflight before submitting the NNS proposal"
sidebar:
  order: 2
---

Testing your SNS before launch catches configuration mistakes that are impossible to fix after the NNS proposal is adopted. This guide covers two complementary testing stages: local testing with the `sns-testing` repository and a mainnet testflight using a mock SNS.

These stages address different questions:

- **Local testing**: Does the SNS launch process work? Can proposals be submitted and voted on? Do upgrade flows work as designed?
- **Mainnet testflight**: Does your app operate correctly *after* decentralization? Does your team have the right tooling and workflows for day-to-day governance operations?

Run both stages before submitting your NNS proposal. Skipping testflight is one of the most common mistakes teams make. The post-decentralization operational experience is very different from what local testing reveals.

## Before you start

You should already have:

- A working `sns_init.yaml` with parameters defined (see [Launching an SNS](launching.md))
- App canisters deployed on mainnet
- Reviewed the SNS launch stages and what each one does

## Stage 1: Local testing with sns-testing

The [dfinity/sns-testing](https://github.com/dfinity/sns-testing) repository contains scripts that simulate the full SNS launch flow on a local replica. The main goal is to confirm that the launch process itself (from proposal submission through swap finalization) works with your configuration.

Using `sns-testing` you can:

- Initiate proposals
- Pass proposals
- Start decentralization swaps
- Upgrade an app via DAO voting

### What sns-testing covers

`sns-testing` is designed around a single-canister app and a standard local IC environment. It works best when your app matches that setup. If you have a multi-canister app or custom governance flows, you may need to fork or adapt it.

This is intentional: `sns-testing` is one example of how to test the SNS process, not a universal test harness. Adapt it for your app or use your own tooling.

### Steps

The following maps each SNS launch stage to what you do (or observe) locally:

**Step 0: Deploy your app locally**

For a test app bundled with sns-testing:

```bash
./deploy_test_canister.sh
```

For your own app, deploy using your normal setup. For a multi-canister app, use whatever scripts or configuration you use to deploy locally.

**Step 1: Add NNS root as co-controller**

:::note[Requires dfx sns extension]
The `dfx sns prepare-canisters` command requires the `dfx sns` extension. No `icp-cli` equivalent exists yet. Install with: `dfx extension install sns`.
:::

<!-- TODO: update when icp-cli sns equivalent lands -->
```bash
# For a single canister:
dfx sns prepare-canisters add-nns-root $CANISTER_ID

# For multiple canisters, run for each one:
dfx sns prepare-canisters add-nns-root $CANISTER_ID_1
dfx sns prepare-canisters add-nns-root $CANISTER_ID_2
```

**Step 2: Fill in your SNS configuration**

Edit `example_sns_init.yaml` with your parameters. This is the same file format as `sns_init.yaml` from the launch guide.

**Step 3: Submit the NNS proposal locally**

```bash
# $NEURON_ID is provided by the sns-testing setup
dfx sns propose --network local --neuron $NEURON_ID example_sns_init.yaml
```

**Steps 4–10: Automated**

Stages 4 through 10 run automatically after the proposal is adopted:

| Stage | What happens |
|-------|-------------|
| 4 | NNS votes on and adopts the proposal |
| 5 | SNS-W deploys SNS canisters |
| 6 | SNS root becomes sole controller of your app |
| 7 | SNS canisters are initialized in pre-swap mode |
| 8 | Swap opens; participate: `./participate_in_sns_swap.sh` |
| 9 | Swap closes |
| 10 | Swap finalizes |

**After launch: test upgrade flows**

Once the test SNS is live, verify that governance-controlled upgrades work:

| Action | Script |
|--------|--------|
| Upgrade a canister via SNS proposal | `./upgrade_test_canister.sh` |
| Vote on an upgrade proposal | `./vote_on_sns_proposal.sh` |

### Using PocketIC for SNS integration tests

For canister-level integration tests that need an SNS subnet, use PocketIC with NNS and SNS subnets configured. This is appropriate when you want to test your canister's behavior under SNS governance in an automated test suite, not just walk through the launch process.

In Rust:

<!-- Needs human verification: with_sns_subnet() existence in pocket-ic crate — not found in .sources/ (cdk-rs, examples). The verified pattern uses with_nns_subnet() + with_application_subnet(); SNS subnet topology may be achieved differently or not yet exposed in the public API at version 9.0.2. -->
```rust title=tests/sns_integration.rs
use pocket_ic::{PocketIc, PocketIcBuilder};
use candid::Principal;

// pocket-ic = "9"
#[test]
fn test_canister_under_sns_governance() {
    // Build an instance with NNS and SNS subnets: matching mainnet topology
    let pic = PocketIcBuilder::new()
        .with_nns_subnet()
        .with_sns_subnet()  // requires human verification: check pocket-ic 9.x API
        .with_application_subnet()
        .build();

    // Get the application subnet for your app canisters
    let app_subnets = pic.topology().get_app_subnets();
    let app_subnet = app_subnets[0];

    // Create and install your app canister on the application subnet
    let canister_id = pic.create_canister_on_subnet(None, None, app_subnet);
    pic.add_cycles(canister_id, 2_000_000_000_000);

    // Install your canister WASM and run governance-related tests
    // ...
}
```

The SNS and NNS subnets carry the same canister ID ranges as mainnet, which matters when testing code that references specific canister IDs (for example, checking that the SNS root is a controller of your canister).

See [PocketIC](../testing/pocket-ic.md) for the full setup guide, including multi-subnet topology, time control, and the JavaScript/TypeScript Pic JS client.

## Stage 2: Mainnet testflight

An SNS testflight deploys a mock SNS directly to the mainnet without going through an NNS proposal or running a real decentralization swap. You retain full control of the mock SNS throughout the test flight: there are no real token holders, no real swap participants, and no irreversible steps.

**The testflight tests what local testing cannot:** how your app operates after the transfer of control. You will interact with your app exclusively through SNS proposals, which reveals operational gaps that developers consistently miss:

- Gaps in proposal tooling: creating, describing, and executing proposals for routine operations
- Missing custom (generic) proposals for operations specific to your app
- Cycles management issues: canisters that go dark because no one can top them up through governance
- Monitoring blind spots: metrics and alerting that relied on direct canister access

Run the testflight for days or weeks, not hours. Operate your app in this mode as if it were live: push updates, respond to issues, exercise every governance flow you expect to need after launch.

### Testflight vs. production

| Aspect | Testflight | Production |
|--------|-----------|------------|
| Deployed by | Developer directly | NNS proposal + SNS-W |
| Swap | No real swap | Real ICP ↔ SNS token swap |
| Developer control | Retained (for recovery) | Fully transferred to SNS root |
| Subnet | Regular application subnet | Dedicated SNS subnet |
| Rollback | Yes, developer can abort | No, irreversible after swap |

### Prerequisites

:::note[Requires dfx sns extension]
The testflight commands below require the `dfx sns` extension. No `icp-cli` equivalent exists yet. Install with: `dfx extension install sns`.
:::

You also need:

- [quill](https://github.com/dfinity/quill): for submitting SNS proposals from the command line
- [didc](https://github.com/dfinity/candid): for encoding Candid payloads

### Step 1: Import and download SNS canisters

Import the SNS canister definitions into your project and download their WASM binaries:

<!-- TODO: verify current DFX_IC_COMMIT hash — check dfinity/sdk releases or the sns-testing repository for the canonical current value -->
```bash
DFX_IC_COMMIT=94bbea43c7585a1ef970bd569a447c269af9650b dfx sns import
DFX_IC_COMMIT=94bbea43c7585a1ef970bd569a447c269af9650b dfx sns download
```

### Step 2: Deploy the testflight SNS

Deploy the mock SNS using your `sns_init.yaml` configuration file:

```bash
# Local deployment (for a dry run before spending cycles on mainnet):
dfx sns deploy-testflight --init-config-file="/path/to/sns_init.yaml"

# Mainnet deployment:
dfx sns deploy-testflight --init-config-file="/path/to/sns_init.yaml" --network ic
```

After deployment, save the developer neuron ID printed at the end of the output. This neuron has full control over the testflight SNS and is used to submit proposals. The actual output looks like:

```
Developer neuron IDs:
<neuron-id>
```

Copy the neuron ID that appears after the colon for use in subsequent steps.

### Step 3: Add SNS root as co-controller

Add the SNS root canister as an **additional** controller of each app canister. Keep yourself as a controller too: this lets you abort the testflight later if needed.

```bash
# Locally:
icp canister settings update test \
  --add-controller $(icp canister id sns_root)

# On mainnet:
icp canister settings update test \
  --add-controller $(icp canister id sns_root -e ic) \
  -e ic
```

### Step 4: Register app canisters with SNS root

Register your canisters with the testflight SNS by submitting a proposal via `quill`. Set the environment variables for your deployment:

```bash
export DEVELOPER_NEURON_ID="<neuron-id-from-step-2>"
# icp identity default prints the current identity name; the .config/dfx/identity/ path
# is where dfx stores PEM files. If you created your identity with icp-cli, the path
# may differ: check ~/.config/icp/identity/ or the path shown by `icp identity export`.
export PEM_FILE="$HOME/.config/dfx/identity/$(icp identity default)/identity.pem"
export CID="$(icp canister id test -e ic)"
```

Submit the registration proposal:

```bash
quill sns \
  --canister-ids-file ./sns_canister_ids.json \
  --pem-file "$PEM_FILE" \
  make-proposal \
  --proposal "(record {
    title=\"Register dapp canisters with SNS.\";
    url=\"https://example.com/\";
    summary=\"This proposal registers dapp canisters with SNS.\";
    action=opt variant {RegisterDappCanisters = record {
      canister_ids=vec {principal\"$CID\"}
    }}
  })" \
  "$DEVELOPER_NEURON_ID" > register.json

quill send register.json --network ic
```

For a local testflight, pass `--insecure-local-dev-mode` to `quill send` instead of `--network ic`.

To register multiple canisters in a single proposal, extend the `canister_ids` vector:

```bash
# Multiple canisters:
# canister_ids=vec {principal\"$CID1\"; principal\"$CID2\";}
```

Verify registration succeeded:

```bash
icp canister call sns_root list_sns_canisters '(record {})' -e ic
# Expected: your dapp canisters listed under "dapps"
```

### Step 5: Test canister upgrades via SNS proposals

Build a new version of your canister, then submit an upgrade proposal using `quill`:

```bash
# This is a dfx build output path. For icp-cli projects, the WASM is at:
# target/wasm32-unknown-unknown/release/test.wasm
# or the path set by $ICP_WASM_OUTPUT_PATH in your icp.yaml build config.
export WASM_PATH="./.dfx/ic/canisters/test/test.wasm"

quill sns \
  --canister-ids-file ./sns_canister_ids.json \
  --pem-file "$PEM_FILE" \
  make-upgrade-canister-proposal \
  --summary "Upgrade test canister." \
  --title "Upgrade test canister." \
  --url "https://example.com/" \
  --target-canister-id "$CID" \
  --wasm-path "$WASM_PATH" \
  "$DEVELOPER_NEURON_ID" > upgrade.json

quill send upgrade.json --network ic | grep -v "^ *new_canister_wasm"
```

The `grep -v "^ *new_canister_wasm"` suppresses the WASM binary in output. Omit it if you want to confirm the full binary is included.

### Testing generic proposals

Generic proposals let you execute arbitrary code on SNS-managed canisters through governance. If your app requires operations beyond standard canister upgrades (for example, updating configuration, rotating keys, or publishing new content) you will need generic proposals.

First, implement the required validation and execution functions in your canister:

```rust
use candid::CandidType;
use serde::Deserialize;

#[derive(CandidType, Debug, Deserialize)]
struct MyPayload {
    new_fee: u64,
    description: String,
}

// The validation function must return Result<String, String>
#[ic_cdk::update]
fn validate_update_fee(payload: MyPayload) -> Result<String, String> {
    if payload.new_fee > 1_000_000 {
        return Err("Fee exceeds maximum allowed value".to_string());
    }
    Ok(format!(
        "Update fee to {} ({})",
        payload.new_fee, payload.description
    ))
}

// The execution function receives the same binary payload
#[ic_cdk::update]
fn execute_update_fee(payload: MyPayload) {
    // Apply the fee change
    // Note: return value is ignored; use update calls for side effects only
}
```

Register the generic functions with the testflight SNS:

```bash
quill sns \
  --canister-ids-file ./sns_canister_ids.json \
  --pem-file "$PEM_FILE" \
  make-proposal \
  --proposal "(record {
    title=\"Register generic functions.\";
    url=\"https://example.com/\";
    summary=\"Register custom governance functions for fee updates.\";
    action=opt variant {AddGenericNervousSystemFunction = record {
      id=1000:nat64;
      name=\"UpdateFee\";
      description=null;
      function_type=opt variant {GenericNervousSystemFunction=record{
        validator_canister_id=opt principal\"$CID\";
        target_canister_id=opt principal\"$CID\";
        validator_method_name=opt\"validate_update_fee\";
        target_method_name=opt\"execute_update_fee\"
      }}
    }}
  })" \
  "$DEVELOPER_NEURON_ID" > register-generic.json

quill send register-generic.json --network ic
```

Generic function IDs must be 1000 or greater. Each function needs a unique ID.

Once registered, execute the generic function with a Candid-encoded payload:

```bash
# Encode the payload using didc
didc encode '(record {new_fee=500:nat64; description="Lower transaction fee"})' --format blob

# Then use the blob in the proposal:
quill sns \
  --canister-ids-file ./sns_canister_ids.json \
  --pem-file "$PEM_FILE" \
  make-proposal \
  --proposal "(record {
    title=\"Update fee.\";
    url=\"https://example.com/\";
    summary=\"Lower transaction fee to 500.\";
    action=opt variant {ExecuteGenericNervousSystemFunction = record {
      function_id=1000:nat64;
      payload=blob \"<output-from-didc>\"
    }}
  })" \
  "$DEVELOPER_NEURON_ID" > execute-generic.json

quill send execute-generic.json --network ic
```

### Checking testflight proposals

List all proposals in the testflight SNS:

```bash
icp canister call sns_governance list_proposals \
  '(record {
    include_reward_status = vec {};
    limit = 0;
    exclude_type = vec {};
    include_status = vec {};
  })' -e ic
```

Adjust `limit` to fetch only the most recent proposals if you have many.

### Aborting the testflight

When you have finished testing, verify that you are still a controller of your app canisters:

```bash
icp canister status test -e ic
# Expected: your principal listed as a controller alongside SNS root
```

If you are still a controller, you can safely delete the testflight SNS canisters and reclaim cycles. If SNS root has become the sole controller (for example, after testing a full transfer), you can recover access by reinstalling the SNS root canister with recovery code. See the `sns-testing` repository for the recovery pattern.

## Pre-launch verification checklist

Before submitting the NNS proposal, confirm all of these:

:::note[Requires dfx sns extension]
The `dfx sns init-config-file validate` command in the checklist below requires the `dfx sns` extension. Install with: `dfx extension install sns`.
:::

**SNS configuration**
- [ ] `sns_init.yaml` validates successfully with `dfx sns init-config-file validate`
- [ ] Total token allocation matches the sum of all neuron stakes, treasury, and swap exactly
- [ ] `fallback_controller_principals` is set with your own principal
- [ ] Swap parameters (minimum participants, ICP range, duration) are realistic

**Local testing**
- [ ] Full SNS launch cycle completed locally with `sns-testing`
- [ ] Canister upgrade via SNS proposal tested and working
- [ ] Custom (generic) proposals registered and tested if your app needs them
- [ ] Token distribution matches expected neuron balances

**Mainnet testflight**
- [ ] Testflight SNS deployed and app canisters registered
- [ ] Canister upgrade executed successfully via SNS proposal
- [ ] All governance flows needed for day-to-day operations have been tested
- [ ] Cycles management strategy confirmed: governance can top up canisters
- [ ] Developer tooling is in place for creating proposals from the command line
- [ ] Testflight run for long enough to surface operational issues (days, not hours)

**Canister readiness**
- [ ] Admin functions are gated by SNS governance principal, not developer principal
- [ ] Canister state persists correctly across upgrades
- [ ] No direct developer access (outside of SNS proposals) is required for normal operations
- [ ] Monitoring and alerting work without direct canister access

For the full pre-submission checklist including tokenomics review and community engagement, see [Launching an SNS](launching.md).

## Next steps

- [Managing an SNS](managing.md): post-launch operations: submitting proposals, managing the treasury, and upgrading canisters once your SNS is live
- [PocketIC](../testing/pocket-ic.md): set up PocketIC for automated canister integration tests with NNS and SNS subnets

<!-- Upstream: informed by dfinity/portal — building-apps/governing-apps/testing/testing-before-launch.mdx, building-apps/governing-apps/testing/testing-locally.mdx, building-apps/governing-apps/testing/testing-on-mainnet.mdx; dfinity/icskills — skills/sns-launch/SKILL.md; dfinity/icp-js-sdk-docs — public/pic-js/latest.zip -->
