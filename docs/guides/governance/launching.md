---
title: "Launching an SNS"
description: "Decentralize your app with an SNS: token economics, governance setup, and NNS proposal submission"
sidebar:
  order: 1
---

A Service Nervous System (SNS) is a DAO framework that transfers control of your app from your team to a community of token holders. After launch, canister upgrades, treasury spending, and governance parameters all require token holder votes: your team no longer has unilateral control.

This guide walks through the complete launch process: from designing your tokenomics and configuring `sns_init.yaml`, to adding NNS root as a co-controller and submitting the NNS proposal that triggers the swap.

## Before you start

SNS launch is irreversible. Once the NNS proposal is adopted and the swap succeeds, your app canisters are fully controlled by SNS root. Review these prerequisites before proceeding:

- Your app canisters are deployed and working on mainnet
- You hold an NNS neuron with sufficient stake to submit proposals (8 ICP minimum stake, plus dissolve delay)
- You have done a security review and open-sourced the app code
- Your tokenomics design is finalized and community-vetted

See [concepts/governance.md](../../concepts/governance.md) for background on how SNS DAOs work.

## Pre-launch preparation

### Define your tokenomics

Before writing a single line of configuration, define these parameters clearly:

**Token utility**: explain what the token is used for within your ecosystem. Common utilities include governance voting, access to premium features, and in-app payments.

**Initial token allocation**: decide how tokens are split across these buckets:
- **Developer neurons**: tokens for founders and seed investors, with vesting schedules. Best practice is 12–48 months of vesting.
- **Treasury**: tokens controlled by the DAO governance canister for future spending proposals.
- **Swap**: tokens sold during the decentralization swap in exchange for ICP.

**Swap parameters**: set realistic minimums. If you require 500 participants but only 200 show up, the entire swap fails and all ICP is refunded. Most successful SNS launches use 100–200 minimum participants.

