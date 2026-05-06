---
learn_hub_id: 34142993417108
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34142993417108-Voting-Rewards"
learn_hub_title: "Voting Rewards"
learn_hub_section: "NNS - Network Nervous System "
learn_hub_category: "How does ICP work?"
migrated: false
---

# Voting Rewards

Within the NNS, voting rewards are paid out to [neurons](https://learn.internetcomputer.org/hc/en-us/articles/34084120668692) who participate in governance by voting on [proposals](https://learn.internetcomputer.org/hc/en-us/articles/34084113508500).

Rewards are paid out on a regular basis (currently daily), based on an overall reward pool for that time period. Each neuron receives a pro-rata amount of that pool according to the voting power with which the neuron voted and in how many proposals the neuron participated.

We begin by outlining the long-term composition of the reward pool and then the daily calculation of voting rewards on a high-level. Finally, we describe detailed formulas for the pool and the rewards.

## Long-term: voting rewards over years

The voting reward function is depicted on the [ICP dashboard.](https://dashboard.internetcomputer.org/circulation)

In the first year after genesis, the NNS allocates 10% of the total supply to generate voting rewards. Note the term "allocates" rather than "mints", because rewards are not minted until they are spawned and the according reward neuron is disbursed. This allocation rate drops quadratically until it reaches 5% by year 8 after genesis. The formula for the annualized rewards as a percentage of total supply for the first 8 years is ` R(t) = 5% + 5% [(G + 8y – t)/8y]²`.

Like all parameters in the NNS, the reward rate and its schedule could be changed via NNS proposals.

Because the total supply of ICP is a dynamic system with deflation and inflation, it is impossible to predict what voting rewards will be on any given day or year in the future. It is relatively easy to predict what the percentage allocation rate will be months from now, but it is much harder to predict what the total supply will be both because of potential changes to the rate, and how often stakeholders will spawn their maturity.

## Short-term: voting rewards each day

Every day, rewards are granted by the network to each voting neuron. The percentage of those rewards received by each neuron depend on the following factors of a neuron:

  * Amount of ICP and maturity staked.
  * The neuron's voting power, which in turn depends on 
    * Length of dissolve delay.
    * Age of the neuron (time spent in a non-dissolving state).
    * Activity of the neuron (if a neuron neither votes directly nor sets or confirms following for too long it has an adjusted voting power).
  * Number of eligible proposals the neuron has voted on.



## Voting rewards details

  * Determination of the total reward pool:  

    * For a time t between G (genesis time) and G + 8y the annualized reward as a percentage of total supply is R(t) = 5% + 5% [(G + 8y – t)/8y]²
    * For a time t after G+8y, you have R(t) = 5%.
    * The total pool of voting rewards for a given day is calculated as ICP supply (total supply of ICP tokens on that day) * R(t) / 365.25.


  * Voting power of neurons: 
    * Only neurons with a dissolve delay of more than `neuron_minimum_dissolve_delay_to_vote_seconds`, defined in the [governance's parameters](https://learn.internetcomputer.org/hc/en-us/articles/34140518658068#h_01JJ2HA6H0DBRWPN13VA5P4F55), are eligible for voting. Currently this value is set to 6 months. The maximum dissolve delay is 8 years.
    * The voting power of a neuron is computed as `neuron_stake * dissolve_delay_bonus * age_bonus * voting_power_adjustment`
      * The neuron stake is the sum of staked ICP and staked maturity.
    * In particular the dissolve delay bonus and the age bonus are cumulative.
    * The dissolve delay bonus is a value between 1 and 2 and a linear function of the dissolve delay (capped at eight years).
    * The age bonus is a value between 1 and 1.25 and a linear function of the age of the neuron (capped at four years). A neuron starts aging when it enters a non-dissolving state. Aging is reset to 0 when a neuron enters a dissolving state.
    * Voting power adjustment is applied when a neuron hasn't voted, set following, or confirmed following in more than 6 months. The adjustment then applies a linear decrease of the voting power until it reaches 0 after 7 months of none of the above activities.
    * The voting power is calculated when the proposal is made, not when the ballot is cast.


  * Allocation of reward pool to neurons:
    * The reward pool is allocated in proportion to the voting power of proposals that are settled on this day multiplied by the reward weight of the according proposal category. 
      * Determine the set of proposals that are included in this reward period (typically a day): these are the proposals that are not yet settled with respect to voting rewards, and no longer open for voting.
      * The total voting power by neurons who were eligible for voting is added up.
      * Each neuron is rewarded in proportion to the voting power it contributed to these proposals multiplied by the reward weight of the according proposal category.
    * When a neuron is rewarded for voting, these rewards are recorded in an attribute of the neuron that is called maturity, which is not a tradable asset. If a user wants to generate income from maturity, they need to burn maturity to create new ICP via spawning a neuron which is a non-deterministic process. Find more information about this in [Spawning maturity & modulation](https://learn.internetcomputer.org/hc/en-us/articles/34084120668692).
  * **Reward Roll-Over Mechanism:** There may be days when no proposals within the NNS are settled. Since the distribution of rewards is tied to the ballots of settled proposals, no rewards are distributed on such days. Instead, the rewards that would have been distributed are carried over to the next day. In more detail the process works as follows:
    * For each day, the NNS determines the total amount of rewards available for distribution, based on the total token supply and the reward function, as mentioned above.
    * If no proposal is settled on a given day, the rewards allocated for that day remain undistributed and are rolled over to the following day. This means that on the next day, the available rewards consist of both the newly accrued rewards and the undistributed rewards from the previous day.
    * Whenever at least one proposal settles, the accumulated rewards are distributed accordingly. If no proposal settles again, the rewards continue to roll over.



### Example

#### Neuron's voting power

If a neuron has a stake of 60 ICP and 40 staked maturity, it has a combined stake of 100.  
Then, let's assume a dissolve delay of 8 years, which gives it a dissolve delay bonus of 2.  
Also, assume a neuron age of 2 years, which gives it an age bonus of 1.125. Finally, assume the neuron regularly votes directly and has no voting power adjustment (so the adjustment is 1).  
All together, this neuron then has a voting power of `100 * 2 * 1.125 * 1 = 225`.

#### Rewards distribution

If on a single day the NNS has generated 1000 maturity in total rewards (see below for more on how this is computed), and there were 10 proposals submitted for which only two neurons were eligible to vote on, and:

  * Neuron A has a voting power of 20, and voted on all 10 proposals.
  * Neuron B has a voting power of 80, and voted on all 10 proposals.



Then the 1000 maturity would be divided between these two neurons by their proportional voting power:

  * Neuron A with voting power of 20, gets 20% of the total = 200 maturity.
  * Neuron B with voting power of 80, gets 80% of the total = 800 maturity.



If either neuron had only voted for X% of those 10 proposals (weighted by the reward weight of the according proposal category), it's reward would be decreased to X% of its maximum eligibility.

If on a single day there were 10 proposals, but a neuron only voted for five of them,  
that neuron would only receive 50% of its rewards for which it is eligible that day. If the five proposals the neuron voted on had a reward weight of two, it would have a `weight_of_proposal_votes = 5 * 2`, while the `weight_of_all_proposals = 5 * 2 + 5 * 1`, therefore it would receive `(5 * 2) / (5 * 1 + 5 * 2) = 66%` of the rewards for which it is eligible that day.

