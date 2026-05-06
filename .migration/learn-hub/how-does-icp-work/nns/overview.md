---
learn_hub_id: 33692645961236
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/33692645961236-Overview"
learn_hub_title: "Overview"
learn_hub_section: "NNS - Network Nervous System "
learn_hub_category: "How does ICP work?"
migrated: false
---

# Overview

The Network Nervous System (NNS) is the fully onchain decentralized autonomous organization (DAO) that governs the Internet Computer Protocol. It is a stake-based, open governance system where everyone can participate by staking ICP utility tokens. The NNS is implemented by a set of [canister](https://learn.internetcomputer.org/hc/en-us/articles/34210839162004) smart contracts.

## The need for the NNS

The Internet Computer is powered by independent nodes that run the Internet Computer protocol. For efficiency, these nodes are organized into different sub-groups, called subnets. To ensure that the Internet Computer can evolve in terms of security, performance, and scale, decisions such as the following need to be made:

  * Upgrading the protocol and guest operating system software used by the nodes, to extend functionality, improve security or performance.
  * Adding new nodes by new node providers to the network for more robustness.
  * Creating new subnets to scale the Internet Computer's capacity.
  * Splitting subnets to balance network load.



The NNS ensures that all these decisions can be made in a decentralized and autonomous way.

## Neurons

On the Internet Computer, governance participants are called _neurons_. Neurons correspond to staked ICP tokens. In other words, anyone can become a part of the NNS governance by locking ICP tokens in a neuron. This is incentivized by voting rewards for neurons who participate in decision making.

Learn how to stake tokens in a neuron by following this [staking tutorial](https://internetcomputer.org/docs/current/developer-docs/daos/nns/using-the-nns-dapp/nns-dapp-staking-a-neuron). For more background information on neurons and voting rewards, read the article on [neurons](https://learn.internetcomputer.org/hc/en-us/articles/34084120668692).

## Proposals

Proposals are suggestion on how to evolve the Internet Computer. This includes decisions updating the protocol, organizing node machines into subnets, and updating the rules of the NNS DAO itself. Any neuron that has tokens staked for at least 6 months can submit and vote on proposals.

On a high level, a proposal goes through the following lifecycle (ignoring some special cases):

  1. **Proposal submission** : A neuron submits a proposal with a new suggestion to make a change to the network.
  2. **Establish ballot roll** : The governance canister takes a snapshot and creates (empty) ballots for all eligible neurons.
  3. **Voting** : All eligible neurons can cast their vote. This can either be done by a manual vote or by _following_ , which is a mechanism for delegating the voting power to another neuron.
  4. **Proposal decision** : The proposal is decided based on either: 
     * **Absolute Majority** \- At any point, even before the voting period ends, if an absolute majority (more than half of the total voting power) has voted "yes," then the proposal is adopted. If an absolute majority has voted "no," then the proposal is rejected.
     * **Simple Majority** \- When the voting period ends, if a simple majority (more than half of the cast votes) has voted "yes" and the number of these yes votes constitutes at least 3% of the total voting power, then the proposal is adopted. Otherwise, the proposal is rejected.
  5. **Proposal execution** : If a proposal is adopted, the NNS DAO automatically and autonomously executes the proposals. For example, if the proposal decided to update the voting rules, an upgrade of the canister which implements these rules would be initiated automatically. Compared to other DAOs, this has the advantage that no human action is needed for proposal execution, removing a source of failure and inefficiency.



For a tutorial on how to vote on a proposal, read [Voting on proposals.](https://internetcomputer.org/docs/current/developer-docs/daos/nns/using-the-nns-dapp/nns-dapp-voting-on-proposals) For a tutorial on how to set or change following, refer to [Following](https://internetcomputer.org/docs/current/developer-docs/daos/nns/using-the-nns-dapp/nns-dapp-following-other-neurons). For more detailed information about proposals, including details of the lifecycle, how to submit proposals, and the precise type of proposals, refer to [Proposals](https://learn.internetcomputer.org/hc/en-us/articles/34084113508500). For more information about voting, the rules of following, and how to verify proposals, refer to [Voting](https://internetcomputer.org/docs/current/developer-docs/daos/nns/using-the-nns-dapp/nns-dapp-voting-on-proposals).

