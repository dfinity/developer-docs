---
learn_hub_id: 46381576634772
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/46381576634772-How-to-Inspect-an-SNS-and-Its-Dapp-Canisters"
learn_hub_title: "How to Inspect an SNS and Its Dapp Canisters"
learn_hub_section: "SNS - Service Nervous System"
learn_hub_category: "How does ICP work?"
migrated: false
---

# How to Inspect an SNS and Its Dapp Canisters

This guide explains how to discover and inspect all canisters that belong to a Service Nervous System (SNS), including governed dapps.

You can interact with canisters in two ways:

  * **Internet Computer Dashboard** : [https://dashboard.internetcomputer.org](https://dashboard.internetcomputer.org/)[](https://dashboard.internetcomputer.org/)

  * **DFX command line tool** : <https://internetcomputer.org/docs/current/developer-docs/build/install-upgrade-remove>

[](https://internetcomputer.org/docs/current/developer-docs/build/install-upgrade-remove)




* * *

## 1\. Start from the SNS Root Canister

Each SNS has a **root canister** that controls the SNS system.

### Verify the SNS root

All deployed SNS root canisters are listed in the SNS-W canister:

**SNS-W canister ID:**  
`qaa6y-5yaaa-aaaaa-aaafa-cai`

Call:

`list_deployed_snses`

**DFX example:**
    
    
    dfx canister --network ic call qaa6y-5yaaa-aaaaa-aaafa-cai list_deployed_snses '(record {})'
    

In the Dashboard:

  1. Search for the SNS-W canister ID

  2. Click `list_deployed_snses`

  3. Click **Call**




* * *

## 2\. List All SNS and Dapp Canisters

From the SNS root canister, call:

`list_sns_canisters`

This returns:

  * Governance canister

  * Ledger canister

  * Swap canister

  * Any governed dapp canisters




**DFX example:**
    
    
    dfx canister --network ic call <SNS_ROOT_CANISTER_ID> list_sns_canisters '(record {})'
    

* * *

## 3\. Get Full Status and Controllers

To inspect canister status, cycles balance, and controllers, call:

`get_sns_canisters_summary`

**DFX example:**
    
    
    dfx canister --network ic call <SNS_ROOT_CANISTER_ID> get_sns_canisters_summary '(record {})'
    

You can verify the controller hierarchy:

  * SNS root controls all SNS canisters except the swap canister

  * Swap is controlled by the NNS root

  * NNS root canister ID:  
`r7inp-6aaaa-aaaaa-aaabq-cai`

  * SNS root itself is controlled by SNS governance




* * *

## 4\. Start from a Dapp Instead

If you only know the dapp canister ID:

  1. Query its controller

  2. If it is controlled by an SNS root, use that root canister ID

  3. Follow the steps above




If you only have a URL ending in `.ic0.app`, remove `.ic0.app` to obtain the canister ID.

* * *

## 5\. Inspect SNS Governance Neurons

To list neurons in SNS governance:

Method: `list_neurons`

This method is paginated using:

  * `limit`

  * `start_page_at`




**DFX example:**
    
    
    dfx canister --network ic call <SNS_GOVERNANCE_CANISTER_ID> list_neurons '(record { of_principal=null; limit=100: nat32; start_page_at=null })'
    

* * *

## 6\. Check Token Balances

### Tokens in the decentralization swap

Call:

`icrc1_balance_of`

on the SNS ledger, using the swap canister as owner.

### Tokens in the SNS treasury

Call:

`icrc1_balance_of`

on the SNS ledger, using:

  * Owner = SNS governance canister

  * Subaccount = treasury subaccount




