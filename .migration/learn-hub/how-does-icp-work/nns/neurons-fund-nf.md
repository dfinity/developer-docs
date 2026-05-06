---
learn_hub_id: 34084179554196
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34084179554196-Neurons-Fund-NF"
learn_hub_title: "Neurons' Fund (NF)"
learn_hub_section: "NNS - Network Nervous System "
learn_hub_category: "How does ICP work?"
migrated: false
---

# Neurons' Fund (NF)

The Neurons' Fund has been disabled temporarily with the acceptance of [this proposal](https://dashboard.internetcomputer.org/proposal/135970). When it is re-enabled, the design described below might be changed.

## Background and motivation

The neurons' fund (NF) is designed to support the development of the [Service Nervous System (SNS) DAO](https://learn.internetcomputer.org/hc/en-us/articles/34084394684564) ecosystem. Any holder of an NNS neuron can decide to participate in the NF, contributing the maturity of their neuron to the fund. Decisions on the allocation of NF resources to decentralization swaps of SNS DAOs are made by the NNS.

## Neurons' fund components

The NF comprises four main components that will be discussed in more detail below.

  1. Joining the NF
  2. NF's participation in decentralization swap
  3. Participation in SNS governance
  4. Maturity increase of NF neurons



### Joining and leaving the NF

