---
title: "Governance & SNS"
description: "Service Nervous System overview for developers building decentralized applications"
sidebar:
  order: 1
doc_type: explanation
level: intermediate
icskills: [sns-launch]
last_verified: 2026-03-10
---

The **Service Nervous System (SNS)** is ICP's framework for turning a dapp into a decentralized autonomous organization (DAO). When you launch an SNS, control of your canisters transfers from your team to a community of token holders who govern the dapp through proposals and voting.

## What is an SNS?

An SNS is a set of canisters deployed on ICP that together provide:

- **Decentralized governance** -- Token holders submit and vote on proposals that control the dapp.
- **A tokenized economy** -- An SNS token incentivizes participation and aligns community interests.
- **Automated execution** -- Adopted proposals execute onchain automatically, with no human intermediary.

Each SNS is modeled after the Network Nervous System (NNS), which governs the ICP network itself. However, each SNS is independent and governs a single dapp or project.

## SNS architecture

An SNS consists of several canisters that work together:

| Canister | Purpose |
|----------|---------|
| **Governance** | Manages proposals, voting, and neurons. |
| **Ledger** | ICRC-1/ICRC-2 ledger for the SNS token. |
| **Root** | Controls the dapp canisters and other SNS canisters. |
| **Swap** | Runs the initial decentralization swap (token sale). |
| **Index** | Indexes ledger transactions by account. |

The governance canister controls the root canister, which in turn controls the dapp canisters. This creates a chain of control: token holders vote on proposals in governance, and governance executes changes through root.

## Why decentralize with an SNS?

- **Trust** -- Users can verify that the dapp is governed by its community, not a single team.
- **Censorship resistance** -- No single party can shut down or unilaterally change the dapp.
- **Community alignment** -- Token holders have a direct stake in the dapp's success.
- **Automated operations** -- Upgrades, treasury management, and parameter changes happen through transparent onchain governance.

## How an SNS launch works

At a high level:

1. **Configure** -- Define token parameters, governance rules, initial neurons, and swap conditions. See [Launching an SNS](/guides/governance/launching/).
2. **Test** -- Validate your configuration locally and on mainnet testflight. See [Testing SNS launch](/guides/governance/testing/).
3. **Propose** -- Submit an NNS proposal to create the SNS. The NNS community votes on whether to approve it.
4. **Swap** -- If approved, a decentralization swap opens. Participants contribute ICP in exchange for SNS tokens distributed as neurons.
5. **Operate** -- After a successful swap, the SNS is fully decentralized. See [Managing an SNS](/guides/governance/managing/).

If the swap fails to meet its minimum participation target, everything reverts: the dapp's control returns to the original developers, and contributed ICP is refunded.

## Existing SNS DAOs

Several projects have launched SNS DAOs on ICP, including OpenChat, Kinic, Hot or Not, and BOOM DAO. You can view active SNS DAOs on the [NNS dapp](https://nns.ic0.app/) under the SNS section.

## Further reading

- [Launching an SNS](/guides/governance/launching/) -- Step-by-step launch guide.
- [Testing SNS launch](/guides/governance/testing/) -- Pre-launch testing.
- [Managing an SNS](/guides/governance/managing/) -- Post-launch operations.
- [SNS on the ICP Wiki](https://wiki.internetcomputer.org/wiki/Service_Nervous_System_(SNS))
