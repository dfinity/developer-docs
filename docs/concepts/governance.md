---
title: "Governance"
description: "How ICP is governed: the NNS, SNS for app governance, neurons, proposals, and economics fundamentals"
sidebar:
  order: 14
---

The Internet Computer Protocol uses two governance systems: the **Network Nervous System (NNS)** governs the protocol itself, and the **Service Nervous System (SNS)** provides a framework for app developers to hand control of their applications to a community-governed SNS.

Understanding both systems is important for developers. NNS proposals can affect canister behavior (for example, proposals that update system canisters or modify subnet configurations). SNS gives developers a standardized path to transfer control of their app to a community: once launched, no upgrade or configuration change can happen without a governance proposal voted on by asset holders, so no single party can make unilateral changes.

## The Network Nervous System

The NNS is a governance system enforced by the network that controls the Internet Computer at the protocol level. It is implemented as a set of system canisters running on a dedicated NNS subnet.

Decisions made through the NNS include:

- Upgrading the protocol and replica software across all nodes
- Creating and managing subnets (adding capacity, changing subnet membership)
- Setting economic parameters such as the ICP-to-cycles conversion rate
- Authorizing new node providers and their hardware
- Creating new SNS instances for apps

The NNS governance canister (`rrkah-fqaaa-aaaaa-aaaaq-cai`) is the entry point for all proposal submissions and voting. See [system canisters](../references/system-canisters.md) for the full list of NNS-controlled canisters and their IDs.

## ICP and the ledger

ICP is the native digital asset of the Internet Computer. It plays three roles:

- **Governance participation**: ICP can be locked into neurons to vote on proposals and earn voting rewards.
- **Compute fuel**: ICP can be converted into cycles, which power canister computation and storage. The NNS sets the ICP-to-cycles conversion rate to keep cycle costs stable in fiat terms (anchored to the IMF SDR).
- **Network rewards**: The protocol distributes ICP to voters (voting rewards) and node operators (node provider rewards).

The ICP ledger, hosted within the NNS, records all ICP balances. Each account has an account identifier (derived from a principal and optional subaccount) and a balance. Principals can send ICP between accounts and lock ICP into neurons.

## Neurons

A neuron is a governance participant created by locking ICP in the NNS governance canister. Neurons are the atomic units of voting power.

**Key neuron attributes:**

- **Stake**: The amount of ICP locked. The minimum to create a neuron is 1 ICP. To submit or vote on proposals, a neuron needs at least 6 months of dissolve delay.
- **Dissolve delay**: A waiting period (up to 8 years) that must expire before locked ICP can be retrieved. Longer dissolve delay grants more voting power.
- **Age**: How long the neuron has been non-dissolving. Older neurons earn an age bonus on voting power.
- **State**: A neuron is either locked (non-dissolving), dissolving, or dissolved (ready to disburse).

**Voting power formula:** A neuron's voting power scales with its stake, dissolve delay bonus (up to 2x at 8 years), and age bonus (up to 1.25x at 4 years). This design incentivizes long-term alignment with the network.

**Liquid democracy (following):** Neurons can delegate their votes to other neurons on specific proposal topics. A neuron that doesn't vote directly inherits the vote of its followed neurons. This allows passive participation while still counting toward quorum.

**Known neurons** are named neurons registered in the NNS governance canister through a proposal. They act as trusted delegates that other neurons follow. Any neuron with at least 6 months of dissolve delay and at least 25 ICP staked can submit a `RegisterKnownNeuron` proposal.

## Proposals

An NNS proposal is a governance action submitted by a neuron and voted on by the neuron population. Proposals pass if they reach a voting quorum and a majority votes in favor, subject to a wait-for-quiet mechanism that extends the voting period when votes are contested.

**Proposal lifecycle:**

1. A neuron with sufficient stake and dissolve delay submits a proposal. A rejection fee in ICP is burned if the proposal fails.
2. The proposal is open for voting, typically for 4 days, extending up to 8 days under wait-for-quiet.
3. If adopted, the proposal is executed automatically by the NNS governance canister.
4. If rejected, the proposer loses the rejection fee.

**Proposal topics** classify proposals by type (governance, node administration, network economics, etc.). Neurons can set different following configurations per topic, allowing specialization.

**NNS proposals that affect developers:**

- *UpgradeNnsCanister* and *UpgradeRootCanister*: Update protocol canisters. May change interfaces developers rely on.
- *CreateSubnet* / *AddNodeToSubnet*: Affect where canisters run.
- *UpdateCanisterSettings* for NNS canisters: Can change the behavior of system canisters.
- *CreateServiceNervousSystem*: Authorizes a new SNS, launching the decentralization process for an app.

See [NNS proposal types](../references/nns-proposal-types.md) for the full list of NNS proposal topics and their descriptions.

## Voting rewards

Neurons that vote (directly or through following) earn voting rewards. The protocol distributes a fixed annual reward pool as newly minted ICP. This pool is divided among neurons proportionally to their voting power weighted by how often they voted.

