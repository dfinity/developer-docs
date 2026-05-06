---
learn_hub_id: 34088279488660
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34088279488660-Tokenomics"
learn_hub_title: "Tokenomics"
learn_hub_section: "SNS - Service Nervous System"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Tokenomics

Each SNS can be individually configured with [parameters](https://learn.internetcomputer.org/hc/en-us/articles/34142964565396) that define, among other things, the tokenomics of an SNS and the dapp that it governs. 

## What is tokenomics?

A token is a digital asset on a blockchain. Tokenomics describes the economics of a token system on a blockchain. It is a game changer for decentralized autonomous organization (DAOs) compared to traditional apps running on a Web 2.0 infrastructure, because it enables the introduction of new incentive systems and use cases. Tokenizing a DAO allows, for instance, that anyone in the world can purchase a DAO's tokens and thereby contribute to the initial funding for the DAO. Moreover, tokens can be tranferred to early adopters and active users, which will help attract users.

Tokenomics covers a wide range of topics, such as

  * How tokens are used.
  * Allocation of tokens to participants of the DAO.
  * Incentive mechanisms, e.g., providing tokens to early adopters.
  * Development of token supply & demand over time. This includes creating new tokens (minting) and destroying tokens (burning).



### Supply and demand

The supply of a token is defined as the amount which token holders are willing to sell at a given price. Likewise, token demand is the amount of tokens which buyers are willing to buy for a given price. The following graph depicts the typical relationship between the supply, demand and price for an example good, which in our case could be a token priced in USD.

![graph_supply_demand.png](https://learn.internetcomputer.org/hc/article_attachments/34146812547476)

_(Image source: epthinktank.eu)_

Typically supply increases with increasing prices. For example, if the price of Bitcoin increases, typically more Bitcoin holders will be willing to sell at the higher price on the market. On the other hand, demand typically decreases with increasing prices. The intersection of the two curves determines the so-called equilibrium price, depicted by P_2 in the picture.

How does it end up at the equilibrium price?

  * If P_1 > P_2: There is a surplus, i.e., more supply than demand. This creates downward pressure on the price.
  * If P_3 < P_2: There is a shortage, i.e., more demand than supply. This creates upward pressure on the price.



### Token emission over time

A token emission schedule defines the rate at which new tokens are minted over time. The design of a token emission schedule is crucial for the success of a DAO.

On the one hand, token emissions generate _liquidity_ of tokens. It should be ensured that sufficient amounts of tokens are available from the start so that people can participate in activities on the DAO.

On the other hand, token emissions contribute to the token supply and hence influence the token price. Therefore, limiting the token emission schedule can have a positive impact on the token price.

As a consequence, emission schedules are typically designed as follows: Initially, high amounts of tokens are issued to kickstart the token economy and to incentivize early participation. Over time, the marginal increase of the token supply goes down to limit the impact on the token price and to create scarcity, i.e., limited availability.

### Token use cases

Tokens can cover many different (potentially overlapping) use cases. For example

  * **Governance** : tokens may give holders the right to vote on proposed changes of a DAO.  
To incentivize long-term thinking and commitment, systems often require staking of tokens. Staking means that token holders lock up a portion of tokens for a period of time. In exchange, stakers can earn rewards.
  * **Currency** : a form of digital money that functions as a medium of exchange, unit of account, and store of value.
  * **Operations** : facilitate operations on the blockchain, for example to cover resource consumption with fees to store information and execute transactions.
  * **Decentralized Finance (DeFi)** : financial functions (e.g. lending, saving, trading) on a blockchain. DeFi tokens incentivize users to facilitate these functions, e.g. providing liquidity.
  * **Social Finance (SoFi)** : tokens underpinning social networks. This includes the tokenization of popularity & reputation. For example participants could receive tokens if they have a lot of followers or views.



## Tokenomics aspects to consider in a DAO

In a DAO, (at least) the following aspects are important for tokenomics.

### Token utility

Define concisely for which use cases the token (or several tokens) of the DAO will be used (see prior section on use cases). In particular, it should be considered how the token(s) could be used for

  * Participation in governance.
  * Rewarding active participation in services offered by the DAO.
  * Rewarding contributions to the growth of the DAO.



### Initial token allocation

For the initial token allocation, i.e., defining which groups/accounts should receive how many tokens, consider the following main blocks.

  * **DAO treasury** : these are tokens which are at the disposition of the DAO. They can be used according to predefined rules defined in the protocol of the DAO or distributed ad-hoc subject to voting. For example, they might be used for community bounties & user rewards.
  * **Decentralization swap** : distribution to the community via an initial or subsequent decentralization swap.
  * **Seed funders** : distribution to funders (if you choose to have them) who invested in the project prior to the launch of the DAO.
  * **Funding development team** : developers who created the initial version of the DAO.



To facilitate a healthy DAO from the start the initial allocation should ensure the following.

  * At least as many tokens are allocated to the decentralization swap as granted to the seed funders and the funding development team (enforced at the time of SNS initialization).
  * A significant part of the tokens is allocated to the DAO treasury, allowing the treasury to incentivize and reward users over time.



### Voting power and decentralization

The voting power should be distributed over many, independent entities such that there is not one single or a few entities that can decide by themselves how the DAO evolves.

As mentioned above, participation in governance typically requires the staking of tokens for a certain amount of time. To incentivize long-term thinking and commitment, DAOs can provide more voting power to those token holders who stake for a longer time period. The configuration of the voting power should also consider the (initial) allocation of tokens, to ensure decentralization from the start. For example, it should be ensured that the voting power of the funding developer team is below 50% of the total voting power.

Find more information on how to configure [voting rewards](https://learn.internetcomputer.org/hc/en-us/articles/34143058069396).

### Are SNS tokens inflationary or deflationary?

This depends on the specific SNS configuration. An SNS DAO can have both inflationary and deflationary pressures.

Inflationary:

  * An SNS DAO can be set up to mint voting rewards for people who participate in governance (similar to ICP).
  * An SNS DAO can mint tokens if voted on by SNS token holders. For example: a game mints 2% of total supply each year and distributes it among players.



Deflationary:

  * SNS tokens are burnt for every transaction.
  * Locking SNS tokens into neurons removes them from circulation. While not technically deflation, it acts as a deflationary pressure.



## Additional resources

On [this page ](https://wiki.internetcomputer.org/wiki/How-To:_SNS_tokenomics_configuration)you will find further material enabling teams to choose a suitable tokenomics set-up for their SNS DAO. It provides documentation links to SNS tokenomics key concepts as well as a SNS  
tokenomics tool.

