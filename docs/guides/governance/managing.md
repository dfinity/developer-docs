---
title: "Managing an SNS"
description: "Operate a live SNS: proposals, cycles, asset updates, and neuron management"
sidebar:
  order: 2
---

After an SNS launch succeeds, no single entity controls the dapp or its governance canisters — the community does. Every upgrade, parameter change, treasury transfer, and asset update must go through an SNS proposal and be approved by token holder vote. This guide covers the day-to-day operations of a live SNS: submitting and understanding proposals, keeping canisters funded with cycles, updating asset canisters via governance, and participating as a neuron holder.

For background on how SNS DAOs work, see [concepts/governance.md](../../concepts/governance.md). For the launch process itself, see [Launching an SNS](launching.md).

## How proposals work

An SNS proposal is a call to a method on a specific canister, executed fully onchain if the DAO adopts the proposal. Any eligible neuron (one meeting the minimum stake and dissolve delay requirements set in the nervous system parameters) can submit a proposal. The submitter pays a rejection fee if the proposal is rejected.

Proposals are adopted or rejected based on these rules:
- A proposal is **adopted immediately** if more than half of all available voting power votes yes — the result cannot be reversed, so waiting is pointless.
- A proposal is **rejected immediately** if at least half of all available voting power votes no.
- If the voting deadline is reached, the proposal is adopted if there are more yes votes than no votes and the used voting power exceeds the minimum threshold (currently set to 3% of total available voting power).

The SNS has a "wait for quiet" mechanism: if a proposal approaches its deadline with a narrow majority, the deadline extends to give the minority time to respond.

:::caution[Proposals blocked during the swap]
Six proposal types cannot be submitted while the decentralization swap is in progress: `ManageNervousSystemParameters`, `TransferSnsTreasuryFunds`, `MintSnsTokens`, `UpgradeSnsControlledCanister`, `RegisterDappCanisters`, and `DeregisterDappCanisters`.
:::

### Submitting proposals