Rewards accumulate as **maturity** rather than ICP directly. Neurons can convert maturity to ICP (with a modulation of ±5% applied to the mint amount) or merge maturity back into their stake to compound future rewards.

The reward rate declines over time as the protocol matures, converging toward a lower floor rate over roughly a decade. See [Network economics](network-economics.md) for details on the reward rate schedule and supply dynamics.

## The Service Nervous System

The SNS is a governance framework that allows app developers to create a community-governed SNS for their application. When an app is governed by an SNS, asset holders vote on proposals to upgrade the app's canisters, manage treasury funds, and adjust governance parameters.

Unlike the NNS, which is a singleton governing the entire protocol, each SNS is a separate set of canisters specific to one app. SNSes live on a dedicated SNS subnet.

### SNS canisters

An SNS consists of five core canisters plus a variable number of archive canisters, all deployed by SNS-W (the SNS Wasm modules canister, `qaa6y-5yaaa-aaaaa-aaafa-cai`):

| Canister | Purpose |
|----------|---------|
| **Governance** | Proposal submission, voting, neuron management |
| **Ledger** | SNS asset transfers (ICRC-1 standard) |
| **Root** | Sole controller of all app canisters post-launch |
| **Swap** | Runs the decentralization swap (ICP for SNS assets) |
| **Index** | Transaction indexing for the SNS ledger |
| **Archive** (one or more, spawned as needed) | Historical ledger block storage; new archive canisters are created automatically as the ledger grows |

Once an SNS is live, the SNS Root canister is the sole controller of the app's canisters. Upgrades happen through governance proposals voted on by SNS asset holders.

### Initial asset allocation

Each SNS has its own governance digital asset. The initial distribution is defined in the SNS configuration file and includes:

- **Developer neurons**: Assets allocated to the original developers and seed funders, typically with vesting periods and dissolve delays to signal long-term commitment.
- **Treasury**: Assets owned by the SNS governance canister, spendable by governance proposal.
- **Swap allocation**: Assets sold during the decentralization swap in exchange for ICP.

The SNS ledger implements the ICRC-1 standard. SNS neurons work similarly to NNS neurons: stake governs voting power, dissolve delay grants a bonus (up to 2x at the configured maximum), and age grants an additional bonus.

### The decentralization swap

The decentralization swap is the mechanism by which SNS assets are distributed to the public. Participants send ICP to the SNS Swap canister during the swap window; when the swap closes, the exchange rate is determined and participants receive SNS assets in a basket of neurons with vesting schedules.

The swap has minimum and maximum ICP participation thresholds. If the minimum is not reached, the swap fails: all ICP is refunded and control of the app returns to the original developers (via the fallback controllers defined in the configuration). If the maximum is reached before the end time, the swap closes early.

The Neurons' Fund (a subset of NNS neurons that commit maturity for ecosystem investment) can optionally participate in the swap, providing a baseline level of participation.

### SNS governance vs NNS governance

SNS governance mirrors the NNS design but is customized per app:

| Aspect | NNS | SNS |
|--------|-----|-----|
| What it governs | Protocol and network | A specific app |
| Digital asset | ICP | Project-specific ICRC-1 asset |
| Governance canisters | Singleton on NNS subnet | Per-app on SNS subnet |
| Launch authority | N/A (pre-existing) | NNS must approve creation |
| Proposal types | Protocol updates, subnet management, economics | App upgrades, treasury transfers, parameter changes |

## What decentralization means for developers

When an app is governed by an SNS, the original developers no longer have direct control. Key implications:

- **Upgrades require proposals**: All changes to app canisters must go through SNS governance votes. Development slows down compared to centralized control.
- **Treasury spending requires votes**: Any use of SNS treasury funds requires a governance proposal.
- **Upgrade path is transparent**: Community members can verify new canister wasm modules before voting. Reproducible builds allow independent verification.
- **Responsibility is distributed**: Post-launch, the development team typically continues leading the project but must engage the community of asset holders for major decisions.
- **Custom proposals**: Apps can register custom proposal types (generic functions) that allow the SNS to call specific canister methods, enabling fine-grained governance without unrestricted code upgrades.

Developers preparing for an SNS launch should ensure their codebase is stable, open-sourced, and reproducibly buildable before the decentralization swap. The NNS community votes on the creation proposal and expects evidence of product-market fit, sound asset economics, and a realistic roadmap.

## Neuron hotkeys

A neuron's **controller** is the principal with full authority over the neuron. A controller can perform any operation: increase dissolve delay, start or stop dissolving, disburse the stake, and more. Because the private key of the controller principal must be kept highly secure (typically in cold storage), neurons can also have **hotkeys**: additional principals with a limited permission set.

Hotkeys can:
- Vote on proposals (directly or by confirming following).
- Set or change following rules.
- Submit proposals.
- Read all neuron fields, including non-public information.

Hotkeys cannot modify the stake, change the dissolve delay, or disburse the neuron. Up to 15 hotkeys are allowed per neuron. A common pattern is to set a hardware wallet as the controller and use a software wallet as a hotkey for day-to-day voting.

## Following rules in detail

When a neuron follows a group of other neurons on a topic, it casts its vote once a threshold in the followee group is reached:

