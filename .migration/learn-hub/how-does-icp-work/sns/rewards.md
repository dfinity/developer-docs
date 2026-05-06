---
learn_hub_id: 34143058069396
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34143058069396-Rewards"
learn_hub_title: "Rewards"
learn_hub_section: "SNS - Service Nervous System"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Rewards

The full potential of tokenization can be unlocked by a tokenized open governance system, where tokens can be staked to participate in voting. Anyone with staked tokens can submit and vote on governance [proposals](https://learn.internetcomputer.org/hc/en-us/articles/34146571133204) for the dapp governed by the SNS DAO.

SNS governance empowers developers, users, and investors to collectively shape the dapp's future by voting on proposed features. Staked token holders are incentivized to vote strategically, considering the long-term value of both the tokens and the dapp. 

There are two categories of rewards:

  * **Voting rewards** to incentivize users to take part in SNS governance.
  * **User rewards** to incentivize dapp users to become early adopters and active users of the dapp that is governed by the SNS.



The reward scheme is based on the principles for [voting rewards used in the NNS](https://learn.internetcomputer.org/hc/en-us/articles/34142993417108), flexibly configurable for each SNS.

## Voting rewards

The SNSs leverage the [NNS voting reward scheme ](https://learn.internetcomputer.org/hc/en-us/articles/34142993417108)with the flexibility to configure the scheme to the DAO's needs. Hence, in the following this guide goes through the features of the NNS and describes how it is adapted and made configurable for the SNS. Unless otherwise stated, the approach and formulae are the same as for the NNS. As for the NNS, it is possible to change the SNS configuration by an SNS governance proposal.

### Determination of the total reward pool

The impact of changing the parameters of the reward function can be simulated in this [tool](https://docs.google.com/spreadsheets/d/1cTqgjGcG5rEQ5kRGprpdLvBL7ZdTqUDCuCi0QjClbgk/edit#gid=0).

![graph_rewards_total_supply.png](https://learn.internetcomputer.org/hc/article_attachments/34143317612948)

  * Reward minimum r_min: rational value greater than or equal to 0. Default value: 0.00.
  * Reward maximum r_max: rational value greater than or equal to r_min. Default value: 0.00.
  * Start time for paying out rewards t_start: timestamp greater than or equal to genesis time of the SNS. The start time is set to the current time once the reward calculation is switched on.
  * Time length t_delta which is greater than or equal to 0 and which determines the time transition length between r_max and r_min. Default value: 0 years.
  * For a time t between t_start and t_start+t_delta the annualized reward as a percentage of total supply is R(t) = r_min + (r_max - r_min) [ (t_start + t_delta – t) / t_delta ]²
  * For a time t after t_start + t_delta , you have R(t) = r_min 
  * For the special case r_max = r_min the reward function is constant, namely R(t)=r_min
  * The total pool of voting rewards for a given day is calculated as SNS supply (total supply of SNS tokens) * R(t) / 365.25.
  * Voting rewards are minted, i.e. generating new supply once the according maturity is converted to the SNS token. In case that the SNS would like to stop a token supply increase after t_start + t_delta the SNS should set r_min = 0.



### Voting power of neurons

  * Required minimum dissolve delay for voting dd_min: integer value greater than or equal to zero. Default value: 6 months.
  * Maximum dissolve delay dd_max: integer value greater than or equal to dd_min. Default value: 8 years.
  * Maximum dissolve delay bonus: 
    * ddb_max rational value greater than or equal to 1. Default value: 2.
    * The special case ddb_max = 1 results in no dissolve delay bonus.
  * Maximum age a_max: integer value greater than or equal to 0. Default value: 4 years.
  * Maximum age bonus ab_max rational value greater than or equal to 1. Default value: 1.25. 
    * The special case ab_max = 1 results in no age bonus.



### Allocation of reward pool

  * The reward pool is allocated in proportion to the voting power of proposals that are settled on this day (same as for the NNS).
  * If on a particular day no proposal was submitted then rewards will be carried over to the next day.
  * NNS has reward weights for different proposal types. In the current version of the SNS reward scheme this functionality is not available.



There is a flag which activates the calculation and distribution of voting rewards, as an SNS might choose to go through a ramp-up period without voting rewards, or with no voting rewards at all.

## Setting voting reward parameters 

Voting reward parameters are defined as part of the nervous system parameters that define the[ individual settings for a given SNS instance](https://learn.internetcomputer.org/hc/en-us/articles/34142964565396).

The following table provides an overview of all relevant parameters which are collectively called _VotingRewardsParameters_ , linking the notation of this article to full names used in the implementation.

**Parameter** | **Full name in _VotingRewardsParameters_**  
---|---  
r_min | _initial_reward_rate_basis_points_  
r_max | _final_reward_rate_basis_points_  
t_start | _start_timestamp_seconds_  
t_delta | _reward_rate_transition_duration_seconds_  
  
When _VotingRewardsParameters_ is not populated, voting rewards are disabled.

The following provides an overview of the relevant parameters for the determination of voting power.

**Parameter** | **Full name in _VotingRewardsParameters_**  
---|---  
dd_min | neuron_minimum_dissolve_delay_to_vote_seconds  
dd_max | max_dissolve_delay_seconds  
ddb_max | To be added, once implemented.  
a_max | max_neuron_age_for_age_bonus  
ab_max | To be added, once implemented.  
  
## User rewards

  * The purpose of user rewards is to foster early adoption and active usage of the SNS. Given that the meaning of usage and the according user rewards can vary greatly across individual SNSs, there is a very simple set-up.
  * Some tokens (reserved for user rewards) can be held in an account that is owned by an SNS-controlled canister. This canister can then codify when the rewards are paid out and to whom.
  * This solution allows paying out existing (not newly minted) tokens. Triggering minting for user rewards is currently not supported, this functionality may be added in a future version.



