---
title: "Governance"
description: "How ICP is governed: the NNS, SNS for app governance, neurons, proposals, and tokenomics fundamentals"
sidebar:
  order: 13
---

The Internet Computer Protocol uses two governance systems: the **Network Nervous System (NNS)** governs the protocol itself, and the **Service Nervous System (SNS)** provides a framework for app developers to hand control of their applications to a community-owned DAO.

Understanding both systems is important for developers. NNS proposals can affect canister behavior (for example, proposals that update system canisters or modify subnet configurations). SNS gives developers a standardized path to decentralize their app.

## The Network Nervous System

The NNS is an onchain governance system that controls the Internet Computer at the protocol level. It is implemented as a set of system canisters running on a dedicated NNS subnet.

Decisions made through the NNS include:

- Upgrading the protocol and replica software across all nodes
- Creating and managing subnets (adding capacity, changing subnet membership)
- Setting economic parameters such as the ICP-to-cycles conversion rate
- Authorizing new node providers and their hardware
- Creating new SNS DAOs for apps

The NNS governance canister (`rrkah-fqaaa-aaaaa-aaaaq-cai`) is the entry point for all proposal submissions and voting. See [system canisters](../references/system-canisters.md) for the full list of NNS canister IDs.

## ICP tokens and the ledger

ICP is the native utility token of the Internet Computer. It plays three roles:

- **Governance participation**: ICP can be locked into neurons to vote on proposals and earn voting rewards.
- **Compute fuel**: ICP can be converted into cycles, which power canister computation and storage. The NNS sets the ICP-to-cycles conversion rate to keep cycle costs stable in fiat terms (anchored to the IMF SDR).
- **Network rewards**: The protocol distributes ICP to voters (voting rewards) and node operators (node provider rewards).

The ICP ledger, hosted within the NNS, records all ICP balances. Each account has an account identifier (derived from a principal and optional subaccount) and a balance. Principals can send ICP between accounts and lock ICP into neurons.

## Neurons

A neuron is a governance participant created by locking ICP tokens in the NNS governance canister. Neurons are the atomic units of voting power.

**Key neuron attributes:**

- **Stake**: The amount of ICP locked. Minimum stake to submit proposals is 10 ICP with at least 6 months of dissolve delay.
- **Dissolve delay**: A waiting period (up to 8 years) that must expire before locked ICP can be retrieved. Longer dissolve delay grants more voting power.
- **Age**: How long the neuron has been non-dissolving. Older neurons earn an age bonus on voting power.
- **State**: A neuron is either locked (non-dissolving), dissolving, or dissolved (ready to disburse).

**Voting power formula:** A neuron's voting power scales with its stake, dissolve delay bonus (up to 2x at 8 years), and age bonus (up to 1.25x at 4 years). This design incentivizes long-term alignment with the network. <!-- Needs human verification: NNS neuron voting power bonus percentages (2x at 8 years, 1.25x at 4 years): these match SNS default parameters in the sns-launch skill but are not explicitly stated in the portal NNS source material -->

**Liquid democracy (following):** Neurons can delegate their votes to other neurons on specific proposal topics. A neuron that doesn't vote directly inherits the vote of its followed neurons. This allows passive participation while still counting toward quorum.

**Known neurons** are named neurons registered in the NNS governance canister through a proposal. They act as trusted delegates that other neurons follow. Any neuron that meets the general proposal prerequisite (at least 10 ICP staked with 6 months dissolve delay) and has at least 25 ICP staked can submit a `RegisterKnownNeuron` proposal.

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
- *CreateServiceNervousSystem*: Authorizes a new SNS DAO, launching the decentralization process for an app.

See [system canisters](../references/system-canisters.md) for the full list of NNS proposal topics and types.

## Voting rewards

Neurons that vote (directly or through following) earn voting rewards. The protocol distributes a fixed annual reward pool as newly minted ICP. This pool is divided among neurons proportionally to their voting power weighted by how often they voted.

Rewards accumulate as **maturity** rather than ICP directly. Neurons can convert maturity to ICP (with a modulation of ±5% applied to the mint amount) or merge maturity back into their stake to compound future rewards.

