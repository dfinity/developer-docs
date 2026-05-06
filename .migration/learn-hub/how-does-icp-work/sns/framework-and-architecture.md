---
learn_hub_id: 34140764336788
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34140764336788-Framework-and-Architecture"
learn_hub_title: "Framework and Architecture"
learn_hub_section: "SNS - Service Nervous System"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Framework and Architecture

## SNS framework

The [SNS](https://learn.internetcomputer.org/hc/en-us/articles/34084394684564) operates as a framework within the Internet Computer Protocol (ICP). This means the ICP is responsible for the SNS functionality and maintains the code for the SNS canisters. More concretely, this means that the [NNS](https://learn.internetcomputer.org/hc/en-us/articles/33692645961236) community maintains the code that is run by all SNSs - it approved the original SNS canisters' code and continuously approves new improved SNS versions.

### Advantages of the framework

The fact that SNSs are built into the platform makes it easy for SNS DAO communities to maintain the code and increases trust, as NNS voters verify the code. It is also easy for users to verify different SNS DAOs as they all run the same, pre-approved code. Because all SNSs share a common framework, users familiar with one SNS DAO will find it easy to use another DAO.

### SNS Wasm modules canister (SNS-W)

The Wasms run by SNS canister are approved by the NNS and published on an NNS canister called the [SNS wasm modules canister (SNS-W)](https://dashboard.internetcomputer.org/canister/qaa6y-5yaaa-aaaaa-aaafa-cai). This means that all the SNS DAOs run code that is pre-approved by the NNS and they all run the same code (some of the SNS might be a few versions behind).

The SNS framework canisters are published in a unique order on SNS-W, defining different SNS versions. 

### Upgrading SNS framework canisters

Historically, there are different options how an SNS DAO can be updated to a new version that was pre-approved by the NNS and published on the SNS-W.

  * An SNS community can decide to update the SNS framework by submitting a proposal that will update the SNS to the next version. In this case, the DAO will automatically fetch the new version from SNS-W and update one canister (versions always only differ by one canister).
  * An SNS community can choose to update to a particular target version. If an SNS is several versions behind, this is particularly useful as it has the effect that with the adoption of just one proposal, the DAO applies all required updates in sequence until the target version is reached. Compared to the first option, this requires less proposals and thus less time and effort for SNSs to catch up to the latest version.
  * Finally, an SNS community can choose to always automatically upgrade to the latest available versions approved by the NNS. This can be done by an appropriate choice in the [DAO settings](https://learn.internetcomputer.org/hc/en-us/articles/34142964565396). All newly created SNSs have this enabled by default.



For more details about the proposals that can be used to trigger these upgrades or change these settings, refer to the [developer documentation](https://internetcomputer.org/docs/building-apps/governing-apps/managing/making-proposals). 

### SNS subnet

The SNS DAOs are hosted on the [SNS subnet](https://dashboard.internetcomputer.org/subnet/x33ed-h457x-bsgyx-oqxqf-6pzwv-wkhzr-rm2j3-npodi-purzm-n66cg-gae). Since this subnet exclusively hosts SNSs, this simplifies the verification for end users: users can simply verify that an SNS is running on the SNS subnet and infer that the underlying code has been approved by the NNS community as explained in the previous paragraph.

## SNS canisters

Each SNS DAO consists of a set of canisters smart contracts that run Wasm code. The most central canisters closely resemble the NNS (NNS) which is the DAO that governs the full ICP.

The SNS consists of the following canisters:

  * The governance canister.
  * The ledger canister and archive canisters.
  * The index canister.
  * The root canister.
  * The decentralization swap canister.



### SNS governance canisters

The _governance canister_ defines who can participate in governance decisions and automatically triggers the execution of these decisions. It stores [proposals](https://learn.internetcomputer.org/hc/en-us/articles/34146571133204) that are suggestions on how to evolve the dapp that the SNS governs and [neurons](https://learn.internetcomputer.org/hc/en-us/articles/34084687583252) that define who the governance participants are. Neurons facilitate stake-based voting as they contain staked SNS tokens. When a proposal is adopted, the governance system automatically and autonomously triggers the execution of the proposal in the form calling a defined method. In most cases, these decisions are therefore executed fully onchain.

### SNS ledger canister with archive and index

The _ledger canister_ implements the [ICRC-1 standard ](https://github.com/dfinity/ICRC-1)and contains a unique token that is different for each SNS. These tokens are called _SNS tokens ._ "SNS token" may refer to one specific token of one SNS or to all these kinds of tokens, depending on the context. In each SNS, this SNS's ledger stores which accounts own how many SNS tokens and the history of transactions between them.

To keep the full ledger history even though a canister has limited memory, the ledger canister spawns _archive canisters_ that store the ledger block history.

Moreover, wallets and other frontends will need to show all transactions that are relevant for a given account. To facilitate this and ensure that not every frontend has to implement this themselves, the _index canister_ provides a map of which transactions are relevant for a given account.

### SNS root canister

The _root canister_ is responsible for upgrading the other SNS canisters and the dapp canisters that the SNS governs.

### SNS (decentralization) swap canister

The _decentralization swap canister_ , or swap canister for short, is the main canister involved in the [SNS launch](https://learn.internetcomputer.org/hc/en-us/articles/34141180048404). Users can provide ICP tokens to the swap and, if the swap is successful, they get staked SNS tokens (in SNS neurons) in return. Hence, the ICP and the SNS tokens are "swapped".  
This facilitates that 1) the SNS can collect initial funding and 2) the distribution of neurons and thus of voting power to many different participants, which makes the governance decentralized.

## Nervous system parameters for individual settings

Individual SNSs can nevertheless be customized by choosing settings, called nervous system parameters, that can be configured to realize different forms of voting and tokenomics. Refer to [SNS DAO settings](https://learn.internetcomputer.org/hc/en-us/articles/34142964565396) for more information.

