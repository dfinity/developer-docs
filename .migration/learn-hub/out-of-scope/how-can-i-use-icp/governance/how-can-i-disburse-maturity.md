---
learn_hub_id: 39755298701204
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/39755298701204-How-can-I-disburse-maturity"
learn_hub_title: "How can I disburse maturity?"
learn_hub_section: "Governance"
learn_hub_category: "How can I use ICP?"
migrated: false
---

# How can I disburse maturity?

## Overview

This tutorial is focused on NNS neurons. In SNS DAOs with voting rewards the concepts are very similar and the same tutorial might be helpful.

As you stake a neuron in the NNS and participate in governance, by voting directly or by delegating your voting power to others, your neuron receives voting rewards in the form of [maturity that can be _disbursed_ or _staked_.](https://learn.internetcomputer.org/hc/en-us/articles/34084120668692-Neurons#01JJ7BJX36NH538SCDQFHSJSVD)

## Disburse maturity

When you have at least 1.05 of maturity that is not staked, you can disburse it. This operation burns the maturity and schedules the minting of new ICP tokens. After 7 days, new ICP will be minted to the selected destination address. This process is subject to a maturity modulation function - refer to [Voting rewards & maturity](https://learn.internetcomputer.org/hc/en-us/articles/34084120668692-Neurons#01JJ7BJX36NH538SCDQFHSJSVD) for details.

For neurons managed by a Ledger hardware wallet, disburse maturity is under development. You can use spawn neuron in the meantime (see below).

### How to disburse the maturity of you neuron

#### Step 1: On the [staking page](https://nns.ic0.app/neurons/?u=qoctq-giaaa-aaaaa-aaaea-cai), navigate to the neuron whose maturity you want to disburse. 

Click **Disburse** in the **Maturity** section.

![](https://learn.internetcomputer.org/hc/article_attachments/39755329006356)

#### Step 2: In the form that opens, select the percentage of maturity to disburse and the destination account.

![](https://learn.internetcomputer.org/hc/article_attachments/39755298688660)

You can choose one of your associated accounts or manually enter any NNS account identifier. Manual input is available either as plain text or via QR code (found by clicking the **Receive** button on the wallet page).

![](https://learn.internetcomputer.org/hc/article_attachments/39755298688916)

For a given account, you can copy the account identifier on the account page as follows.

![](https://learn.internetcomputer.org/hc/article_attachments/39755298690196)

#### 

#### Step 3: After clicking **Disburse** , you see an overview where you can review and confirm the disbursement.

#### ![](https://learn.internetcomputer.org/hc/article_attachments/39755298692116)

#### Step 4: When a disbursement is in progress, a **View Active Disbursements** button appears in the **Maturity** section.

#### ![](https://learn.internetcomputer.org/hc/article_attachments/39755329012116)

This opens the **Active Disbursements** window, which shows all disbursements in progress, including their start time, destination address, and the amount of maturity being disbursed.

![](https://learn.internetcomputer.org/hc/article_attachments/39755329016084)

You cannot have more than 10 ongoing disbursements. If you have 10, you need to wait for at least one disbursement to finish before adding another.  


##    
Spawn new neurons

  
The old way of converting maturity into ICP utility tokens is via spawning the newly minted ICP into a neuron from where you can extract the ICP after 7 days.

In the NNS dapp you can only see the option to spawn for Ledger controlled neurons because disburse maturity is not yet supported by the Ledger device. Going forward, spawning neurons might be deprecated for all use cases. 

#### Step 1: In the NNS dapp, open the **Neuron Staking** section, then select the neuron that has reached the required maturity.

#### Step 2: Click **Spawn Neuron** , then follow the prompts to complete the process.  