The reward rate declines over time as the protocol matures, converging toward a lower floor rate over roughly a decade. See the [ICP tokenomics overview](https://learn.internetcomputer.org/hc/en-us/articles/34090810571284) for details on the reward rate schedule.

## The Service Nervous System

The SNS is a governance framework that allows app developers to create a community-owned DAO for their application. When an app is governed by an SNS, token holders vote on proposals to upgrade the app's canisters, manage treasury funds, and adjust governance parameters.

Unlike the NNS, which is a singleton governing the entire protocol, each SNS is a separate set of canisters specific to one app. SNSes live on a dedicated SNS subnet.

### SNS canisters

An SNS consists of six canisters deployed by SNS-W (the SNS Wasm modules canister, `qaa6y-5yaaa-aaaaa-aaafa-cai`):

| Canister | Purpose |
|----------|---------|
| **Governance** | Proposal submission, voting, neuron management |
| **Ledger** | SNS token transfers (ICRC-1 standard) |
| **Root** | Sole controller of all app canisters post-launch |
| **Swap** | Runs the decentralization swap (ICP for SNS tokens) |
| **Index** | Transaction indexing for the SNS ledger |
| **Archive** | Historical transaction storage |

Once an SNS is live, the SNS Root canister is the sole controller of the app's canisters. Upgrades happen through governance proposals voted on by SNS token holders.

### Token economics

Each SNS has its own governance token. The initial token distribution is defined in the SNS configuration file and includes:

- **Developer neurons**: Tokens allocated to the original developers and seed funders, typically with vesting periods and dissolve delays to signal long-term commitment.
- **Treasury**: Tokens owned by the SNS governance canister, spendable by DAO proposal.
- **Swap allocation**: Tokens sold during the decentralization swap in exchange for ICP.

The SNS ledger implements the ICRC-1 token standard. SNS neurons work similarly to NNS neurons: stake governs voting power, dissolve delay grants a bonus (up to 2x at the configured maximum), and age grants an additional bonus.

### The decentralization swap

The decentralization swap is the mechanism by which SNS tokens are distributed to the public. Participants send ICP to the SNS Swap canister during the swap window; when the swap closes, the exchange rate is determined and participants receive SNS tokens in a basket of neurons with vesting schedules.

The swap has minimum and maximum ICP participation thresholds. If the minimum is not reached, the swap fails: all ICP is refunded and control of the app returns to the original developers (via the fallback controllers defined in the configuration). If the maximum is reached before the end time, the swap closes early.

The Neurons' Fund (a subset of NNS neurons that commit maturity for ecosystem investment) can optionally participate in the swap, providing a baseline level of participation.

### SNS governance vs NNS governance

SNS governance mirrors the NNS design but is customized per app:

| Aspect | NNS | SNS |
|--------|-----|-----|
| What it governs | Protocol and network | A specific app |
| Token | ICP | Project-specific ICRC-1 token |
| Governance canisters | Singleton on NNS subnet | Per-app on SNS subnet |
| Launch authority | N/A (pre-existing) | NNS must approve creation |
| Proposal types | Protocol updates, subnet management, economics | App upgrades, treasury transfers, parameter changes |

## What decentralization means for developers

When an app is governed by an SNS, the original developers no longer have direct control. Key implications:

- **Upgrades require proposals**: All changes to app canisters must go through SNS governance votes. Development slows down compared to centralized control.
- **Treasury spending requires votes**: Any use of DAO funds requires a governance proposal.
- **Upgrade path is transparent**: Community members can verify new canister wasm modules before voting. Reproducible builds allow independent verification.
- **Responsibility is distributed**: Post-launch, the development team typically continues leading the project but must engage the token-holding community for major decisions.
- **Custom proposals**: Apps can register custom proposal types (generic functions) that allow the DAO to call specific canister methods, enabling fine-grained governance without unrestricted code upgrades.

Developers preparing for an SNS launch should ensure their codebase is stable, open-sourced, and reproducibly buildable before the decentralization swap. The NNS community votes on the creation proposal and expects evidence of product-market fit, sound tokenomics, and a realistic roadmap.

## Next steps

- [Launch an SNS](../guides/governance/launching.md): step-by-step guide to decentralizing your app
- [Manage a live SNS](../guides/governance/managing.md): proposals, upgrades, and treasury management after launch
- [System canisters reference](../references/system-canisters.md): NNS canister IDs and interfaces

<!-- Upstream: informed by dfinity/portal — docs/building-apps/governing-apps/tokenomics/index.mdx, docs/building-apps/governing-apps/tokenomics/predeployment-considerations.mdx, docs/building-apps/governing-apps/tokenomics/preparation.mdx, docs/building-apps/governing-apps/tokenomics/sns-checklist.mdx, docs/building-apps/governing-apps/launching/launch-summary-1proposal.mdx, docs/building-apps/governing-apps/nns/concepts/proposal-requirements.mdx, docs/building-apps/governing-apps/nns/concepts/neurons/becoming-a-known-neuron.mdx; dfinity/icskills — sns-launch/SKILL.md -->
