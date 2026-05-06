---
learn_hub_id: 34084120668692
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34084120668692-Neurons"
learn_hub_title: "Neurons"
learn_hub_section: "NNS - Network Nervous System "
learn_hub_category: "How does ICP work?"
migrated: false
---

# Neurons

## What is a neuron?

In order to participate in the network's governance and to receive voting rewards, ICP tokens must first be staked in a _neuron_. Neurons represent governance participants. Each neuron has its own identifier and several attributes.

Once a neuron is locked for more than six months, it gains the ability both to submit proposals and to vote on them. Voting in turn generates voting rewards, based on how active a neuron is. If a neuron votes on every open proposal, it gains the maximum rewards.

A neuron can also _follow_ other neurons, which causes it to automatically vote the same way as the majority of the neurons that it follows. In order to keep its voting power and thus keep getting voting rewards, a neuron has to regularly vote directly, set following, or confirm the chosen following settings.

## Why staking matters

Staking is a way of allowing those who support the Internet Computer to decide what happens next to the network.

It is possible for proposals to pass with only a majority among 3% of the total voting power, meaning that proposals stand a chance even if large entities abstain and the majority of the network does not vote.

## Key concepts

It is important to understand a few key concepts of a neuron. Every user can stake ICP utility tokens into a neuron and participate in the NNS DAO.

Each neuron has a _neuron ID_ , which is an identity selected by the NNS when the neuron is created.  
In addition, each neuron has an associated _account_ on the ICP ledger where the locked ICP balance resides. This account is owned by the NNS governance canister, and therefore a user cannot move staked tokens.

### Neuron permissions

The neuron's _controller_ is a [principal](https://learn.internetcomputer.org/hc/en-us/articles/34250491785108) that controls the neuron and which cannot be changed. A principal corresponds to the public key of a public-private key pair, and anyone with possession of the corresponding private key will have full control of the neuron. Therefore, the private key of the controller principal should be kept very secure. One principal can control multiple neurons.

### Hotkeys

In addition to the controller, a neuron can have _hotkeys_. Hotkeys are principals that can perform actions with limited privileges, namely:

  * Voting.
  * Set and confirm _following_ (see below).
  * Reading the full information about the neuron, including non-public fields.
  * Submit a proposal.



Hotkeys cannot perform other neuron operations, such as increase dissolve delay, start dissolving, or disburse a neuron's stake.

A neuron can have up to 15 hotkeys. One common workflow using hotkeys is to set a hardware wallet as the controller of the neuron, then vote or view neuron information through a software wallet set as a hotkey.

