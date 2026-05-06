---
learn_hub_id: 34084113508500
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34084113508500-Proposals"
learn_hub_title: "Proposals"
learn_hub_section: "NNS - Network Nervous System "
learn_hub_category: "How does ICP work?"
migrated: false
---

# Proposals

## What is a proposal?

A proposal is a suggestion to evolve and update the Internet Computer protocol. NNS DAO participants can submit proposals, make suggestions on how the ICP should evolve, and vote on proposals that others have submitted.

Based on the majority decision, a proposal is either adopted or rejected. If a proposal is adopted, it is automatically executed fully onchain, without the need for manual intervention.

While other blockchains take weeks or months to upgrade and typically require substantial manual work and coordination to do so, ICP upgrades itself every week (as can be seen on [the dashboard](https://dashboard.internetcomputer.org/releases)). Its ability to upgrade and iterate is a comparative "superpower".

## Proposal lifecycle

A proposal lifecycle starts when it is submitted by a [neuron](https://learn.internetcomputer.org/hc/en-us/articles/34084120668692), which is a governance participant. Then, other governance participants form a decision and vote on the proposal. Based on these votes, the governance derives a proposal decision, i.e., the proposal is either adopted or rejected.

If the proposal is rejected, usually nothing happens. If the proposal is adopted, the agreed upon decision is automatically executed by the governance canister.

### Proposal submission

Any eligible neuron can make and submit a proposal. To avoid being inundated by useless proposals, a user submitting a proposal has to pay a fee of 25 ICP when submitting a proposal that they will receive back if the proposal is adopted, but not if the proposal is rejected.

After a proposal is submitted, the proposal is created and stored in governance. The governance computes and stores additional information with each proposal.

Then, the governance looks at all neurons, i.e. governance participants, and creates an empty ballot for each eligible neuron that has a dissolve delay of at least 6 months, storing the neuron's voting power in this moment. This means that at the time of the proposal's submission, a neuron snapshot is taken and all neurons can vote on the proposal with the voting power that they have at that moment.

This results in the following, potentially unintuitive cases:  
\- If a neuron is created after a proposal was submitted, it is not eligible to vote on this proposal.  
\- If a neuron had a dissolve delay of less than 6 months when a proposal was submitted, it cannot vote on the proposal, even if the neuron's dissolve delay is increased again.  
\- If a neuron had a dissolve delay of 6 months when a proposal was submitted, it can vote on the proposal during the full voting period, even if by the time of voting the neuron's dissolve delay decreased slightly below 6 months.

The sum of all of the neurons' voting powers determines the total voting power associated with a given proposal. In addition to creating all ballots, when a new proposal is created, the proposer's ballot is set to a “Yes” vote. This reflects that the proposal already has the support of the user submitting it.

Moreover, each proposal has an associated _voting period_ , which determines the period of time over which votes for this proposal are accepted.

For more information on how to submit a proposal, refer to [How to submit a proposal](https://internetcomputer.org/docs/current/developer-docs/daos/nns/concepts/proposals/proposal-submit).

### Proposal voting

After a proposal is submitted and added to the governance canister, other users who control neurons can vote on the proposal. The NNS DAO is an open governance system where anyone can become a participant by [staking some ICP in a neuron](https://internetcomputer.org/docs/current/developer-docs/daos/nns/using-the-nns-dapp/nns-app-quickstart#stake-icp-utility-tokens-in-a-neuron). At least 1 ICP is required to create a neuron. Locking tokens for a period of time is known as the [neuron's dissolve delay](https://learn.internetcomputer.org/hc/en-us/articles/34084120668692). If a neuron has more than 6 months dissolve delay, it is eligible to participate in voting.

#### Finding proposals and discussions

You can see all the NNS proposals on the [Internet Computer dashboard](https://dashboard.internetcomputer.org/governance) or on the [NNS dapp](https://nns.ic0.app/). Voters can freely discuss proposals anywhere they like. Many NNS proposals are discussed on the [developer forum](https://forum.dfinity.org/c/roadmap/29).

#### Verifying proposals

As proposals are executed fully autonomously (see below), they often include code that will be executed on proposal adoption. Before voting on a proposal, it is therefore crucial that voters not only provide their opinion whether a suggestion is a good idea, but also verify that the proposal does, i.e., implements, what it claims. For more details on the different kinds of proposals, refer to [Proposal types and topics](https://learn.internetcomputer.org/hc/en-us/articles/34140518658068) and for some inputs on how to go about verify proposals, refer to [Verify proposals](https://internetcomputer.org/docs/current/developer-docs/daos/nns/concepts/proposals/verify-proposals). 

#### Voting

As a neuron represents a governance participant, voting happens via a [neuron](https://learn.internetcomputer.org/hc/en-us/articles/34084120668692). When a user has an eligible neuron and would like to vote on an open proposal, one option is to directly vote to adopt or reject the proposal. For more information how to vote, refer to [Voting on Proposals](https://internetcomputer.org/docs/current/developer-docs/daos/nns/using-the-nns-dapp/nns-dapp-voting-on-proposals).

For more information how a user can set up their neuron to delegate its voting power using liquid democracy, refer to[ following](https://internetcomputer.org/docs/current/developer-docs/daos/nns/using-the-nns-dapp/nns-dapp-following-other-neurons).

### Proposal decision

The governance canister stores a neuron's choice in the empty ballot where the neuron's voting power has been recorded. In this way, the proposal always contains the information of the total voting power of "Yes" and "No" votes.

A proposal can be decided in two ways:

  1. _Absolute majority before the voting period ends_ : At any point, even before the voting period ends, if an absolute majority (more than half of the total voting power stored in the proposal) has voted "Yes", then the proposal is adopted, and if an absolute majority has voted "No", then the proposal is rejected.
  2. _Simple majority at the voting period’s end_ : When the voting period ends, if a simple majority (more than half of the cast votes) has voted "Yes" and the number of these "Yes"-votes constitute at least 3% of the total voting power, then the proposal is adopted. Otherwise, the proposal is rejected.



#### Wait-for-quiet

What also plays into this is an algorithm called _wait-for-quiet_ that dynamically adjusts the deadline. The idea of wait-for-quiet is to decide proposals quickly when all voters agree, but increase the time that neurons can vote for proposals that are controversial. That means that the voting period can be dynamically increased, depending on the neurons’ votes. In particular, each time a proposal’s outcome is turned (either a "Yes"-majority is turned to a "No"-majority or vice versa), the proposal’s deadline is increased. Currently, a proposal's initial voting period is 4 days and can be increased by at most another 4 days. That is, the voting period that is taken into account for the above rules can be between 4 and 8 days, depending on the voting activity.

A proposal is adopted or rejected as soon as a decision can be made, which may be before the end of the voting period. However, even if an early decision was made, neurons can cast their vote up to the end of the voting period's end in order to get voting rewards.

### Proposal execution

Technically, a proposal defines a method on a canister that will be called if the proposal is adopted with some parameters.

When a proposal is adopted, the defined method on the specified canister is automatically called with the given parameters. This is done automatically by the governance canister and does not require any manual intervention. A proposal's execution may be successful, in which case the proposal is labeled as `executed`, or it may fail, in which case the proposal is labeled as `failed`.

When a proposal is rejected, most of the time nothing happens. In very few cases, some cleanup work is initiated. Therefore, `rejected` is also a possible final proposal state.

### Reward distribution

[Neurons](https://learn.internetcomputer.org/hc/en-us/articles/34084120668692) receive rewards for governance participation. After a proposal reached the voting period's deadline, the governance canister will take it into account for the next reward round. Even if a proposal was decided early, the proposal remains open for voting until the deadline so voters can get voting rewards even if a decision is made very quickly. For the details about NNS voting rewards, refer to [NNS voting rewards](https://learn.internetcomputer.org/hc/en-us/articles/34142993417108).

After the rewards are distributed, a proposal has been through the full lifecycle. The proposal's details may be emptied by the governance canister to save space.

## Proposal structure

Each proposal submitted to the NNS has the following fields:

  * _Summary_ : Text providing a short description of the proposal using a maximum of 280 bytes.
  * _URL_ : The web address of additional content required to evaluate the proposal, specified using HTTPS. For example, the URL's content might describe supporting the assignment of a DCID (data center ID) to a new data center.
  * _Proposer_ : The ID of the neuron that submitted the proposal. When a proposal is submitted, a “charge” is placed on its balance in case it is rejected. The balance needs to be enough to pay the charge on all rejection(s). The NNS requires a neuron to have a dissolve delay of ≥ 6 months to vote, which also applies to submitting proposals.
  * _Proposal type and topic_ : Each proposal has a _proposal type_ , which determines what happens if the proposal is adopted or rejected. This defines which canister method is invoked with which arguments. Each type of proposal belongs to a specific _proposal topic_. Topics are used for neuron following and also determine some other details about how the proposal is processed. For example, the voting period and the voting reward weight are defined per topic.
  * _Parameters_ : The parameters that will be passed to the system function and invoked if the proposal is adopted, as determined by its type. When a proposal is submitted, the NNS checks these parameters.



The NNS assigns a unique identity to each proposal that it receives.

For more details about what kind proposals exist, refer to [proposal topics and types](https://learn.internetcomputer.org/hc/en-us/articles/34140518658068).

