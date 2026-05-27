---
title: "SNS framework"
description: "How the Service Nervous System works: framework architecture, launch process, neurons, proposals, and configurable rewards"
---

The Service Nervous System (SNS) is a governance framework built into ICP that lets any developer hand control of their application to a community-governed SNS. When an app is governed by an SNS, all upgrades, treasury decisions, and parameter changes require network-enforced proposals voted on by SNS asset holders.

For a high-level introduction comparing the NNS and SNS, see [Governance](governance.md#the-service-nervous-system).

## Framework architecture

All SNS instances run code that the Network Nervous System (NNS) community has reviewed and approved. The NNS maintains a canister called the **SNS Wasm modules canister (SNS-W)**, `qaa6y-5yaaa-aaaaa-aaafa-cai`, which stores the approved Wasm binaries for each SNS canister. When a new SNS is created, SNS-W deploys the approved code. When NNS voters approve an improved SNS version, it is published to SNS-W and all existing SNS instances can upgrade to it.

This shared codebase has two benefits. First, NNS voters review the code once and all SNS instances benefit. Second, users who have interacted with one SNS have a reliable intuition for how any other SNS works.

**Upgrade paths:** An SNS community can upgrade its framework canisters in three ways:
- Submit a proposal to upgrade one step at a time along the NNS-approved upgrade path.
- Submit a proposal targeting a specific version, which automatically applies all intermediate steps in sequence.
- Enable `automatically_advance_target_version` in the SNS settings, causing the SNS to always follow the latest NNS-approved version without a proposal. This is enabled by default for newly launched SNS instances.

**SNS subnet:** All SNS instances live on a dedicated SNS subnet (`x33ed-h457x-bsgyx-oqxqf-6pzwv-wkhzr-rm2j3-npodi-purzm-n66cg-gae`). Because every canister on that subnet runs NNS-approved SNS code, users can verify an SNS is legitimate simply by confirming it runs on the SNS subnet.

## The launch process

Launching an SNS is a one-time process that transfers control of an application from its original developers to a community.

**Step 1: NNS proposal:** The developer submits a `CreateServiceNervousSystem` proposal to the NNS, specifying the initial digital asset distribution, decentralization swap parameters, initial governance settings, and the canisters to be governed. If the NNS community approves the proposal, the launch proceeds automatically.

**Step 2: SNS canisters deployed:** The NNS uses SNS-W to deploy a fresh set of SNS canisters. The app's canisters are transferred to SNS Root as their controller.

**Step 3: Decentralization swap:** A swap window opens where users can send ICP to the SNS Swap canister. At the end of the window (or earlier if the maximum is reached), each contributor receives a proportional share of a fixed SNS asset allocation as staked neurons. The ICP collected becomes the SNS treasury. All swap participants receive a basket of neurons with configurable dissolve delays.

The swap has a minimum and maximum ICP threshold:
- If the minimum is not met when the window closes, the swap fails: all ICP is refunded and control of the app reverts to the original fallback controllers.
- If the maximum is reached before the window closes, the swap ends early.

**Optional Neurons' Fund participation:** The launch proposal can request matched funding from the Neurons' Fund, which contributes ICP proportional to direct participation up to a cap.

After a successful swap, the SNS is fully functional: the community governs the app through the governance canister and no single entity retains privileged control.

## SNS canisters

Each SNS consists of five core canisters and a variable number of archive canisters:

| Canister | Purpose |
|---|---|
| **Governance** | Stores proposals and neurons; executes adopted proposals; calculates voting power and rewards. |
| **Ledger** | ICRC-1 ledger for the SNS's governance asset. |
| **Root** | Sole controller of the governed app canisters; orchestrates canister upgrades. |
| **Swap** | Runs the decentralization swap during launch. |
| **Index** | Organizes ledger transactions by account for wallet and explorer queries. |
| **Archive** (one or more) | Stores historical ledger blocks as the ledger grows. |

## SNS neurons

SNS neurons work similarly to NNS neurons, with a few differences:

**All neurons are public.** Unlike NNS neurons, which can be private, all SNS neurons are fully readable by anyone. This makes vote delegation simpler: any neuron can follow any other.

**Flexible permissions.** Instead of the NNS's controller/hotkey dichotomy, SNS neurons have a fine-grained permission system. Individual permissions (voting, changing following, managing principals, and others) can be granted to any principal independently. Frontends typically surface this as a simpler "add hotkey" interface, which maps to a specific set of permissions.

**Configurable voting power.** Each SNS community configures the voting power calculation through its governance settings:
- Minimum dissolve delay to vote (default: 6 months).
- Maximum dissolve delay and the bonus it grants at that maximum (default: 8 years, 2x).
- Maximum age and the bonus it grants at that maximum (default: 4 years, 1.25x).

**Maturity.** If an SNS activates voting rewards, neurons accumulate maturity that can be disbursed (minted as new assets), staked into the neuron for compounding, or auto-staked. The same maturity modulation mechanism as the NNS applies (±5% based on recent ICP/XDR rate movements).

## SNS proposals

SNS proposals follow the same lifecycle as NNS proposals (submission, voting, decision, automatic execution), with two notable differences: **proposal criticality** and **custom proposals**.

### Critical and non-critical proposals

SNS proposals are assigned to one of seven built-in topics. Each topic is classified as either critical or non-critical, and the classification determines the voting thresholds and period.

**Critical topics** (require broader consensus):
| Topic | Description |
|---|---|
| Critical Dapp Operations | Adding or removing governed app canisters, executing critical app logic. |
| DAO Community Settings | Tokenomics and branding changes: token name, symbol, description. |
| Treasury & Asset Management | Moving treasury funds, managing liquidity pools, disbursing SNS-owned neurons. |

Critical proposals pass only if at least 20% of total voting power votes yes and at least 67% of cast votes are yes. The voting period is 5–10 days (extended by wait-for-quiet for contested votes) and cannot be changed by SNS governance.

**Non-critical topics** (standard thresholds):
| Topic | Description |
|---|---|
| Application Business Logic | Custom proposals specific to the governed app. |
| Dapp Canister Management | Upgrading registered app canisters and frontend assets. |
| Governance | Community polls with no immediate code effect. |
| SNS Framework Management | Upgrading and managing the SNS framework canisters. |

Non-critical proposals pass if at least 3% of total voting power votes yes and a simple majority of cast votes is yes. The default voting period is 4–8 days and is configurable per SNS.

### Built-in proposals

All SNS instances include a standard set of built-in proposal types:
- Motion proposals for community polls.
- Proposals to change governance settings and SNS metadata.
- Proposals to upgrade the SNS framework canisters.
- Proposals to register or deregister governed app canisters.
- Proposals to transfer treasury funds or mint new assets.

### Custom proposals

Each SNS can register **custom proposals** (also called generic proposals) that call a specific method on a canister with specified arguments. This enables app-specific governance: an orchestrator canister upgrade, moderator election, or any other operation the SNS community should control.

Custom proposals require a validation method: when a custom proposal is submitted, the governance canister calls the validator first, and only proceeds if it succeeds. Custom proposals must be registered through a governance proposal before they can be used, giving the community a chance to audit the function being added. Each custom proposal must be assigned a topic when registered.

## SNS voting rewards

Each SNS independently decides whether to enable voting rewards, and if so, what rate to use. The configurable parameters are:

- **`initial_reward_rate_basis_points` (r\_max):** The starting annualized reward rate as a fraction of total supply.
- **`final_reward_rate_basis_points` (r\_min):** The floor rate after the transition period ends. Set to 0 to stop new issuance after `t_delta`.
- **`reward_rate_transition_duration_seconds` (t\_delta):** How long the transition from r\_max to r\_min takes.

The formula between `t_start` and `t_start + t_delta` is: `R(t) = r_min + (r_max − r_min) × [(t_start + t_delta − t) / t_delta]²`. After `t_start + t_delta`, the rate is constant at `r_min`.

![SNS voting rewards: new assets are distributed from the reward pool to voting neurons, while the total supply grows as rewards are distributed](/concepts/sns-framework/rewards-total-supply.png)

If `VotingRewardsParameters` is not set at all, voting rewards are disabled.

User rewards (distributing existing treasury assets to active app users) are a separate mechanism: an SNS-controlled canister holds an asset reserve and pays out rewards according to its own logic.

## Next steps

- [Governance](governance.md): NNS and SNS overview, including neurons, proposals, and voting rewards
- [SNS settings reference](../references/sns-settings.md): all configurable nervous system parameters
- [Launch an SNS](../guides/governance/launching.md): step-by-step guide to the decentralization process
- [Manage a live SNS](../guides/governance/managing.md): proposals, upgrades, and treasury management after launch

<!-- Upstream: informed by Learn Hub articles "SNS: Service Nervous System", "Framework and Architecture", "Launch", "Neurons" (SNS), "Proposals" (SNS), "Rewards" (SNS) (migrated, source retired) -->