Hotkeys can be added or removed from a neuron using the [NNS dapp](https://nns.ic0.app/) or the [`quill neuron-manage`](https://internetcomputer.org/docs/current/developer-docs/developer-tools/cli-tools/quill-cli-reference/quill-neuron-manage) command. If your principal is added as a hotkey to a neuron, the neuron and its information will be visible in the NNS dapp when you login.

### Voting power

The NNS is a stake-based governance system, so the main factor for how much _voting power_ a neuron has is its stake. In addition, the voting power depends on the following factors.

  * _Dissolve delay_ : The tokens in a neuron are locked for a specified duration called the dissolve delay. This can be thought of as a kitchen timer that can only be turned in one direction. It can be arbitrarily increased, but only reduced by turning on the countdown and waiting for the time to pass. A neuron must have a dissolve delay of at least 6 months to be _eligible_ to vote.
  * _Dissolve state:_ A neuron can be in one of three states. 
    * A neuron can be _non-dissolving_ which means that the timer is stopped and the neuron's dissolve delay remains the same.
    * A neuron can be _dissolving_ which means that the timer is decreasing the neuron's dissolve delay as time passes.
    * Once the timer has counted down, a neuron is _dissolved_ and the ICP tokens can be unstaked again. This is called _disbursing_ a neuron.
  * _Age_ : Every non-dissolving neuron has an age, which denotes how long it has been in the non-dissolving state.
  * _Voting Power adjustment due to inactivity_ : In order to keep the voting power, a neuron has to regularly perform any of the following actions: vote directly, set following, or confirm its current following settings. If a neuron fails to do this, its voting power decreases slowly with time until it reaches 0. The voting power adjustment can be lifted at any point by the neuron performing one of the above actions.



The first two factors ensure that a neuron who has tokens locked for longer or has been around for longer has more voting power as it is more committed to the long-term interest of the Internet Computer. The last factor ensures that "sleeper" neurons who do not actively participate in the voting process do not automatically get rewards.

Based on these factors, a neuron's voting power can be determined:

  * Principally, by its stake. 1 ICP = the power of 1 vote.
  * By its dissolve delay. 6 months grants a 1.06x voting power bonus, and 8 years grants 2x. All other durations scale linearly between.
  * By its age. 4 years grants a 1.25x bonus, multiplicative with any other bonuses. All other durations between 0 seconds and 4 years scale linearly between.
  * By voting power adjustments. A neuron who votes directly, sets following, or confirms following once every 6 months gets normal voting power. After 6 months of no action, a neuron’s voting power is linearly decreased for one month until it reaches zero at the end of 7 months without any action. After these 7 months, the neuron’s following settings are fully reset to zero.



This means that the maximum voting power of 2.5 votes per ICP staked is only achievable by locking up your neuron for 8 years, leaving it in that locked-up state for 4 years, and regularly participating in governance by voting, set following, or confirm following. At that time, you will have the most voting power for the stake committed.

To better understand how these factors influence a neuron's voting power and rewards over time, you can simulate some behaviors with the [NNS neuron sandbox](https://klgza-cqaaa-aaaak-qcz5a-cai.icp0.io/). Note that this tool assumes that neurons are active and therefore are not subject to voting power adjustments.

### Maturity

When neurons vote, directly or through following, the _maturity_ of a neuron increases as it collects voting rewards.  
Each day the network rewards participants by allocating to every voting neuron a portion of the total reward, based both on its voting power at the time proposals were made and the number of proposals it voted on. See section Voting rewards & maturity for more details.

### Neuron visibility

A neuron can be _public_ or _private_.

If a neuron is private, only its controller and the hotkeys can read the full neuron. Other parties cannot access all the information about the neuron. In particular, they cannot access the neuron's ballot. As a consequence, other neurons can only delegate their voting power to a private neuron if their controller is the same or if their controller is a hotkey of the delegate. 

If a neuron is public, anyone can read the full neuron. All known neurons are public. There are no restrictions who can delegate voting power to a public neuron.

Refer to the tutorial [Making neurons public](https://internetcomputer.org/docs/current/developer-docs/daos/nns/using-the-nns-dapp/nns-dapp-making-neurons-public) to learn how you can change the visibility of your neurons on the NNS dapp.

## Governance participation

The main purpose of a neuron is to participate in governance. A neuron with a minimal stake can do so by submitting and voting on a [proposals,](https://learn.internetcomputer.org/hc/en-us/articles/34084113508500) or by participating in governance via the liquid democracy _following_ mechanism.

### Voting

A neuron is eligible to vote if it has at least 6 months dissolve delay. An eligible neuron can _vote_ on a proposal by choosing to adopt or reject it. This is called _direct voting_ as a neuron can also delegate voting (see next paragraph).

As stated above a neuron's eligibility and voting power is dependent on its state and computed at proposal submission time. For more details on how these votes are processed in terms of ballots, refer to[ NNS proposals](https://learn.internetcomputer.org/hc/en-us/articles/34084113508500).

To learn how you can vote directly, refer to [Voting on proposals](https://internetcomputer.org/docs/current/developer-docs/daos/nns/using-the-nns-dapp/nns-dapp-voting-on-proposals).

### Vote delegation / Following

Users may not have the time or knowledge to participate in all voting decisions. Therefore, instead of directly voting on proposals, neuron holders may choose to _delegate_ their vote to other neurons that they trust with certain decisions. This concept, where a neuron follows the decisions of some other neurons, is called _following_ in the NNS DAO. Collective decision making which combines the direct execution with dynamic delegation mechanisms for voting rights is called _[liquid democracy](https://en.wikipedia.org/wiki/Liquid_democracy)._

_For an explanation video regarding how following works and more information how following can be set on the NNS dapp, refer to[configuring neuron following](https://internetcomputer.org/docs/current/developer-docs/daos/nns/using-the-nns-dapp/nns-dapp-following-other-neurons)._

#### Periodic confirmation

A neuron that never votes directly needs to either set or confirm its following decisions regularly (once every 6 months) in order to keep it voting power and keep getting rewards. This  _periodic confirmation_ encourages governance participants to regularly review their following choices.

For additional information on how to confirm following on the NNS dapp, refer to [Periodic neuron following confirmation](https://internetcomputer.org/docs/current/developer-docs/daos/nns/using-the-nns-dapp/nns-dapp-confirm-following).

#### Following rules

A neuron can be configured to vote automatically by following the voting decision made by a group of other neurons, called _followees_. Proposals are grouped into different [proposal topics ](https://learn.internetcomputer.org/hc/en-us/articles/34140518658068)and following is done on a per-topic basis.

A neuron can follow any public neuron. A neuron can only follow a private neuron if it has the same controller or if its controller is a hotkey of the neuron to follow.

Each neuron can follow at most 15 other neurons for each proposal topic. A neuron will only cast a "Yes"-vote if _more than half_ of the neurons within the followee-group voted Yes. A neuron will only cast a "No"-vote if _at least half_ of the neurons within the followee-group voted No.

Your neuron will cast a vote when there are enough followee votes to make a decision whether it is a ADOPT or REJECT. For example, if you follow 10 neurons on a topic:  
\- Your neuron only votes to adopt if at least 6 out of the 10 neurons vote to adopt.  
\- Your neuron only votes to reject a proposal if at least 5 out of the 10 reject the proposal.  
\- If less than 5 neurons (out of your 10 followed) vote at all, your neuron will not cast any vote.

  
This should be considered when choosing to follow multiple neurons on a topic. It might be better to follow fewer neurons, and it can be more beneficial to follow an odd number of neurons than an even number.

#### Following "catch-all"

In addition to setting following for individual topics, neurons may also define a catch-all follow rule which is triggered for proposals with topics for which no other explicit follow rule has been defined.  
However, the catch-all follow rule does not include the proposal topics _SNS & neurons' fund_ and _Governance_.

The catch-all follow rule is only applied for proposal topics with no other explicit choice. For example, let us assume neuron A follows neuron B for the catch-all and neuron C on the topic subnet management. If B votes on a subnet management proposal but C does not, no vote will be cast for A.  
The catch-all follow rule does not apply for SNS & neurons' fund or governance proposals. For example, if neuron A follows neuron B for the catch-all and B votes on a governance proposal, no vote will be cast for A. If neuron A intends to also follow B on such decisions, the user has to explicitly choose to also follow B on the governance topic.

It is in each neuron's interest to follow other neurons that support the best interests of the network and their own economic interests.

## Known neurons

In order for neurons to find which other neurons they could delegate their vote to, the NNS has a notion of _known neurons._ This is a list of neurons that can be used as a basis for finding candidates.

Using a [proposal](https://learn.internetcomputer.org/hc/en-us/articles/34140518658068#h_01JJ2H93WHRBTDDFYPBVKTBHN2), any neuron can apply to register as a known neuron. If the NNS community approves the proposal, the neuron is added with a name in the list of known neurons. Optionally, the known neuron can also have the following self-declared information: 

  * A description, for example what person or group is controlling the neuron, what their background is, and how they intend to vote.
  * A list of links, for example to socials where voters can find more information.
  * A list of proposal topics that the neuron commits to voting on.



In addition to this self-declared information, the governance stores the past ballots of known neurons so that voters can consider their past behavior when they decide who to delegate their voting power to.

_One place to find a list of all known neurons is on the[ICP Dashboard](https://dashboard.internetcomputer.org/neurons?s=100&type=known)._

_Interested parties who want to register a know neuron, update an existing known neuron, or propose to de-register a known neurons can find more information on the[developer documentation about Known Neurons](https://internetcomputer.org/docs/building-apps/governing-apps/nns/concepts/neurons/becoming-a-known-neuron)._

## Voting rewards & maturity

In addition to influencing the future of the Internet Computer, the main incentive for stakeholders to stake their ICP tokens in a neuron and participate in voting is that they get _voting rewards_ by doing so. Voting rewards are collected by neurons in the form of _maturity_.

Maturity is an attribute of a neuron; it is not a tradable asset. The decentralized governance of the Internet Computer can change the treatment of maturity at any time. To generate income from maturity, a user needs to trigger a non-deterministic process, which is burning maturity to create new ICP via disbursing the maturity (or spawning a neuron). The maturity modulation function introduces uncertainty in the creation of tokens from maturity.

### What you can do with maturity

Maturity can either be _disbursed_ (replacing the old functionality of _spawning)_ or it can be staked, meaning compounded to increase the neuron's total voting power. A user can also choose to _auto-stake_ the maturity.

#### Disbursing maturity via the maturity modulation function

Maturity can be liquidated by _disbursing maturity_. This is a process that can be started at any time and will then take seven days. In the end, a maturity modulation is applied, and new ICP tokens are minted that can be freely used. Maturity can be disbursed to any ledger account. If no account is specified, the caller's account will be used.   
For more information on how to disburse maturity, refer to [How to disburse maturity](https://learn.internetcomputer.org/hc/en-us/articles/39755298701204).

#### Spawning maturity via the maturity modulation function

It is recommended to use disburse maturity instead of spawn maturity. While spawning is currently still supported by the NNS governance, it was replaced with disburse maturity and might be deprecated going forward.

When a user chooses to spawn maturity, a new neuron will be immediately spawned. However, this newly spawned neuron will have no ICP at start, only maturity. Spawned neurons will have a dissolve delay of 7 days and will be set to dissolving at the time of spawning. After 7 days when the neuron is dissolved, the amount of ICP, modulated by the function introduced below, will be minted from the neuron's maturity and be available to the user.

For more information on how to spawn maturity, refer to [How to disburse maturity](https://learn.internetcomputer.org/hc/en-us/articles/39755298701204).

#### Staking maturity

Maturity can be staked into _staked maturity_ of the neuron. Staked maturity is viewed as part of the neuron's stake and contributes to the neuron's voting power. But, similarly to the neuron's stake, it is also locked until the neuron is dissolved. When a neuron dissolves, its staked maturity is converted back to normal un-staked maturity (which is then subject to the maturity modulation).

For more information on how to stake maturity, refer to [How to stake and auto-stake maturity](https://learn.internetcomputer.org/hc/en-us/articles/39755363912724).

#### Auto-staking maturity

Maturity can be _auto-staked_. In order to not have to regularly perform the previous action, a neuron can also choose to auto-stake its maturity. This means that all new maturity will automatically be added to the staked maturity.

For more information on how to stake maturity, refer to [How to stake and auto-stake maturity](https://learn.internetcomputer.org/hc/en-us/articles/39755363912724).

### Maturity modulation

As mentioned above, to generate income from maturity, a user needs to trigger a non-deterministic process, which is burning maturity to create new ICP via disbursing the maturity. The _maturity modulation function_ introduces uncertainty in the creation of ICP from maturity.

At the day of modulation, for each of the last 29 days, a 30-day moving average ICP/cycles conversion rate is determined, which is displayed on the Internet Computer dashboard. These are labeled `a1` through `a29`, where `a1` denotes the average rate on the previous day, `a2` denotes the rate 2 days ago and so on. The 30-day moving average conversion rates are used because they exhibit less variance than day-to-day conversion rates.

Then, compute the relative 7-day return for each of the last 4 weeks. Thus:

  * ` w1 = (a1 - a8) / a8`,
  * ` w2 = (a8 - a15) / a15`,
  * ` w3 = (a15 - a22) / a22`,
  * ` w4 = (a22 - a29) / a29`.
  * The values w1, w2, w3, and w4 are bounded from -0.05 to 0.05 by clipping values to the limits of this range, i.e., capping by 0.05 and flooring by -0.05.
  * Take the average `w = (w1 + w2 + w3 + w4) / 4`.
  * The resulting value w is a number between -5% and 5% that determines modulation.
  * The maturity amount x is converted to x * (1+w) units of ICP.



The maturity modulation function is updated once a day.

#### Example

On Feb 1, 2022, the modulation function is 0.73% which is the average of the relative weekly returns w1 = -4.59%, w2 =-0.63%, w3=5.00%, w4 = 3.13%. If a user disburses on that day (day of transfer) 100 maturity, then this will result in 100.73 ICP.

#### Motivation and analysis

Evidently, this process introduces a certain amount of uncertainty for the conversion from maturity to ICP. However this uncertainty is limited in two ways:

  * The modulation value w is between -5% and +5%: This implies that, e.g., 100 maturity will be converted into an ICP amount in the range of 95 and 105. This kind of volatility is well in the range of daily conversion rate fluctuations of ICP.
  * The modulation value w is calculated at the day of modulation as `w = (w1+ w2+ w3 + w4) / 4`. At the day of initiation (7 days prior), the user can already determine `(w2+ w3 + w4)/4`. The missing value w1 can affect the modulation value at most by 1.25% (5%/4) up or down.



The modulation value can change by at most 2.5% from one week to the next, as one week drops out of the window and one week enters the calculation window.

The modulation function gives an incentive for users to disburse maturity when the ICP/Cycles conversion rate has been increasing over time and to hold back when the ICP has been decreasing recently. For example if the ICP/Cycles conversion rate was monotonically increasing, then w1, w2, w3, w4 are positive and thus also w, incentivizing users to convert a maturity amount x to x * (1+w) units of ICP.

