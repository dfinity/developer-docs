---
learn_hub_id: 34084687583252
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34084687583252-Neurons"
learn_hub_title: "Neurons"
learn_hub_section: "SNS - Service Nervous System"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Neurons

## What is a neuron?

Neurons represent SNS governance participants that can vote on proposals. In order to participate in governance, SNS governance tokens (that are unique in each SNS) must be _staked in a neuron_. 

Once tokens are locked in a neuron for a specified time, it gains the ability both to submit proposals and to vote on them. A neuron can also _follow_ other neurons, which causes it to automatically vote the same way as the majority of the neurons that it follows. 

### Relationship to neurons in other DAOs

The concept of neurons closely resembles [neurons in the NNS.](https://learn.internetcomputer.org/hc/en-us/articles/34084120668692) If you understand and are used to NNS neurons, you most likely understand a lot about SNS neurons already. There are however a few differences, including that NNS neurons can be public or private while all SNS neuron are public.

Detailed neurons' settings can be chosen by each SNS communities as part of the [governance settings](https://learn.internetcomputer.org/hc/en-us/articles/34142964565396). For example, each SNS community can choose the rules about how long tokens must be staked in a neuron for the neuron to be eligible to vote, which neuron attributes influence its voting power, whether the governance rewards participation with voting rewards and if so how much.

###    
Key concepts

Each neuron has a _neuron ID._ In the SNSs, and unlike the NNS, the neuron ID is the neuron _account_ on this SNS's ledger where the locked token balance resides. This account is owned by the governance canister, and therefore a user cannot move staked tokens.

#### Neuron permissions

While the NNS has a controller, that cannot be changed, and hotkeys with limited permissions, permissions are more flexible and fine-grained in the SNS framework.

An SNS distinguishes many different permissions, for example for voting, or for changing certain settings of the neuron. With this, an SNS can for example define that certain operations are reserved for the original "controller" of the neuron (like in the NNS) or that all permissions can be handed over to a new principal.

Within these rules, a user can then assign any set of permissions to a given principal and has thus a lot of flexibility. Some frontends, such as the[ NNS dapp](https://nns.ic0.app/), only allow users to add and remove "hotkeys" - even though this concept does not exist in the SNS governance it is easier for users to understand. The hotkey setting represents the set of permissions of a [hotkey in the NNS](https://learn.internetcomputer.org/hc/en-us/articles/34084120668692) and is just translated to the SNS's permission system in the background.

#### Voting power

An SNS is a stake-based governance system, so the main factor for how much _voting power_ a neuron has is its stake. Each SNS community can decide how the following factors influence a neuron's voting power by [choosing according settings](https://learn.internetcomputer.org/hc/en-us/articles/34142964565396).

  * _Dissolve delay_ : The tokens in a neuron are locked for a specified duration called the _dissolve delay_. This can be thought of as a kitchen timer that can only be turned in one direction. It can be arbitrarily increased, but only reduced by turning on the countdown and waiting for the time to pass. Each SNS defines the _minimum dissolve delay_ a neuron must have to be _eligible_ to vote.
  * _Dissolve state:_ A neuron can be in one of three states. 
    * A neuron can be _non-dissolving_ which means that the timer is stopped and the neuron's dissolve delay remains the same.
    * A neuron can be _dissolving_ which means that the timer is decreasing the neuron's dissolve delay as time passes.
    * Once the timer has counted down, a neuron is _dissolved_ and the ICP tokens can be unstaked again. This is called _disbursing_ a neuron.
  * _Age_ : Every non-dissolving neuron has an age, which denotes how long it has been in the non-dissolving state.



These factors ensure that a neuron who has tokens locked for longer or has been around for longer has more voting power as it is more committed to the project. 

#### Maturity

Each [SNS can choose](https://learn.internetcomputer.org/hc/en-us/articles/34142964565396) whether participation in voting is rewarded with [voting rewards](https://learn.internetcomputer.org/hc/en-us/articles/34143058069396). If activated, when neurons vote, directly or through following, the _maturity_ of a neuron increases as it collects voting rewards. See [SNS Rewards](https://learn.internetcomputer.org/hc/en-us/articles/34143058069396) for more details.  
There are different things that a neuron holder can do with maturity:

  * Maturity can be liquidated by _disbursing maturity_. This is a process that can be started at any time and will then take seven days. In the end, a _maturity modulation_ is applied, and new SNS tokens are minted that can be freely used. 
    * Maturity can be disbursed to any ledger account. If no account is specified, the caller's account will be used. 
  * Maturity can be staked into _staked maturity_ into the neuron. Staked maturity is viewed as part of the neuron's stake and contributes to the neuron's voting power. But, similarly to the neuron's stake, it is also locked until the neuron is dissolved. When a neuron dissolves, its staked maturity is converted back to normal un-staked maturity.
  * Maturity can be _auto-staked._ In order to not have to regularly perform the previous action, a neuron can also choose to auto-stake its maturity. This means that all new maturity will automatically be added to the staked maturity.



The (same)[_maturity modulation_](https://learn.internetcomputer.org/hc/en-us/articles/34084120668692#01JY1DDWXPKKD5JHH927Z683D0) applies both to NNS neurons and SNS neurons. In both scenarios, the function of maturity modulation will be influenced by the ICP/cycles conversion rate. For more details, refer to [maturity modulation](https://learn.internetcomputer.org/hc/en-us/articles/34084120668692#01JY1DDWXPKKD5JHH927Z683D0).

#### Neuron visibility

All SNS neurons are _public._

## Governance participation

The main purpose of a neuron is to participate in governance. A neuron with a minimal stake can do so by submit and vote on a [proposals,](https://learn.internetcomputer.org/hc/en-us/articles/34146571133204) or by participating in governance via the liquid democracy. 

### Voting 

A neuron is eligible to vote if it has a minimum staked ([defined in the SNS's settings](https://learn.internetcomputer.org/hc/en-us/articles/34142964565396)). An eligible neuron can _vote_ on a proposal by choosing to adopt or reject it. As a neuron can also delegate voting (see next paragraph), this is sometimes also called _direct voting._

As stated above a neuron's eligibility and voting power is dependent on its state and computed at proposal submission time. For more details how these votes are processed in terms of ballots, refer to[ SNS proposals](https://learn.internetcomputer.org/hc/en-us/articles/34146571133204).

### Following / vote delegation

Users may not have the time or knowledge to participate in all voting decisions. Therefore, instead of directly voting on proposals, neuron holders may choose to _delegate_ their vote to other neurons that they trust with certain decisions. This concept, where a neuron follows the decisions of some other neurons, is called _following_. Collective decision making which combines the direct execution with dynamic delegation mechanisms for voting rights is called liquid democracy.

Following works as in the NNS and you can refer to an explanation video how it can be set on the NNS dapp [here](https://learn.internetcomputer.org/docs/current/developer-docs/daos/nns/using-the-nns-dapp/nns-dapp-following-other-neurons).

#### Following rules

A neuron can be configured to vote automatically by following the voting decision made by a group of other neurons, called _followees_. In the SNS, following is currently based on [proposal types](https://learn.internetcomputer.org/hc/en-us/articles/34146571133204).

A neuron will only cast a "Yes"-vote if _more than half_ of the neurons within the followee-group voted Yes. A neuron will only cast a "No"-vote if _at least half_ of the neurons within the followee-group voted No.

Your neuron will follow when there are enough votes to make a decision whether it is a ADOPT or REJECT. For example, if you follow 10 neurons on a topic:  
\- Your neuron only votes to adopt if at least 6 out of the 10 neurons vote to adopt.  
\- Your neuron only votes to reject a proposal if at least 5 out of the 10 reject the proposal.  
\- If less than 5 neurons (out of your 10 followed) vote at all, your neuron will not cast any vote.

This should be considered when choosing to follow multiple neurons on a topic. It might be better to follow fewer neurons, and it can be more beneficial to follow an odd number of neurons than an even number.

#### Following "catch-all"

In addition to setting following for individual topics, neurons may also define a catch-all follow rule which is triggered for proposals with topics for which no other explicit follow rule has been defined.  
However, the _catch-all follow rule does not include critical proposal types_. 

The catch-all follow rule is only applied for proposal topics with no other explicit choice. For example, let's assume neuron A follows neuron B for the catch-all and neuron C on the topic dapp upgrade. If B votes on a dapp upgrade proposal but C does not, no vote will be cast for A.  
The catch-all follow rule does not apply for critical proposals. For example, if neuron A follows neuron B for the catch-all and B votes on a treasury transfer proposal (which is critical, see [SNS Proposals](https://learn.internetcomputer.org/hc/en-us/articles/34146571133204)), no vote will be cast for A. If neuron A intends to also follow B on such decisions, the user has to explicitly choose to also follow B on the treasury type.  
  


It is in each neuron's interest to follow other neurons that support the best interests of the project and their own economic interests.

