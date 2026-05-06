---
learn_hub_id: 44969820125972
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/44969820125972-How-Token-Ledgers-Work-on-the-Internet-Computer"
learn_hub_title: "How Token Ledgers Work on the Internet Computer"
learn_hub_section: "Tokens & Governance"
learn_hub_category: "How does ICP work?"
migrated: false
---

# How Token Ledgers Work on the Internet Computer

## 

The Internet Computer supports decentralized token ledgers that power balances, transfers, transaction history, and fees for both the native ICP token and other fungible tokens. This article explains how those ledgers work from a user perspective — what they are, how they record transactions, how fees work, and why different address formats exist.

## What Is a Ledger?

A **ledger** on the Internet Computer is a canister that defines who owns a token and permanently logs every transfer or balance change.

Unlike a traditional bank book kept privately by one company, ledgers on the Internet Computer are:

  * **Publicly verifiable** — anyone can see transaction history through explorers.
  * **Append-only** — once a transaction is recorded it isn’t removed.
  * **Transaction-centric** — each change to balances goes into a permanent history.



Ledgers ensure that token ownership and movement are transparent, reliable, and tamper-resistant. On the Internet Computer, there is no single global ledger. Each token is managed by its own ledger canister, which is controlled by the entity that deploys and governs that token. While multiple implementations exist, this article describes the DFINITY-maintained ledger suite, which is the most widely used and underlies the ICP

## Two Kinds of Ledgers and Addresses

The Internet Computer uses different ledger designs and address formats for different kinds of tokens. The key distinction users encounter is between the ICP Ledger and ICRC Token Ledgers.  


### ICP Token Ledger

The ICP Ledger is the native ledger used to manage ICP, the Internet Computer’s native utility token. ICP is the token you stake for governance, convert to cycles to pay for compute, or send to other users. The ICP Ledger uses a single, flat address format called an **AccountIdentifier** that uniquely identifies an account.

### ICRC Token Ledgers

While ICP itself is a token, it uses a dedicated native ledger. Most other fungible tokens on the Internet Computer use ledgers that follow the ICRC standard, which defines a common model for token balances, transfers, and addresses.   
  
These ledgers use a two-part account format:

  * A **principal** , which represents the identity of the holder (for example, a wallet).
  * An optional **subaccount** , which lets a holder manage multiple internal accounts under the same principal.



This account model gives wallets and services flexibility while keeping token handling consistent across different assets. 

## How Transactions Are Recorded

Each ledger maintains its own append-only transaction log. Transfers and other token adjustments are added to the end of this log and never removed or rewritten. 

This design allows wallets and explorers to present a clear transaction history—similar to a bank statement—while enabling the history to be efficiently verified and cryptographically certified.

As a result, users can reliably trace how their balance changed over time and independently verify past transactions.

##    
How Ledgers Scale: Archives and Indexes

As ledgers grow over time, they accumulate a large number of transactions. To remain scalable and efficient, Internet Computer ledgers use additional components behind the scenes.

### Archives

Older transaction blocks may be moved into archive canisters. Archives were originally introduced to work around storage limits in individual canisters, and today they are primarily used to allow ledgers to scale beyond a single subnet.  


From a user perspective:

  * The ledger still has a complete transaction history.
  * Older transactions remain accessible through explorers and tools.



Archiving is purely an internal optimization — it does not change balances, ownership, or the visibility of past transactions.

### Index Canister

Many ledgers are accompanied by an index canister, which is designed to make wallets and explorers faster and easier to use.

The index organizes transaction data by address, allowing wallets to:

  * Quickly fetch all transactions related to a specific account.
  * Display balances and history without scanning the entire ledger.
  * Load transaction lists efficiently, even for long-lived accounts.



While the ledger itself remains the authoritative source of truth, the index enables smooth user experiences in wallets and dashboards.

### How This Fits Together

  * The ledger records transactions and balances.
  * Archives store older transactions for scalability.
  * The index helps wallets and explorers retrieve data efficiently.



Together, these components ensure that ledgers on the Internet Computer remain transparent, scalable, and user-friendly — even as transaction history grows over time.  


## Transaction Fees: What They Are and Who Pays

Most token transfers on ledgers incur a small transaction fee. This helps deter spam and ensures that the cost of operating the ledger is shared by users making transfers.

  * The sender usually pays the fee when initiating a transfer.
  * Fees are either burned (permanently removed from the total supply) or collected in a designated fee account, depending on how the token’s ledger is configured.



Fees are generally small and predictable, and you’ll see them reflected in the final balance after a transfer.

## What This Means for You

As a wallet user or token holder on the Internet Computer, understanding ledgers helps you:

  * Know why and how your balance changes after transfers.
  * Use the correct address format for different tokens.
  * Trust that your transaction history is transparent and verifiable via explorers.



Whether you’re sending ICP, receiving a stablecoin, or inspecting your transaction history, ledgers are the foundational technology that makes token ownership and movement trustworthy on the Internet Computer.