Neurons can join or leave the NF. Users of the [NNS dapp](https://nns.ic0.app/) can do so by using a checkbox. This action can be taken at any time, even during ongoing voting on SNS proposals. Joining the NF means neurons expose their maturity to the risks associated with participating in SNSs.

### NF participation in decentralization swaps

SNS DAOs are created through an NNS proposal (refer to [SNS launch](https://learn.internetcomputer.org/hc/en-us/articles/34141180048404) for more background). If a proposal to create an SNS is adopted, the decentralization swap, where initial tokens of the SNS are distributed, starts.

The extent of the NF's involvement in a specific SNS swap is decided by the Matched Funding scheme. Under this scheme, the NF’s contribution increases in proportion to the direct participation in the swap. This design ensures that the fund's involvement accurately reflects market interest and participation levels.

At the beginning of the swap, the NF neurons' maturity is reduced proportionally to the maximum possible NF participation (`M`). If the decentralization swap is successful, the NNS mints an amount of `X` ICP as determined by the Matched Funding scheme.

  * The SNS treasury receives `X` ICP.
  * The NNS NF treasury receives SNS neurons corresponding to `X` ICP. This is provided as a basket of neurons with various dissolve delays for each participating NF neuron.
  * If the participation amount `X` is less than `M`, NF neurons' maturity is increased again to compensate.



If the decentralization swap is not successful, the maturity of NF neurons is increased again by the amount it was decreased by earlier.

Please note: In the Matched Funding framework, the minimum and maximum funding targets of an SNS swap are refer only to the direct participation. This means that the success of a swap only depends on the level of direct participation, not the contributions from the Neurons’ Fund.

### Participation in SNS governance

The SNS neurons created for NF participants are controlled by the NNS. Participation in voting on the SNS proposals is, however, passed through to the NF neurons via hotkeys on the SNS neurons owned by the NNS. This means that NF neurons are owned by NNS but permission is given to the principals that exposed maturity to NF neurons to vote on SNS proposals.

When the swap is finalized, the hotkeys associated with neurons of NF participants are copied to the SNS neuron that is created for them. This is convenient for NF participants who want to keep their neurons' controller key in cold storage, and want to vote on SNS proposals. These users can add a hotkey to their NNS neuron, and it will automatically be copied to their SNS neuron for new SNSs.

At most 3 hotkeys are copied. If an NNS neuron has more hotkeys, 3 of them will be chosen, prioritizing self-authenticating principals (i.e. non-canister principals) and favoring principals added earlier. This means that users can influence which hotkeys are selected by removing and then re-adding the hotkeys they don't want to be copied. If the user has hotkeys = [A, B, C, D] (all self-authenticating), and they want [A, B, D] to be copied to the SNS, then they should do something like:  
  
1\. hotkeys.remove(C) // hotkeys = [A, B, D]  
2\. hotkeys.add(C) // hotkeys = [A, B, D, C]  
  
Now [A, B, D] would be copied.

The voting power of the SNS neurons is proportional to the amount of maturity exposed.

### Increasing maturity of NF neurons

The NNS NF treasury holds SNS neurons & tokens in its treasury, to be dissolved and disbursed at its discretion. When a set of neurons from a decentralization swap of an SNS dissolves, the NNS will determine the value of the dissolved SNS neurons. In the first stage, this will be done by a proposal. In a later stage, this could be done by pulling data from a DEX.

The maturity of NF neurons whose maturity was reduced when a participation in a SNS-controlled dapp was made is increased by the amount determined by the NNS in the previous step. In the worst case, this amount could also be zero.

The NNS can liquidate the disbursed SNS tokens at a later point in time. In case the NNS decides to swap the SNS tokens for ICP, the received ICP will be burned.

## Matched funding

The _Matched Funding_ scheme, in which the contribution of the Neurons’ Fund to SNS decentralization swaps scales in line with direct participation, allows for a reflection of market signals.

In a SNS swap, there is a separation of contributions from direct participants and the Neurons’ Fund. In the Matched Funding framework, the minimum and maximum funding targets of an SNS swap refer only to the direct participation. This means that the success of a swap only depends on the level of direct participation, not the contributions from the Neurons’ Fund.

### The Matching function, _f_

The scheme is implemented through a matching function _f_ , where the input represents the amount of direct participation, and the output _f(x)_ denotes the corresponding contribution from the Neurons' Fund (NF).

The function f is designed to have three distinct phases and will be a continuous function to ensure a smooth transition between these phases. Importantly, the rules for these phases will be globally consistent, applicable to all SNS launches.

  * Initial Lag Phase (I): The function starts at 0, and grows slowly until it reaches a set threshold. This design encourages projects to accumulate enough direct participation before receiving substantial contributions from the NF.
  * Growth Phase (II): After crossing the threshold, the NF's contribution increases at a faster rate, signifying more significant support for projects that have demonstrated viability through direct participation.
  * Saturation Phase (III): Beyond a certain point, f(x) will level off and will not surpass 10% of the NF's total maturity, which ensures that no single SNS will excessively deplete the NF's resources.
  * Bounding Condition: The matching function f(x) is bounded by g(x)=x, meaning that it will never exceed a 1:1 ratio with x. In practical terms, the NF's contribution will always be less than or equal to the amount of direct participation.



These design principles aim to create a fair and sustainable system for allocating NF contributions to various SNS initiatives.

### Benefits of matched funding

#### Reflection of market signals

The matched funding system is designed to closely align with market sentiment. Specifically, a project that successfully raises more direct contributions will correspondingly receive a greater contribution from the Neurons' Fund (NF), up to a predetermined limit.

#### Simpler decision-making for NF NNS neurons

The automated adjustment feature in the NF's contributions lessens the decision-making burden on NF NNS neurons. As a result, these neurons have fewer instances where they need to opt out, making the process more efficient.

#### Improved incentives for projects

The matching system provides a more compelling incentive structure for projects. Knowing that increased direct funding will be matched (up to a point) by the NF, encourages projects to be more proactive in their fundraising efforts.

### Detailed specification of the matching function

#### Cap

The contribution should be capped by 10% of the NF maturity at proposal execution time and also by a global NF contribution cap being equivalent to 0.75M XDR. In other words we have cap = min (10% of NF maturity, global NF contribution cap).

The global NF contribution cap is a configurable parameter of the NNS.

#### Thresholds

For specifying the shape of the matching function  _f_ , we define the following thresholds

  * t_1: Up to this point, a project receives no contribution from the NF.
  * t_2: Projects get a 2:1 contribution from the NF.
  * t_3: Projects receive a 1:1 contribution from the NF.
  * t_4 = 2 * cap: Projects get a 2:1 contribution from the NF. (and afterwards the contribution of the NF remains flat).



The thresholds should be configurable parameters of the NNS. For example, they could become part of the NetworkEconomics record.

These thresholds are specified in XDR and then converted to ICP thresholds at the execution of the SNS swap proposal using the 30-day average ICP/XDR conversion rate.

  * t_1: 75k XDR
  * t_2: 225k XDR
  * t_3: 375k XDR



For an interactive tool allowing to explore the functionality of matched funding, please see the SNS [tokenomics analyzer](https://dashboard.internetcomputer.org/sns/tokenomics).

#### Matching function polynomials

  * f_1: for function values between t_1 and t_2
  * f_2: for function values between t_2 and t_3
  * f_3: for function values between t_3 and t_4.



Formulas for the polynomials can be derived from constraints listed above on the functions f and f’.

### Clearer separation of contributions

Feedback from both SNS projects and users on earlier designs has highlighted the need for a clearer separation between contributions from direct participants and those from the NF. This is now realized in two areas:

  1. Proposal structure: Instead of specifying the overall minimum and maximum funding target, projects have the ability to set distinct minimum and maximum funding targets specifically for direct participation, which is the only factor determining whether the swap succeeds. The contribution from the NF is then added to this base amount, determined by a well-defined model (as per the matching function discussed above).
  2. User transparency in the SNS launchpad: During the swap, contributions from direct participants and the NF are displayed separately for transparency, within the NNS dapp’s SNS launchpad.



### Benefits of the clearer separation

  * Transparency in success metrics: The success of the swap is directly and transparently linked to the amount raised through direct participation.
  * More freedom to define funding target range: Projects can set a more flexible range for minimum and maximum funding targets without having to factor in the NF contribution, offering more leeway than in the current system where the NF contribution affects these limit (e.g. because the fixed NF contribution should exceed more than 66% of the minimum funding target).
  * User clarity: Users will be able to easily see the amount of direct participation already collected during the swap, as well as the anticipated NF contribution.