- It votes **adopt** if more than half of the followees vote yes.
- It votes **reject** if at least half of the followees vote no.
- It casts no vote if neither threshold is met.

A neuron can follow at most 15 neurons per topic. A **catch-all** following rule covers topics with no explicit setting, but does not apply to the *SNS & Community Fund* and *Governance* topics, which must be explicitly configured.

**Periodic confirmation:** A neuron that never votes directly, sets following, or confirms following must do one of those actions at least once every 6 months. If it fails to do so, voting power is linearly reduced over the following month until it reaches zero, and all following settings are reset. This prevents inactive neurons from accumulating rewards without genuine participation.

## Voting thresholds and proposal decision

NNS proposals can be decided two ways:

- **Absolute majority (at any time):** If more than half of the total voting power recorded at proposal creation votes yes, the proposal is immediately adopted. Likewise, a no absolute majority immediately rejects it.
- **Simple majority at deadline:** When the voting period ends (4 to 8 days, depending on wait-for-quiet), the proposal passes if the yes vote constitutes both a simple majority of cast votes and at least 3% of the total voting power. If the 3% quorum is not met, the proposal is rejected even if a majority of participants voted yes.

The 3% quorum prevents low-turnout proposals from passing on a handful of votes.

## Maturity operations

Maturity accumulated from voting rewards is not transferable and is not immediately liquid. Neuron holders have three options:

- **Disburse (previously: spawn):** Start a 7-day process that burns the maturity and mints new ICP. The exact amount is subject to maturity modulation: the mint multiplier is computed from 30-day moving averages of the ICP/XDR conversion rate over the preceding 4 weeks, bounded to ±5%. This introduces a small amount of uncertainty (the maturity modulation can move ±1.25% from one week to the next) that discourages timing the market.
- **Stake maturity:** Add maturity to the neuron's staked balance, increasing its voting power immediately. Staked maturity is locked alongside the ICP stake and converts back to unstaked maturity when the neuron dissolves.
- **Auto-stake maturity:** Automatically stake all new maturity as it accrues, compounding voting power without manual intervention.

## Voting rewards formula

The NNS distributes rewards daily from a reward pool. The annualized pool size as a percentage of total ICP supply follows this schedule:

- For years 0–8 after genesis: `R(t) = 5% + 5% × [(G + 8y − t) / 8y]²`
- After year 8: `R(t) = 5%`

where G is the genesis timestamp and t is the current time. This quadratic decline starts at approximately 10% in year 1 and converges to 5%. The daily pool is `total_supply × R(t) / 365.25`.

Each neuron receives a share of the pool proportional to its voting power multiplied by the fraction of eligible proposals it voted on (weighted by the reward weight of each proposal topic). If no proposals settle on a given day, rewards roll over to the next distribution.

## The Neurons' Fund

The Neurons' Fund (NF) is a mechanism that allows NNS neurons to allocate maturity toward the decentralization swaps of new SNS instances. Participation is opt-in: a neuron holder can join or leave the NF at any time.

When an SNS swap runs, NF contributions scale with direct participation through a matching function. NF neurons receive SNS neurons in return, with the same hotkeys copied so that holders can vote in the new SNS governance without exposing their cold-storage keys.

**Note:** The Neurons' Fund was temporarily disabled by [NNS proposal 135970](https://dashboard.internetcomputer.org/proposal/135970). The design described above reflects the intended behavior when it is re-enabled; details may change.

## Next steps

- [Launch an SNS](../guides/governance/launching.md): step-by-step guide to decentralizing your app
- [Manage a live SNS](../guides/governance/managing.md): proposals, upgrades, and treasury management after launch
- [SNS framework](sns-framework.md): detailed architecture, neurons, proposals, and reward scheme
- [NNS proposal types reference](../references/nns-proposal-types.md): all proposal topics and types
- [System canisters reference](../references/system-canisters.md): NNS-controlled canisters, their IDs, and interfaces
- [IC Dashboard SNS API](../references/ic-dashboard-api.md#sns-api): query SNS governance data, neuron details, and proposal history programmatically
- [IC Dashboard IC API](../references/ic-dashboard-api.md#ic-api): query NNS proposal data, neuron metrics, and governance statistics

<!-- Upstream: informed by dfinity/portal (docs/building-apps/governing-apps/tokenomics/index.mdx, docs/building-apps/governing-apps/tokenomics/predeployment-considerations.mdx, docs/building-apps/governing-apps/tokenomics/preparation.mdx, docs/building-apps/governing-apps/tokenomics/sns-checklist.mdx, docs/building-apps/governing-apps/launching/launch-summary-1proposal.mdx, docs/building-apps/governing-apps/nns/concepts/proposal-requirements.mdx, docs/building-apps/governing-apps/nns/concepts/neurons/becoming-a-known-neuron.mdx; dfinity/icskills: sns-launch/SKILL.md); informed by Learn Hub articles "Overview", "Neurons", "Proposals", "Neuron Attributes", "Neurons' Fund (NF)", "Voting Rewards" (migrated, source retired) -->
