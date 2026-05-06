---
learn_hub_id: 42529262055700
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/42529262055700-How-can-I-import-ICRC-tokens"
learn_hub_title: "How can I import ICRC tokens?"
learn_hub_section: "Governance"
learn_hub_category: "How can I use ICP?"
migrated: false
---

# How can I import ICRC tokens?

The [NNS dapp](https://nns.ic0.app/) focuses on providing a simple user interface where community members can interact with different on-chain governance systems deployed on the Internet Computer.

If you want to hold tokens that are not in the default provided list, you can _import_ the token to your wallet. This is possible for any token that supports ICRC-1, which includes all ICRC-2 and ICRC-3 tokens. As a token is uniquely defined by its associated ledger, the first step in this process is to find the ledger's ID.

## How do I find the relevant token ledger?

The process of importing a token simply saves a list of token ledger canister IDs on your account, letting the NNS dapp know which tokens to fetch. Therefore, to import a token, you need the associated ledger canister ID. 

In addition, the NNS dapp relies on index canisters to display transaction histories. If your token has an index canister, you can also import the index canister ID, which will allow you to see the transaction history in the NNS dapp too. 

The NNS dapp accepts any token that supports the ICRC-1 standard. A token can pretend to be another token, so make sure to get the ledger canister ID from reputable places.

There are several ways to find ledger canister IDs of ICRC-1 tokens. The tutorial video above mentions two. This is a more comprehensive list.

  * [ICPSwap](https://info.icpswap.com/swap): Curated list of tokens traded on ICPSwap updated by the ICPSwap SNS DAO.
  * [ICP Tokens](https://www.icptokens.net/): Curated list of tokens traded on ICP-based DEXs updated by ICP Tokens.
  * [ICP Dashboard](https://dashboard.internetcomputer.org/chain-fusion): List of all chain-key tokens (under Chain Fusion menu option) updated automatically.
  * [nftGeek](https://t5t44-naaaa-aaaah-qcutq-cai.raw.icp0.io/tokens): Curated list of tokens traded on ICP-based DEXs updated by nftGeek.
  * [CoinMarketCap](https://coinmarketcap.com/view/internet-computer-ecosystem/): The ICRC tokens that are listed on CoinMarketCap provide their ledger canister ID under 'Contract'.
  * [CoinGecko](https://www.coingecko.com/en/categories/internet-computer-ecosystem): The ICRC tokens that are listed on CoinGecko provide their ledger canister ID under 'Contract'.



## How do I import ICRC tokens?

First, find the ledger canister ID of the token you want to import to your NNS dapp wallet. The list above covers most tokens deployed on the Internet Computer. Once you have its ledger canister ID, you may optionally look for its index canister to display the transaction history.

Importing an index canister is completely optional. Many popular tokens do not have index canisters.

#### Step 1: Sign into the NNS dapp and navigate to Tokens. In the table menu, click 'Import Token'.

![](https://learn.internetcomputer.org/hc/article_attachments/42531028276628)

If you want to hide the tokens you don't hold for better visibility, you can click the settings button at the top right corner of the table, and enable Hide zero balances.

#### Step 2: Paste the ledger canister ID and optionally the index canister IDs to the corresponding input fields. 

If you don't provide the index canister ID now, you can add it any time in the future.

![](https://learn.internetcomputer.org/hc/article_attachments/42531028279956)

#### Step 3: Review and confirm that this is the token you wish to import. By clicking the link you can see the canister on the ICP dashboard.

####  ![](https://learn.internetcomputer.org/hc/article_attachments/42531028282132)  


Once your token was successfully imported, you can send tokens to your account.

![](https://learn.internetcomputer.org/hc/article_attachments/42531028291348)

Going back, you see all imported tokens in the Imported Tokens table.

![](https://learn.internetcomputer.org/hc/article_attachments/42531056914708)

##    
How do I remove an imported token?

You can add and remove tokens any time. 

Removing a token doesn't remove the asset itself. If you remove a token that has a balance above 0, you can always re-import it, and the asset will be accessible. However, the NNS dapp will not remember which tokens you imported and removed again, so you will need to remember any token you intend to re-import in the future.

![](https://learn.internetcomputer.org/hc/article_attachments/42531028295188)

