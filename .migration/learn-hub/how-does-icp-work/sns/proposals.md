---
learn_hub_id: 34146571133204
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34146571133204-Proposals"
learn_hub_title: "Proposals"
learn_hub_section: "SNS - Service Nervous System"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Proposals

Proposals are suggestions of how to evolve the dapp that an SNS governs and the SNS DAO itself. They are thus the integral part of managing a dapp as a decentralized community.

The proposal lifecycle in SNSs closely resembles the one for [NNS proposals](https://learn.internetcomputer.org/hc/en-us/articles/34084113508500). In contrast to the NNS, there are two main distinguishing factors for SNS proposals. First, SNSs have a notion of _proposal criticality -_ some proposal topics are defined to be critical and follow stricter voting rules. Second, to ensure that SNSs are flexible for the needs of different dapps that they govern, SNSs distinguish between has _Built-in proposals_ that are the same in each SNS and _custom proposals_ that can be defined by each SNS community for their specific needs.

## Proposal lifecycle

The lifecycle of SNS proposals closely resembles the one from NNS and goes through the following high level flow:

  1. An eligible neurons submits a proposal.
  2. All other eligible neurons can vote on the proposal. 
     * Voting can be done by direct voting or by delegating voting power to other neurons
  3. A proposal is decided early when it has sufficient support for adopting or rejection. Otherwise the proposal is decided when the defined voting period is reached, which follows the [wait-for-quiet](https://learn.internetcomputer.org/hc/en-us/articles/34084113508500/h_01JJ2GW8QMPCY5PCV3X96Q1Y79) approach. 
  4. Even if a proposal is decided early, voters can cast their vote until the end of the voting period to for getting voting rewards.
  5. An adopted proposal is automatically executed on-chain.



The criteria for proposal decision as well as the voting period in Step 3 depend on the proposal's topic as explained next. 

### Proposal criticality

In contrast to the NNS, the SNSs distinguish different rules for the proposals' decision, based on whether the proposal is _critical_.

Criticality is defined based on proposal topics. That is, each proposal has a topic and each topic is either critical or non-critical. Proposals with a critical topic are also called "critical". They follow more strict rules to ensure they are only passed with broad community consensus.

#### Voting thresholds

Non-critical proposals can be passed if 3% of the total voting power votes yes and 50% of the exercised voting power votes yes.

Critical proposals can only be passed if 20% of the total voting power votes yes and 67% of the exercised voting power votes yes.

#### 

#### Voting period

The voting period for critical proposal types is 5-10 days and cannot be changed by the SNS. In contrast, for non-critical proposals the default is 4-8 days and this can be adjusted by each SNS DAO.

Critical proposal have a longer voting period as they require a larger voting participation and it is therefore beneficial to give voters a bit more time to participate.

As in the NNS, for all proposals the [wait-for-quiet algorithm](https://learn.internetcomputer.org/hc/en-us/articles/34084113508500) ensures that controversial proposals will have a longer voting period (up to 10 days for critical proposals) while proposals where everyone agrees on have a shorter voting period (5 days for critical proposals).

#### Catch-all following

Vote delegation is based on proposal topics and, in contrast to the NNS, there is no longer any notion of a "catch-all" following that covers multiple proposal topics.   
However, SNS vote delegation used to be based on proposal types, which may still be used by some neurons. This old legacy way of vote delegation supported a "catch-all following" that covered all types, except for the critical proposals.

## Built-in and custom proposals

An SNS comes built-in proposals called built-in proposals and SNS-specific custom proposals.

### 

### Built-in SNS proposals

These proposals are provided as part of the SNS framework and thus all SNS DAOs have them. 

Built-in proposals also have pre-defined proposal topics, also deciding on the proposal's criticality (see above). This ensures that the same built-in proposal has the same topic in all SNS DAOs, which makes it easier for users of one SNS to quickly navigate another SNS. 

Built-in proposals include:

  * Motion proposals for opinion polls
  * Proposals to change the SNS's settings and metadata
  * Proposals to upgrade the SNS framework canisters
  * Proposals to register and deregister dapp canisters under SNS control, as well as to change the dapps' settings
  * Proposals to move treasury funds or mint new tokens



You can find more details on all built-in SNS proposals, including their types and how to submit them in the [developer documentation.](https://internetcomputer.org/docs/building-apps/governing-apps/managing/making-proposals) All the proposals used to manage an SNS are executed on the SNS governance canister, so for the most up-to-date definition of SNS proposals, it helps to have as a reference the [interface for the governance canister](https://github.com/dfinity/ic/blob/master/rs/sns/governance/canister/governance.did), where you can find all proposals defined in the type `Action`.

### Custom SNS proposals

Each SNS community might have functions that they would like to only execute if the SNS DAO agrees on it, but that might be very dapp-specific. _Custom proposals_ , also called _generic proposals_ , _generic functions_ , or _generic nervous system functions_ , allow a flexible way for SNS communities to define such functions.

Some examples:

  * A dapp may have lots of canisters to maintain. For example, there may be one canister for each user, in which case they may want to apply upgrades through an orchestrator canister. For this workflow, they would have to tell this orchestrator what the user-canisters should be upgraded to and when to trigger this upgrade. In a DAO-governed dapp, this should happen via proposal.
  * Developers might want the DAO to be the only entity that can elect moderators, call certain methods, make certain payments, etc.



For all these cases, SNS DAOs can use generic proposals. Fundamentally, a custom proposal is just a call to a method on a canister with a certain argument. This means that one can do anything with a generic proposal as long as one can tell the SNS governance canister which method to call.

In addition, since the governance canister is not aware of what a generic proposal does or in which context it will be applied, a custom proposal also has to define a validation method and canister. This method is called whenever such a generic proposal is submitted and if the validator method fails, the proposal will not be put to vote in the SNS.

#### Lifecycle of custom proposals

To use a custom proposal, it first needs to be added to the SNS governance system. This means that the SNS DAO needs to approve that this is a proposal that should be supported going forward. This is also due to the fact that there are a few important, security-critical considerations to make when adding a generic proposal. You can find some of these considerations in the [developer documentation](https://internetcomputer.org/docs/building-apps/governing-apps/managing/making-proposals#security-considerations-when-designing-generic-proposals).

All SNS proposals have assigned topics that are used for filtering and for vote delegation. Since generic proposals are SNS-specific, each SNS community must define which topic fits a new generic proposal best. This is done when the generic proposal is added. Later the community can re-assign a proposal to a new topic by proposal.

To use a generic proposal, i.e., submit such a proposal, one uses the “execute generic nervous system function” proposal type and specifies which of the registered generic proposals should be used. 

Finally, custom proposals can then also be removed again from SNS governance if they are not needed anymore.

All of this handling of custom proposals is done by built-in proposals that are explained in more detail in the [developer documentation](https://internetcomputer.org/docs/building-apps/governing-apps/managing/making-proposals#generic-proposals).

## Proposal topics

Each SNS proposal is assigned to a _proposal topics_. There are seven proposal topics that are defined as part of the SNS framework and thus the same for all SNSs.

A proposal's topics also decides whether the proposal is [critical](https://learn.internetcomputer.org/hc/en-us/articles/34146571133204/h_01K0RK6HWZ0N9HN0EH19P48K44).

Learn more details on how SNS topics were introduced and how they facilitate vote delegation in this tutorial

#### Critical proposal topics

Each SNS has the following **critical proposal topics**.

  * **Critical Dapp Operations** : Proposals to execute critical operations on dapps, such as adding or removing dapps from the SNS, or executing custom logic on dapps.
  * **DAO Community Settings** : Proposals to set the direction of the DAO by tokenomics & branding, such as the name and description, token name, etc.
  * **Treasury and Asset Management** : Proposals to move and manage assets that are DAO-owned, including tokens in the treasury, tokens in liquidity pools, or DAO-owned neurons.



#### Non-critical proposal topics

In addition, each SNS has the following **non-critical topics**.

  * **Application Business Logic** : Proposals that are custom to what the governed dapp requires.
  * **Dapp Canister Management** : Proposals to upgrade the registered dapp canisters and dapp upgrades via built-in or custom logic and updates to frontend assets.
  * **Governance** : Proposals that represent community polls or other forms of community opinion but don’t have any immediate effect in terms of code changes.
  * **SNS Framework Management** : Proposals to upgrade and manage the SNS DAO framework.



#### Assignment of proposal types to topics

Built-in proposals have a fixed assigned topic. This means that in each SNS the same built-in proposal has the same topic.

For custom proposals, the SNS community needs to assign a topic when the custom proposal is added to governance. This means in particular that two SNSs could have a very similar or even the same custom proposal but have it assigned to different topics. 

For a given SNS where you have a neuron controlled on the NNS dapp, you can find which proposals are assigned to which topic by navigating to `Voting Delegation` in the neuron detail page and clicking on `View topic definitions`.