Use the [SNS Tokenomics Analyzer](https://dashboard.internetcomputer.org/sns/tokenomics) to evaluate your configuration and model voting power distribution before committing to parameters.

### Prepare the NNS proposal narrative

The NNS community votes on your proposal. You are pitching your project to thousands of token holders who will decide whether to approve the swap. Your proposal should address:

- Team backgrounds and track record
- Product-market fit evidence (user metrics, traction)
- Token utility and how it accrues value over time
- Tokenomics: distribution, vesting, voting power at genesis
- Funding target and how raised ICP will be spent
- Product roadmap
- Security review status and open-source build instructions
- Dependencies that cannot be managed by the SNS (external services, third-party providers)

Start a discussion thread in the [SNS Launch Proposals](https://forum.dfinity.org/c/community/sns-launch-proposals) forum category at least two weeks before submitting your NNS proposal. Share the draft `sns_init.yaml` file, the whitepaper, and the build/deploy instructions. Community trust built during this period directly affects proposal adoption.

### Technical readiness checklist

Before submitting the NNS proposal:

- [ ] App canisters are deployed and stable on mainnet
- [ ] Source code is open-sourced with reproducible build instructions
- [ ] Security review completed, critical findings addressed
- [ ] SNS launch tested locally using [dfinity/sns-testing](https://github.com/dfinity/sns-testing)
- [ ] SNS testflight deployed on mainnet to verify governance and upgrade flows
- [ ] All app operations (canister upgrades, asset updates) tested via SNS proposals
- [ ] Cycles management strategy in place so canisters never run out after launch
- [ ] Frontend SNS integration tested (swap UI, proposal voting)
- [ ] `sns_init.yaml` parameters validated locally

## Configure sns_init.yaml

All launch parameters are defined in a single YAML file. Copy the [template](https://github.com/dfinity/sns-testing/blob/main/example_sns_init.yaml) and fill in every field. The configuration file is included in the NNS proposal, so the NNS community can inspect every parameter before voting.

The file has five sections:

**Project metadata**: name, description, logo, and URL displayed to NNS voters and swap participants.

**Governance parameters**: proposal rejection fees, voting periods, minimum neuron stake, and voting power bonuses for dissolve delay and neuron age.

**Token configuration**: token name, ticker symbol, and ledger transaction fee.

**Token distribution**: developer neuron allocations (with dissolve delays and vesting periods), treasury balance, and swap allocation.

**Swap parameters**: minimum and maximum ICP participation, minimum participant count, swap duration (3–7 days is standard), Neurons' Fund participation, and any geo-restrictions or confirmation text.

Example configuration skeleton:

```yaml
# All numeric values are in e8s (1 token = 100_000_000 e8s). Time values are in seconds.

name: MyProject
description: >
  A decentralized application for [purpose].
url: https://myproject.com
logo: logo.png

NnsProposal:
  title: "Proposal to create an SNS for MyProject"
  url: "https://forum.dfinity.org/t/myproject-sns-proposal/XXXXX"
  summary: >
    This proposal creates an SNS DAO to govern MyProject.

fallback_controller_principals:
  - YOUR_PRINCIPAL_ID_HERE

dapp_canisters:
  - BACKEND_CANISTER_ID
  - FRONTEND_CANISTER_ID

Token:
  name: MyToken
  symbol: MYT
  transaction_fee: 0.0001 tokens
  logo: token_logo.png

Proposals:
  rejection_fee: 1 token
  initial_voting_period: 4 days
  maximum_wait_for_quiet_deadline_extension: 1 day

Neurons:
  minimum_creation_stake: 1 token

Voting:
  minimum_dissolve_delay: 1 month
  MaximumVotingPowerBonuses:
    DissolveDelay:
      duration: 8 years
      bonus: 100%
    Age:
      duration: 4 years
      bonus: 25%
  RewardRate:
    initial: 2.5%
    final: 2.5%
    transition_duration: 0 seconds

Distribution:
  Neurons:
    - principal: DEVELOPER_PRINCIPAL
      stake: 2_000_000 tokens
      memo: 0
      dissolve_delay: 6 months
      vesting_period: 24 months
  InitialBalances:
    treasury: 5_000_000 tokens
    swap: 2_500_000 tokens
  total: 10_000_000 tokens

Swap:
  minimum_participants: 100
  minimum_direct_participation_icp: 50_000 tokens
  maximum_direct_participation_icp: 500_000 tokens
  minimum_participant_icp: 1 token
  maximum_participant_icp: 25_000 tokens
  duration: 7 days
  neurons_fund_participation: true
  VestingSchedule:
    events: 5
    interval: 3 months
  confirmation_text: >
    I confirm that I am not a resident of a restricted jurisdiction
    and I understand the risks of participating in this token swap.
  restricted_countries:
    - US
    - CN
```

Add comments throughout the file explaining your parameter choices. The NNS community will read this file when evaluating the proposal.

**Important constraints:**

- `fallback_controller_principals` must be set. If the swap fails, these principals regain control of the app canisters. Without this, your app becomes uncontrollable if the swap fails.
- Developer neuron `total` must equal the sum of all neuron stakes, treasury, and swap allocations exactly.
- Only six proposal types are blocked during the swap window: `ManageNervousSystemParameters`, `TransferSnsTreasuryFunds`, `MintSnsTokens`, `UpgradeSnsControlledCanister`, `RegisterDappCanisters`, and `DeregisterDappCanisters`. Do not plan operations requiring these during the swap.

## Launch stages

The SNS launch proceeds through 11 stages. Only the first three require action from your team. The rest are automatic.

### Stage 1: Define parameters (manual)

Finalize `sns_init.yaml` with the parameters you have designed. These parameters become locked into the NNS proposal: you cannot change them after submission.

### Stage 2: Add NNS root as co-controller (manual)

Add the NNS root canister (`r7inp-6aaaa-aaaaa-aaabq-cai`) as a co-controller of each app canister. This is required for the automated stages to proceed: it gives NNS the authority to transfer canister control to SNS root after the proposal is adopted.

```bash
icp canister settings update BACKEND_CANISTER_ID \
  --add-controller r7inp-6aaaa-aaaaa-aaabq-cai \
  -e ic

icp canister settings update FRONTEND_CANISTER_ID \
  --add-controller r7inp-6aaaa-aaaaa-aaabq-cai \
  -e ic
```

Also revoke any special permissions your team held. For example, if developers had direct commit access to asset canisters, revoke that now: after launch, asset updates must go through SNS proposals:

```bash
# If using the asset canister, revoke direct commit permission from developer principals
icp canister call FRONTEND_CANISTER_ID revoke_permission \
  '(record {of_principal = principal "<developer-principal>"; permission = variant { Commit;};})'  \
  -e ic
```

### Stage 3: Submit NNS proposal (manual)

Anyone with an eligible NNS neuron can submit the proposal, but you should submit it with your own neuron.

:::note[Requires dfx sns extension]
The `dfx sns propose` command requires the `dfx sns` extension. No `icp-cli` equivalent exists yet. Install the extension with: `dfx extension install sns`. See the [dfx SNS documentation](https://github.com/dfinity/dfx-extensions) for details.
:::

<!-- TODO: update when icp-cli sns equivalent lands -->
```bash
dfx sns propose --network ic --neuron $NEURON_ID sns_init.yaml
```

There can only be one SNS creation proposal active in the NNS at a time. If another project's proposal is currently being voted on, you must wait for it to resolve before submitting yours.

After submitting, monitor your proposal's status on the [NNS app](https://nns.ic0.app) or by querying NNS governance directly.

### Stages 4–11: Automatic

After the NNS community votes to adopt the proposal, the remaining stages execute automatically:

| Stage | What happens |
|-------|-------------|
| 4 | NNS community votes; if adopted, remaining stages are triggered |
| 5 | SNS-W deploys uninitialized SNS canisters on an SNS subnet |
| 6 | SNS root becomes sole controller of app canisters |
| 7 | SNS canisters are initialized in pre-decentralization-swap mode |
| 8 | 24-hour minimum wait before swap opens (timing protocol applied) |
| 9 | Decentralization swap opens; users send ICP and receive SNS neurons |
| 10 | Swap closes (duration expires or maximum ICP reached) |
| 11 | Finalization: exchange rate set, SNS neurons distributed, normal mode activated |

If the swap reaches the minimum participation requirements, it succeeds: SNS governance enters normal mode, token holders become the DAO, and your app is fully decentralized. If the swap fails (not enough participants or ICP), everything reverts: your app's control returns to the `fallback_controller_principals`, and all ICP contributions are refunded.

## Prepare your canister for SNS governance

Your canister code does not need to change for basic SNS compatibility: SNS governance controls upgrades through the standard canister management API. However, if your canister has admin functions that were previously protected by principal checks, transition them to accept calls from the SNS governance canister:

**Motoko:**

```motoko
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

persistent actor {
  var snsGovernanceId : ?Principal = null;

  // ⚠ SECURITY: Only canister controllers should call this setter.
  // Without the controller check, any caller can front-run you and
  // set themselves as governance, permanently locking you out.
  public shared ({ caller }) func setSnsGovernance(id : Principal) : async () {
    assert (Principal.isController(caller));
    switch (snsGovernanceId) {
      case (null) { snsGovernanceId := ?id };
      case (?_) { Runtime.trap("SNS governance already set") };
    };
  };

  func requireGovernance(caller : Principal) {
    switch (snsGovernanceId) {
      case (?gov) {
        if (caller != gov) { Runtime.trap("Only SNS governance can call this") };
      };
      case (null) { Runtime.trap("SNS governance not configured") };
    };
  };

  // Admin functions become governance-gated:
  public shared ({ caller }) func updateConfig(newFee : Nat) : async () {
    requireGovernance(caller);
    // ... apply config change
  };
};
```

**Rust:**

```rust
use candid::Principal;
use ic_cdk::update;
use std::cell::RefCell;

thread_local! {
    // ⚠ STATE LOSS: thread_local! RefCell is heap storage: it is wiped on upgrade.
    // Use ic-stable-structures in production to persist across upgrades.
    // See: https://docs.rs/ic-stable-structures/latest/ic_stable_structures/ for StableCell.
    static SNS_GOVERNANCE: RefCell<Option<Principal>> = RefCell::new(None);
}

fn require_governance(caller: Principal) {
    SNS_GOVERNANCE.with(|g| {
        match *g.borrow() {
            Some(gov) if gov == caller => (),
            Some(_) => ic_cdk::trap("Only SNS governance can call this"),
            None => ic_cdk::trap("SNS governance not configured"),
        }
    });
}

// ⚠ SECURITY: Only canister controllers should call this setter.
#[update]
fn set_sns_governance(id: Principal) {
    if !ic_cdk::api::is_controller(&ic_cdk::api::msg_caller()) {
        ic_cdk::trap("Only canister controllers can set governance");
    }
    SNS_GOVERNANCE.with(|g| {
        let mut governance = g.borrow_mut();
        if governance.is_some() {
            ic_cdk::trap("SNS governance already set");
        }
        *governance = Some(id);
    });
}

#[update]
fn update_config(new_fee: u64) {
    require_governance(ic_cdk::api::msg_caller());
    // ... apply config change
}
```

## Verify your configuration before launch

Run the SNS configuration validator locally before submitting the NNS proposal:

:::note[Requires dfx sns extension]
The `dfx sns init-config-file validate` command requires the `dfx sns` extension. No `icp-cli` equivalent exists yet. Install with: `dfx extension install sns`.
:::

<!-- TODO: update when icp-cli sns equivalent lands -->
```bash
# Validate the configuration file for parameter consistency
dfx sns init-config-file validate
```

After a local testflight deployment, verify the SNS canisters are operational:

```bash
# Check governance is functional
icp canister call sns_governance get_nervous_system_parameters '()'

# Verify total token supply matches your configuration
icp canister call sns_ledger icrc1_total_supply '()'

# Confirm app canister controller is SNS root (not your principal)
icp canister status BACKEND_CANISTER_ID
```

After mainnet launch, monitor the swap progress:

```bash
# Check swap status, participation count, and ICP raised
icp canister call SNS_SWAP_CANISTER_ID get_state '()' -e ic
```

## Common mistakes

**Setting `min_participants` too high.** If the minimum is not reached, the swap fails and all ICP is refunded. Start conservative: 100–200 is typical for a first launch.

**Forgetting to add NNS root as co-controller.** The launch will fail at stage 6 if NNS root was not added before the proposal was submitted.

**Not doing a testflight first.** The SNS testflight deploys a mock SNS on mainnet without doing a real swap: it lets you test governance flows and canister upgrade proposals before committing to the real launch.

**Developer neurons with no vesting or short dissolve delays.** These are separate but related concerns: a *vesting period* prevents a neuron from being dissolved during the vesting window; a *dissolve delay* sets the cooldown before a stopped neuron becomes liquid. Developer neurons with no vesting period and zero dissolve delay allow the team to immediately sell tokens post-launch. Set both a vesting period and a dissolve delay (12–48 months is standard for each) to demonstrate long-term commitment to the NNS community.

**Unreasonable tokenomics.** The NNS community votes on your proposal. Excessive developer allocation, zero vesting, or swap parameters outside reasonable bounds will lead to rejection. Review past successful SNS launches (OpenChat, Hot or Not, Kinic) for parameter ranges the community accepts.

**Not defining fallback controllers.** Without `fallback_controller_principals`, a failed swap leaves your app without any controllers: permanently unupgradeable.

**Swap duration too short.** Less than 24 hours is risky given global time zones. Three to seven days is standard.

## Next steps

- [Testing an SNS](testing.md): test your SNS configuration locally and with a mainnet testflight before submitting the NNS proposal
- [Managing an SNS](managing.md): post-launch operations: submitting proposals, managing the treasury, upgrading canisters

<!-- Upstream: informed by dfinity/portal — building-apps/governing-apps/launching/launch-summary-1proposal.mdx, launching/launch-steps-1proposal.mdx, launching/integrating.mdx, tokenomics/index.mdx, tokenomics/predeployment-considerations.mdx, tokenomics/preparation.mdx, tokenomics/sns-checklist.mdx; dfinity/icskills — skills/sns-launch/SKILL.md -->
