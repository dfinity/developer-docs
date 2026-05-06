---
learn_hub_id: 34090810571284
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34090810571284-Tokenomics"
learn_hub_title: "Tokenomics"
learn_hub_section: "Tokens & Governance"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Tokenomics

## The ICP utility token

The Internet Computer Protocol (ICP) makes use of a utility token called ICP. This token is used as follows in the protocol: First, any ICP holder can participate in the [governance of the Internet Computer](https://learn.internetcomputer.org/hc/en-us/articles/33692645961236) by staking ICP and then vote on or submit governance proposals and earn [voting rewards](https://learn.internetcomputer.org/hc/en-us/articles/34142993417108). Second, ICP can be transformed into cycles and pay for Internet Computer resources. Third, ICP tokens are used to reward node providers who operate node machines that contribute to the Internet Computer. Last but not least, ICP can be used to participate in [token swaps of decentralized autonomous organizations (SNS DAOs)](https://learn.internetcomputer.org/hc/en-us/articles/34141180048404) on the IC. These four protocol use cases are eloborated on in the following. However, ICP can of course also be used as a medium of exchange to pay for goods and services such as NFTs, subscriptions, etc.

## Governance and voting rewards

Anyone can participate in the governance of ICP by staking ICP tokens in so-called [neurons](https://learn.internetcomputer.org/hc/en-us/articles/34084120668692). Neuron holders can vote on proposals, which are suggestions on how ICP should be changed. The neurons’ voting power for decision making is proportional to the number of ICP staked inside and some other characteristics of the neuron such as the staking duration. The increased voting power for neurons with longer staking time creates an incentive to vote on proposals with the aim of driving decisions that maximize the value of their staked ICP over the long term.

For participation in governance, the voting neurons' maturity increases. Maturity can then be used to mint ICP. Every day, the IC calculates a [voting reward](https://learn.internetcomputer.org/hc/en-us/articles/34142993417108) pot according to a schedule, which it then divides among all eligible neurons according to their relative voting power and participation. The schedule for voting rewards is designed to incentivize early adoption: Initially at genesis, maturity corresponding to 10% of the total supply of ICP is distributed in voting rewards on an annualized basis. Over the course of eight years, this number falls to 5%.

As the daily reward amount is independent of the overall amount of staked ICP in the system and is distributed to neurons in proportion to their voting power and ratio of the proposals they voted on. This mechanism creates a natural incentive to stake ICP and participate in governance: the lower participation is the higher the rewards are. A significant part of staked ICP is staked for the maximum time of 8 years expressing the long-term commitment of these stakers. For current estimates of annualized voting rewards, refer to the ICP [Dashboard’s Governance page](https://dashboard.internetcomputer.org/governance).

## Cycles as fuel for computation and other resources

ICP can be used to pay for the usage of resources. More specifically, ICP tokens can be converted to **cycles** (i.e., burned), and these cycles are used by developers to pay for installing smart contracts, called canisters on ICP, and for the resources that canisters use (storage, CPU, and bandwidth). The cycle price is pegged to a basket of fiat currencies, so the conversion rate ICP to cycle fluctuates with the market price of ICP. Hence the cost to developers of acquiring fuel to run their application is predictable.

In this so-called _reverse gas model_ of ICP, developers pre-pay costs by loading canisters with computation cycles. As a consequence, users can interact with a decentralized application (dapp) without needing tokens or dealing with seed-phrases. As cycles are stable in cost, developers know in advance how much they will need to spend on computation, storage, and other resources.

## Node provider rewards

ICP tokens are used to reward node providers—these are the entities that own and operate the computing nodes that run the Internet Computer Protocol. Node provider rewards are paid via newly minted ICP. The rewards they receive are fixed per node and tightly related to their actual costs. It depends on two parameters:

  1. The location of the node, as hosting prices differ between locations.
  2. The type of the node, i.e., the hardware and connectivity specifications.



To cover the investment and running cost of nodes, which occur in fiat currency terms, node provider rewards are specified in XDR, and are converted into ICP based on the average exchange rate over the last 30 days.

### How the average exchange rate is computed

The cycles minting canister fetches the ICP/XDR rate every 5 minutes from the exchange rate canister, which fetches the rates from various external sources. The cycles minting canister also stores the start-of-day rates (UTC).

The 30-day-moving average uses the start-of-day rates for the past 30 days, this can be [verified in the code](https://github.com/dfinity/ic/blob/4344a924bcb12bc3d1510805dbb37391179df887/rs/nns/cmc/src/main.rs#L930). The current conversion rate can be viewed on the [ICP dashboard](https://dashboard.internetcomputer.org/network), or pulled automatically directly from the [CMC metrics](https://rkp4c-7iaaa-aaaaa-aaaca-cai.raw.icp0.io/metrics).

## ICP ecosystem (SNS launch)

The SNS framework enables developers to create an [SNS DAO](https://learn.internetcomputer.org/hc/en-us/articles/34084394684564) and to transfer control of their dapps unter the decentralized control of that DAO.

As part of a so-called decentralization swap during an [SNS launch](https://learn.internetcomputer.org/hc/en-us/articles/34141180048404), users can commit some ICP to a new SNS DAO. In return, when the decentralization swap is complete, these users will receive tokens of the DAO with everyone paying the same price. Developers can specify a time period and minimum & maximum funding target of ICP to be collected, which determines when the swap is over.

The ICP funds raised by the decentralization swap are retained within the reserves of the fully autonomous DAO, rather than being forwarded to the original developers of the dapp or service. These funds can be used to pay for future computation needs of the dapp and also to pay code bounties for future dapp enhancements.

The SNS framework acts like rocket fuel for the ICP ecosystem. It provides easy and transparent access to exciting Web3 projects and channels funds to productive usage of the platform.

## Development of total supply

ICP has inflationary and deflationary mechanisms. Governance participants can convert voting rewards to newly minted ICP. Also, node providers receive rewards in the form of newly minted ICP tokens. On the other hand, ICP is converted to cycles (i.e., burned) in order to pay for computation and storage. This is depicted in the following picture.

## ![deflation_inflation.png](https://learn.internetcomputer.org/hc/article_attachments/34277843713940)

## 

In summary, there are the following mechanisms.

Deflationary mechanisms:

  * Minting cycles to pay for compute and storage burns ICP to create cycles.
  * Transaction fees for the ICP token.
  * Fees for failed proposals of neurons; note that this only happens at disbursement or merging of neurons, so accumulated fees can persist for a while before visible in the total supply.



Inflationary mechanisms:

  * Node providers are paid by minting ICP.
  * [Voting rewards](https://learn.internetcomputer.org/hc/en-us/articles/34142993417108), once spawned and converted to ICP.