The primary CLI tool for submitting SNS proposals is [quill](https://github.com/dfinity/quill), which creates and signs messages offline. Proposals are submitted with `quill sns make-proposal`.

Before submitting any proposal, export your neuron ID and PEM file path:

```bash
export PROPOSAL_NEURON_ID="594fd5d8dce3e793c3e421e1b87d55247627f8a63473047671f7f5ccc48eda63"
export PEM_FILE="/home/user/.config/dfx/identity/my-identity/identity.pem"
```

The general structure for submitting a proposal:

```bash
# Sign the proposal and write it to message.json
quill sns \
  --canister-ids-file ./sns_canister_ids.json \
  --pem-file $PEM_FILE \
  make-proposal $PROPOSAL_NEURON_ID \
  --proposal '(
    record {
      title = "Proposal title";
      url = "https://forum.dfinity.org/t/my-proposal/12345";
      summary = "What this proposal does and why.";
      action = opt variant {
        <PROPOSAL_TYPE> = <PARAMETERS>
      };
    }
  )' > message.json

# Send the signed proposal to the network
quill send message.json
```

The `sns_canister_ids.json` file lists all canister IDs for your SNS — see the [quill example file](https://github.com/dfinity/quill/blob/master/e2e/assets/sns_canister_ids.json) for the format.

Community-built tools like [ic-toolkit.app/sns-management](https://ic-toolkit.app/sns-management) provide a web interface for submitting proposals without using the CLI directly.

## Native proposal types

SNS governance comes with built-in proposal types. Below are the most common ones for ongoing operations.

### Motion

A motion proposal has no on-chain effect — it does not call any method. Use it for opinion polls, governance signaling, or gathering community consensus before a technical proposal.

```bash
quill sns \
  --canister-ids-file ./sns_canister_ids.json \
  --pem-file $PEM_FILE \
  make-proposal $PROPOSAL_NEURON_ID \
  --proposal '(
    record {
      title = "Motion: adopt new fee structure";
      url = "https://forum.dfinity.org/t/fee-discussion/99999";
      summary = "A motion to signal community support for updating the fee structure before a formal parameter change.";
      action = opt variant {
        Motion = record {
          motion_text = "The SNS community supports updating the protocol fee to 0.001 tokens.";
        }
      };
    }
  )' > message.json

quill send message.json
```

### ManageNervousSystemParameters

Each SNS can be customized through its nervous system parameters, which configure voting mechanics, staking requirements, reward rates, and more. Any parameter can be updated by proposal — set `null` for fields you do not want to change.

```candid
type NervousSystemParameters = record {
  default_followees                          : opt DefaultFollowees;
  max_dissolve_delay_seconds                 : opt nat64;
  max_dissolve_delay_bonus_percentage        : opt nat64;
  max_followees_per_function                 : opt nat64;
  neuron_claimer_permissions                 : opt NeuronPermissionList;
  neuron_minimum_stake_e8s                   : opt nat64;
  max_neuron_age_for_age_bonus               : opt nat64;
  initial_voting_period_seconds              : opt nat64;
  neuron_minimum_dissolve_delay_to_vote_seconds : opt nat64;
  reject_cost_e8s                            : opt nat64;
  max_proposals_to_keep_per_action           : opt nat32;
  wait_for_quiet_deadline_increase_seconds   : opt nat64;
  max_number_of_neurons                      : opt nat64;
  transaction_fee_e8s                        : opt nat64;
  max_number_of_proposals_with_ballots       : opt nat64;
  max_age_bonus_percentage                   : opt nat64;
  neuron_grantable_permissions               : opt NeuronPermissionList;
  voting_rewards_parameters                  : opt VotingRewardsParameters;
  maturity_modulation_disabled               : opt bool;
  max_number_of_principals_per_neuron        : opt nat64;
  automatically_advance_target_version       : opt bool;
};
```

For a description of each parameter and its effect, see the Learn Hub [DAO Settings](https://learn.internetcomputer.org/hc/en-us/articles/34142964565396) article.

### ManageSnsMetadata

Updates the SNS project name, description, logo, or URL. Fields set to `null` remain unchanged.

```bash
quill sns \
  --canister-ids-file ./sns_canister_ids.json \
  --pem-file $PEM_FILE \
  make-proposal $PROPOSAL_NEURON_ID \
  --proposal '(
    record {
      title = "Update SNS description";
      url = "https://forum.dfinity.org/t/rebranding/55555";
      summary = "Updates the SNS description to reflect the new product positioning.";
      action = opt variant {
        ManageSnsMetadata = record {
          url         = null;
          logo        = null;
          name        = null;
          description = opt "Updated description for the project.";
        };
      };
    }
  )' > message.json

quill send message.json
```

### ManageLedgerParameters

Updates ledger parameters: transfer fee, token name, token symbol, or token logo. Fields set to `null` remain unchanged.

```bash
quill sns \
  make-proposal $PROPOSAL_NEURON_ID \
  --proposal '(
    record {
      title = "Reduce transfer fee to 314_159 e8s";
      url = "https://forum.dfinity.org/t/fee-reduction/77777";
      summary = "Reduces the transfer fee to 314_159 e8s (~0.00314159 tokens) to lower transaction costs.";
      action = opt variant {
        ManageLedgerParameters = record {
          token_symbol  = null;
          transfer_fee  = opt 314_159;
          token_logo    = null;
          token_name    = null;
        }
      };
    }
  )' \
  --canister-ids-file ./sns_canister_ids.json > message.json

quill send message.json
```

### UpgradeSnsControlledCanister

Upgrades a dapp canister controlled by the SNS to a new Wasm. Because Wasm binaries are large and awkward to pass as CLI arguments, use `quill sns make-upgrade-canister-proposal` instead of `make-proposal`:

```bash
export WASM_PATH="/home/user/my_backend.wasm.gz"
export TARGET_CANISTER_ID="4ijyc-kiaaa-aaaaf-aaaja-cai"

quill sns \
  --canister-ids-file ./sns_canister_ids.json \
  --pem-file $PEM_FILE \
  make-upgrade-canister-proposal \
  --target-canister-id $TARGET_CANISTER_ID \
  --wasm-path $WASM_PATH \
  $PROPOSAL_NEURON_ID > message.json

quill send message.json
```

If your Wasm exceeds 2 MiB (the ingress message size limit), you must upload it in chunks to a store canister and reference those chunks in the proposal. See the [large Wasm guide](../../guides/canister-management/large-wasm.md) for the chunked upload process.

### AdvanceSnsTargetVersion

Updates the SNS framework canisters (governance, ledger, root, swap, index, archive) to a newer version approved by the NNS. All approved SNS Wasm versions are stored on the SNS-W canister.

```bash
quill sns \
  --canister-ids-file ./sns_canister_ids.json \
  --pem-file $PEM_FILE \
  make-proposal $PROPOSAL_NEURON_ID \
  --proposal '(
    record {
      title = "Advance SNS to target version X.Y.Z";
      url = "https://forum.dfinity.org/t/sns-upgrade/44444";
      summary = "Advances the SNS framework canisters to the NNS-approved version X.Y.Z.";
      action = opt variant {
        AdvanceSnsTargetVersion = record {
          new_target = null;
        };
      };
    }
  )' > message.json

quill send message.json
```

:::tip[Automatic upgrades]
Set `automatically_advance_target_version = true` in the nervous system parameters to have the SNS upgrade automatically whenever the NNS approves a new version, without requiring a separate community proposal each time.
:::

### TransferSnsTreasuryFunds

Transfers ICP or SNS tokens from the DAO treasury to a specified account. Treasury transfers are rate-limited: the total amount transferable in a 7-day window depends on the XDR value of the treasury holdings:

| Treasury size | 7-day limit |
|---------------|-------------|
| Small (≤ 100,000 XDR) | 100% of treasury |
| Medium (100,000–1,200,000 XDR) | 25% of treasury |
| Large (> 1,200,000 XDR) | 300,000 XDR |

ICP and SNS token treasuries are tracked separately.

```bash
quill sns \
  make-proposal $PROPOSAL_NEURON_ID \
  --proposal '(
    record {
      title = "Transfer 100 ICP to development fund";
      url = "https://forum.dfinity.org/t/dev-fund-proposal/33333";
      summary = "Transfers 100 ICP from the treasury to the development multisig for Q2 infrastructure costs.";
      action = opt variant {
        TransferSnsTreasuryFunds = record {
          from_treasury  = 1 : int32;
          to_principal   = opt principal "ozcnp-xcxhg-inakz-sg3bi-nczm3-jhg6y-idt46-cdygl-ebztx-iq4ft-vae";
          to_subaccount  = null;
          memo           = null;
          amount_e8s     = 10_000_000_000 : nat64;
        };
      };
    };
  )' \
  --canister-ids-file ./sns_canister_ids.json > message.json

quill send message.json
```

The `from_treasury` field uses `1` for ICP and `2` for SNS tokens.

### RegisterDappCanisters and DeregisterDappCanisters

To add a new canister to the SNS's control:

```bash
quill sns \
  --canister-ids-file ./sns_canister_ids.json \
  --pem-file $PEM_FILE \
  make-proposal $PROPOSAL_NEURON_ID \
  --proposal '(
    record {
      title = "Register new analytics canister";
      url = "https://forum.dfinity.org/t/new-canister/22222";
      summary = "Registers the new analytics canister under SNS governance control.";
      action = opt variant {
        RegisterDappCanisters = record {
          canister_ids = vec { principal "ltyfs-qiaaa-aaaak-aan3a-cai" };
        };
      };
    }
  )' > message.json

quill send message.json
```

To hand a canister back to specific principals (for example, to remove a deprecated canister from DAO control):

```bash
quill sns \
  --canister-ids-file ./sns_canister_ids.json \
  --pem-file $PEM_FILE \
  make-proposal $PROPOSAL_NEURON_ID \
  --proposal '(
    record {
      title = "Deregister deprecated canister";
      url = "https://forum.dfinity.org/t/deregister/11111";
      summary = "Returns control of the deprecated v1 canister to the core team.";
      action = opt variant {
        DeregisterDappCanisters = record {
          canister_ids    = vec { principal "ltyfs-qiaaa-aaaak-aan3a-cai" };
          new_controllers = vec { principal "rymrc-piaaa-aaaao-aaljq-cai" };
        };
      };
    }
  )' > message.json

quill send message.json
```

### MintSnsTokens

Mints new SNS tokens to a specific account. Use sparingly — unexpected minting dilutes existing token holders and can erode community trust.

```bash
quill sns \
  make-proposal $PROPOSAL_NEURON_ID \
  --proposal '(
    record {
      title = "Mint 10,000 tokens for grants program";
      url = "https://forum.dfinity.org/t/grants/66666";
      summary = "Mints 10,000 tokens to the grants multisig for the Q3 developer grants program, as approved by the community vote in proposal #42.";
      action = opt variant {
        MintSnsTokens = record {
          to_principal = opt principal "ozcnp-xcxhg-inakz-sg3bi-nczm3-jhg6y-idt46-cdygl-ebztx-iq4ft-vae";
          to_subaccount = null;
          memo          = null;
          amount_e8s    = opt 1_000_000_000_000 : opt nat64;
        }
      }
    }
  )' \
  --canister-ids-file ./sns_canister_ids.json > message.json

quill send message.json
```

## Custom proposals (generic nervous system functions)

Custom proposals let SNS communities define their own governance-gated operations beyond what the native proposal types provide. A custom proposal calls a specific method on a specific canister when adopted — any behavior your dapp needs can be made governable this way.

Each custom proposal has two parts:
- **Target**: the canister and method that execute the action when the proposal is adopted
- **Validator**: the canister and method that validate the payload when the proposal is submitted (not at execution time — validate again in the target method)

### Security considerations

Before registering a custom proposal:
- The target and validator canisters should be controlled by the SNS DAO, not by individual principals
- The target method must verify that only the SNS governance canister is the caller
- Both methods must always return a response — if the governance canister has an open call context it cannot be stopped, which blocks urgent upgrades
- Validate inputs again in the target method at execution time, not just in the validator — conditions can change during the multi-day voting period
- Avoid inter-canister calls in both methods to minimize re-entrancy risk

### AddGenericNervousSystemFunction

Register a new custom proposal type:

```bash
quill sns \
  --canister-ids-file ./sns_canister_ids.json \
  --pem-file $PEM_FILE \
  make-proposal $PROPOSAL_NEURON_ID \
  --proposal '(
    record {
      title = "Register custom proposal: update fee tiers";
      url = "https://forum.dfinity.org/t/fee-tiers/88888";
      summary = "Registers a new custom proposal type that allows the DAO to update fee tiers in the protocol canister.";
      action = opt variant {
        AddGenericNervousSystemFunction = record {
          id          = 2_000 : nat64;
          name        = "UpdateFeeTiers";
          description = opt "Allows the DAO to update fee tiers in the protocol canister.";
          function_type = opt variant {
            GenericNervousSystemFunction = record {
              validator_canister_id  = opt principal "YOUR_PROTOCOL_CANISTER_ID";
              target_canister_id     = opt principal "YOUR_PROTOCOL_CANISTER_ID";
              validator_method_name  = opt "validate_update_fee_tiers";
              target_method_name     = opt "update_fee_tiers";
            }
          };
        }
      };
    }
  )' > message.json

quill send message.json
```

IDs 0–999 are reserved for native proposal types. Use IDs 1000+ for custom proposals.

### ExecuteGenericNervousSystemFunction

Execute a previously registered custom proposal. The `function_id` must match the `id` you assigned when registering it:

```bash
export BLOB="$(didc encode --format blob '(record { tier = 2 : nat8; fee_e8s = 500 : nat64 })')"

quill sns \
  --canister-ids-file ./sns_canister_ids.json \
  --pem-file $PEM_FILE \
  make-proposal $PROPOSAL_NEURON_ID \
  --proposal '(
    record {
      title = "Update fee tier 2 to 500 e8s";
      url = "https://forum.dfinity.org/t/fee-proposal/99999";
      summary = "Updates fee tier 2 to 500 e8s as agreed in the community discussion.";
      action = opt variant {
        ExecuteGenericNervousSystemFunction = record {
          function_id = 2_000 : nat64;
          payload     = '"$BLOB"'
        }
      }
    }
  )' > message.json

quill send message.json
```

### RemoveGenericNervousSystemFunction

Remove a custom proposal type when it is no longer needed:

```bash
quill sns \
  --canister-ids-file ./sns_canister_ids.json \
  --pem-file $PEM_FILE \
  make-proposal $PROPOSAL_NEURON_ID \
  --proposal '(
    record {
      title = "Remove deprecated custom proposal #2000";
      url = "https://forum.dfinity.org/t/remove-proposal/77777";
      summary = "Removes the UpdateFeeTiers custom proposal type as the fee system has been replaced.";
      action = opt variant {
        RemoveGenericNervousSystemFunction = 2_000 : nat64;
      };
    }
  )' > message.json

quill send message.json
```

## Cycles management

SNS communities are fully responsible for keeping all SNS canisters and governed dapp canisters funded with cycles. The NNS maintains the code but not the cycle balances. If any canister runs out of cycles and is deleted, it is gone permanently.

:::caution[Archive canisters]
The SNS ledger automatically spawns archive canisters as blocks accumulate. When a new archive is spawned, the ledger transfers a portion of its cycles to fund the archive. **Monitor archive canisters separately** — if an archive runs out of cycles, ledger block history is lost. SNS canisters start with 180T cycles; the ledger starts with 60T (allocated as 30T for itself and 30T per archive).
:::

### Find all canisters and their cycle balances

Query SNS root to get a summary of all canisters and their current cycle balances:

```bash
icp canister call SNS_ROOT_CANISTER_ID get_sns_canisters_summary '(record { update_canister_list = opt false })' -e ic
```

This returns a list of all SNS framework canisters and registered dapp canisters with their current cycle balances.

### Top up a canister

Once you identify a canister running low on cycles, top it up directly using icp-cli:

```bash
# Convert ICP to cycles first (if needed)
icp cycles mint --icp 1 -e ic

# Top up a specific canister with cycles
icp canister top-up SNS_GOVERNANCE_CANISTER_ID --amount 50t -e ic
```

The `--amount` flag supports suffixes: `k` (thousand), `m` (million), `b` (billion), `t` (trillion). `50t` is 50 trillion cycles, which is a reasonable top-up for an SNS governance canister.

You can also top up via a treasury transfer proposal if the individual topping up the canister wants to be reimbursed from SNS funds. See `TransferSnsTreasuryFunds` above to transfer ICP from the treasury to the individual, who then converts to cycles and tops up the canisters.

For a broader guide on cycles management strategies, see [Cycles management](../canister-management/cycles-management.md).

## Asset canister updates

A dapp controlled by an SNS often includes an asset canister that serves the frontend. Once the SNS launches, the governance canister holds `Commit` permissions on the asset canister — no one can update assets without a successful governance vote.

The update process uses a custom proposal (generic nervous system function):
1. A principal with `Prepare` permissions stages the new assets
2. Anyone submits an `ExecuteGenericNervousSystemFunction` proposal referencing the staged batch
3. The DAO votes; if adopted, governance commits the batch

### Step 1: Register the commit function (one-time setup)

Register the `commit_proposed_batch` method as a custom proposal. Do this once after the SNS launches:

```bash
quill sns \
  --canister-ids-file ./sns_canister_ids.json \
  --pem-file $PEM_FILE \
  make-proposal $PROPOSAL_NEURON_ID \
  --proposal '(
    record {
      title = "Register asset canister commit function";
      url = "https://forum.dfinity.org/t/asset-setup/55555";
      summary = "Registers the commit_proposed_batch function on the asset canister as a custom SNS proposal, enabling the DAO to approve frontend updates.";
      action = opt variant {
        AddGenericNervousSystemFunction = record {
          id          = 4_000 : nat64;
          name        = "CommitAssetBatch";
          description = opt "Commits a proposed batch of asset changes to the frontend canister.";
          function_type = opt variant {
            GenericNervousSystemFunction = record {
              validator_canister_id  = opt principal "YOUR_ASSET_CANISTER_ID";
              target_canister_id     = opt principal "YOUR_ASSET_CANISTER_ID";
              validator_method_name  = opt "validate_commit_proposed_batch";
              target_method_name     = opt "commit_proposed_batch";
            }
          };
        }
      };
    }
  )' > message.json

quill send message.json
```

### Step 2: Stage the asset update

A developer with `Prepare` permission stages new assets using icp-cli:

```bash
# Stage new assets without committing them
icp deploy FRONTEND_CANISTER_NAME --by-proposal -e ic
```

The output includes the batch ID and evidence hash. For example:

```
Proposed commit of batch 2 with evidence e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855. Either commit it by proposal or delete it.
```

### Step 3: Verify the evidence (optional but recommended)

Have another team member independently compute the evidence to confirm the staged content is correct:

```bash
icp deploy FRONTEND_CANISTER_NAME --compute-evidence -e ic
```

The output should match the evidence from step 2.

### Step 4: Encode the proposal payload

Encode the batch ID and evidence for the proposal payload:

```bash
EVIDENCE_STRING="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
BATCH_ID=2

PAYLOAD=$(didc encode "(record{ batch_id = ${BATCH_ID} : nat; evidence = blob \"$(echo $EVIDENCE_STRING | sed 's/../\\&/g')\"; })")
```

### Step 5: Submit the commit proposal

```bash
quill sns \
  --canister-ids-file ./sns_canister_ids.json \
  --pem-file $PEM_FILE \
  make-proposal $PROPOSAL_NEURON_ID \
  --proposal "(
    record {
      title = \"Update frontend: new dashboard v2\";
      url = \"https://forum.dfinity.org/t/frontend-update/66666\";
      summary = \"Deploys the new dashboard v2 to the frontend canister. Evidence: ${EVIDENCE_STRING}\";
      action = opt variant {
        ExecuteGenericNervousSystemFunction = record {
          function_id = 4_000 : nat64;
          payload     = ${PAYLOAD}
        }
      }
    }
  )" > message.json

quill send message.json
```

If the proposal is rejected and you want to discard the staged changes, use the asset canister's `delete_batch` method:

```bash
icp canister call YOUR_ASSET_CANISTER_ID delete_batch \
  '(record { batch_id = 2 : nat })' \
  -e ic
```

## Neuron management

Neurons are the staking units that give token holders voting power and a share of governance rewards. To create an SNS neuron, stake SNS tokens to the SNS governance canister using the NNS dapp or a compatible wallet. The SNS governance canister derives your neuron's subaccount from your principal and a nonce using a domain-separated hash.

For technical details on the two-step neuron staking process (ledger transfer + `claim_or_refresh_neuron_from_account`), including a complete Rust implementation, see the [stake_neuron_from_cli](https://github.com/dfinity/examples/tree/master/rust/stake_neuron_from_cli) example in `dfinity/examples`.

For information on neurons, dissolve delays, voting power bonuses, and reward mechanics, see the Learn Hub articles on [SNS Neurons](https://learn.internetcomputer.org/hc/en-us/articles/34084687583252) and [SNS Rewards](https://learn.internetcomputer.org/hc/en-us/articles/34143058069396).

### Querying neuron state

Check the parameters governing your SNS (voting periods, reward rates, minimum stakes):

```bash
icp canister call SNS_GOVERNANCE_CANISTER_ID get_nervous_system_parameters '()' -e ic
```

Check current SNS canister cycles and status:

```bash
icp canister status SNS_GOVERNANCE_CANISTER_ID -e ic
```

## Common operational mistakes

**Not monitoring archive canister cycles.** The SNS ledger spawns archive canisters automatically. These are easy to miss since they are not in the original canister list. If an archive runs out of cycles, the ledger's transaction history is permanently lost.

**Submitting a proposal before community discussion.** The rejection fee is paid even if the proposal passes — but a surprise proposal with no prior discussion often gets rejected, wasting the fee and damaging community trust. Always post in the DAO forum before submitting a proposal.

**Forgetting to validate at execution time in custom proposals.** The validator method runs when the proposal is submitted; conditions can change over the voting period (often multiple days). Your target method must re-validate any invariants it relies on.

**Allowing asset canister permissions to remain with individual principals.** After SNS launch, developers should hold only `Prepare` permissions on the asset canister — not `Commit`. If a developer retains `Commit` permission, they can bypass governance and update the frontend unilaterally.

**Treasury transfers without a clear spending plan.** `TransferSnsTreasuryFunds` proposals without a detailed explanation of how funds will be used frequently get rejected. Include the full budget breakdown, expected deliverables, and timeline in the proposal summary.

## Next steps

- [Testing an SNS](testing.md) — test SNS governance flows locally before committing to mainnet changes
- [Launching an SNS](launching.md) — the complete launch process reference

<!-- Upstream: informed by dfinity/portal — building-apps/governing-apps/managing/manage-sns-intro.mdx, making-proposals.mdx, cycles-usage.mdx, sns-asset-canister.mdx; dfinity/icskills — skills/sns-launch/SKILL.md; dfinity/examples — rust/stake_neuron_from_cli; dfinity/icp-cli — docs/reference/cli.md -->
