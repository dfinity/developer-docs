---
learn_hub_id: 34141180048404
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34141180048404-Launch"
learn_hub_title: "Launch"
learn_hub_section: "SNS - Service Nervous System"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Launch

## What is the purpose of the launch?

The SNS launch not only creates the SNS, but one of its main purposes is to decentralize the control of an SNS and thereby of the dapp that the SNS governs. To achieve this, new tokens must be distributed to a large community to ensure proper decentralization of the voting power.

During an SNS launch, a developer hands over their dapp to the NNS, proposing to the NNS to create an SNS and start a decentralization swap for it. The decentralization swap collects ICP from participants and distributes the voting power of the SNS among participants by swapping the ICP for (staked) SNS tokens.

## What are the steps of an SNS launch? 

If a developer team wants to hand over their dapp on ICP to an SNS, in a first step they propose this in an NNS proposal defining the details of the SNS launch and the initial configuration of the SNS DAO to be created. 

Note that such a proposal often requires some technical as well as non-technical preparation, such as thorough testing, getting the community on board, etc. For more information how to prepare and propose an SNS launch, refer to the [SNS developer documentation](https://internetcomputer.org/docs/current/developer-docs/daos/sns/).

If the NNS community approves this proposal, the steps below to launch an SNS are then executed fully automatically.

  * The NNS creates a new set of SNS canisters and initializes them as defined in the NNS proposal. 
    * The initial parameters define the initial settings of the SNS and the token distribution. Some initial neurons can be assigned to some predefined entities, such as the original developer team that built the dapp. It is also defined how many tokens are initially in the treasury and how many tokens are distributed to the community for decentralizing the dapp.
  * The NNS hands over the dapp's control to the newly created SNS.
  * The NNS starts a decentralization swap for the SNS. The purpose of this is to raise initial funds for the DAO and to decentralize the voting power. This is done by an open swap where users can contribute ICP tokens as initial funding and get in return (staked) SNS tokens. See the next Section for more details.
  * The NNS proposal can optionally define that the SNS would like contributions from the [Neurons' Fund (NF)](https://learn.internetcomputer.org/hc/en-us/articles/34084179554196).
  * If the decentralization swap is successful, the SNS turns into a fully functional DAO. Otherwise, all assets such as the canisters comprising the dapp and the tokens collected from participants are returned to the original holder.



### Initial decentralization swap

A decentralization swap is run entirely onchain. Every aspect of the swap, from its initiation to execution, is completely decentralized and not controlled by any centralized entity.

An initialization swap proceeds as follows.

  * The swap is set up at the start with a defined amount of SNS tokens to be distributed publicly. For each SNS that is launched, this is a new, unique token associated with this SNS.
  * During the decentralization swap, participants can send ICP to the swap canister.
  * At the end of the swap, the collected ICP are exchanged for the SNS tokens. The participants receive staked SNS tokens. The ICP tokens collected in the swap will become the treasury of the new SNS DAO. 
    * Each swap participant will receive their portion of the pool of SNS tokens, pro-rated by their share of the overall number of ICP contributed. Note that the final price of SNS tokens isn't known at the time of the decentralization swap, as it is dependent on the total amount of ICP swapped. However, one can calculate the minimum and maximum price based on the minimum and maximum ICP that the swap accepts, which is defined in the initial parameters. Refer to the next paragraph for some examples.
    * Participants receive a basket of [neurons](https://learn.internetcomputer.org/hc/en-us/articles/34084687583252). These neurons hold SNS tokens and therefore a share of the DAO's voting power.




After a successful decentralization swap, SNS tokens are owned and the SNS is governed by a community.

#### Some examples

Let's consider some examples how many SNS tokens one would get in neurons when participating in a swap.

  * The decentralization swap distributed 1000 SNS tokens and 500 ICP tokens were collected during the decentralization swap. The exchange rate is 2:1 and each participant would get 2 SNS tokens for each ICP token they contributed.
  * The decentralization swap distributed 5000 tokens for 1000 ICP. You participated with 10 ICP. This means you will have 50 SNS tokens, each worth 0.2 ICP.
  * The decentralization swap distributed 1 million tokens for 500,000 ICP. You participated with 200 ICP. This means you will have 400 SNS tokens, each worth 0.5 ICP.
  * The decentralization swap distributed 100 tokens for 10,000 ICP. You participated with 5 ICP. This means you will have 0.05 SNS tokens, where a full token would be worth 100 ICP.



