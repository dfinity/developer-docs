---
learn_hub_id: 34084394684564
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34084394684564-SNS-Service-Nervous-System"
learn_hub_title: "SNS - Service Nervous System"
learn_hub_section: "SNS - Service Nervous System"
learn_hub_category: "How does ICP work?"
migrated: false
---

# SNS - Service Nervous System

The Service Nervous System (SNS) framework enables creating and maintaining decentralized autonomous organizations (DAOs) to govern dapps. An SNS consists of an open, permissionless governance system that can control a dapp, and of a built-in governance token that is unique to each SNS.

Any dapp on the Internet Computer can be handed over to an SNS with the result that the dapp is owned and controlled by a community.

## What is a Decentralized Autonomous Organization (DAO)?

A DAO is an organization whose members – typically holders of the governance token – collectively decide how the organization or the product evolves. Example scenarios:

  * 10'000 token holders each deposit crypto into a smart contract and vote on what to purchase with the total.
  * 1 million token holders control a decentralized version of Twitter where token holders propose and vote on feature updates.



A DAO can take the role of carrying out community-driven decisions on when and how to update the code that shapes the organization or product.

## What is a Service Nervous System (SNS)?

An SNS is a powerful software framework that enables a DAO community to govern smart contracts and decentralized apps (dapps) running on the Internet Computer completely onchain.

  * A dapp controlled by an SNS DAO is governed by SNS token holders submitting and voting on onchain proposals. No one developer or group of people controls the dapp, rather the dapp is controlled by voting via tokens.
  * There can be many SNSs on ICP. Any developer can hand over the control of their dapp to an SNS DAO. Doing so gives control to DAO token holders.



Generally, for each dapp that is under SNS DAO control, there is one SNS DAO. The SNS DAO works very similarly to the [NNS DAO that governs ICP. ](https://learn.internetcomputer.org/hc/en-us/articles/33692645961236)DAO participants are called [neurons](https://learn.internetcomputer.org/hc/en-us/articles/34084687583252) and all neurons can suggest and vote on suggestions how to evolve the dapp that are called [proposals](https://learn.internetcomputer.org/hc/en-us/articles/34084705977876). 

### What can be controlled by an SNS DAO?

The core purpose of an SNS DAO is to govern a dapp, i.e., decide on the code of that dapp, including configuration, data, and frontend. Moreover, the SNS DAO makes decisions on the DAO itself, for example on how to change the DAO [tokenomics](https://learn.internetcomputer.org/hc/en-us/articles/34088279488660). More technically, there are [native proposals](https://learn.internetcomputer.org/hc/en-us/articles/34146571133204) that are common to all SNSs, such as proposals to upgrade the DAO-controlled dapp canisters, change governance rules, or making transfers from the treasury to open a liquidity pool on a DEX. In addition, each SNS can define [custom proposals](https://learn.internetcomputer.org/hc/en-us/articles/34146571133204) that are specific to the dapp's needs. A proposal can be defined to call any method on any canister. This allows, for example, to define proposals that orchestrate upgrades of dapps with many canisters.

### SNS framework

The[ SNS framework](https://learn.internetcomputer.org/hc/en-us/articles/34140764336788) is built into ICP and allows anyone to hand over their dapp to an SNS DAO. It comes with a pre-defined path of how an SNS is launched and results in a SNS DAO instance. Each SNS includes a stake-based governance system, that orchestrates decision making and changes, and a ledger that defines a unique token for each SNS.

The framework ensures that all SNSs run code that is trustworthy and that all SNSs run the same code. This not only simplifies verification that the code is correct and does what it should but also has the advantage that DAOs are more user-friendly - a user that used one SNS will likely have a good intuition how to participate in a second SNS. Despite all SNSs using the same code, each SNS community can choose their own unique tokenomics and governance rules by parameters that can be set for each SNS DAO. Refer to [SNS framework and architecture](https://learn.internetcomputer.org/hc/en-us/articles/34140764336788) for more details.

### SNS launch

As mentioned above, the SNS framework includes a process that defines how to launch an SNS. To decentralize a dapp, the dapp is handed over to the Internet Computer together with an NNS proposal defining the details of the SNS launch and the initial configuration of the SNS DAO to be created. On a high level, the following things happen during a successful SNS launch:

  * the canisters for a new SNS DAO are created and installed
  * the governance control is distributed to users in a decentralization swap that 
    * collects initial treasury funds in the form of ICP
    * gives participants a share of the governance control in the form of SNS neurons
  * the dapp's control is handed over to the new SNS



Refer to the article on [SNS launch](https://learn.internetcomputer.org/hc/en-us/articles/34141180048404) for more details about these events and to [SNS decentralization swap](https://internetcomputer.org/docs/current/developer-docs/daos/nns/using-the-nns-dapp/nns-dapp-additional-features#sns-decentralization-swaps) for a tutorial on how you can participate in an SNS launch.

### SNS governance

After an SNS launch, the control of both the dapp it governs and the SNS canisters shifts from a single entity (like the developer) to the decentralized SNS community. This community then determines the future of the dapp's functionality, the behavior of the SNS canisters, and any modifications to either. Any changes to the dapp and the SNS can only be made by [proposals](https://learn.internetcomputer.org/hc/en-us/articles/34084705977876) and are decided on by the SNS's [neurons](https://learn.internetcomputer.org/hc/en-us/articles/34084687583252).

The initial neuron holders include holders of initial neurons (e.g., used for the original developer team of the dapp) as well as the participants of the swap. Over time, more users may stake SNS tokens and participate in governance.

### Resources

There are different places where you can learn more about existing and upcoming SNS launches. For example, you can find all launched SNSs on the [Internet Computer dashboard](https://dashboard.internetcomputer.org/sns) and you can find and participate in ongoing launches on the [NNS dapp launchpad](https://nns.ic0.app/launchpad/).

