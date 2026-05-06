---
learn_hub_id: 41526165816596
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/41526165816596-How-do-I-transfer-tokens-with-quill"
learn_hub_title: "How do I transfer tokens with quill?"
learn_hub_section: "Tokens & wallets"
learn_hub_category: "How can I use ICP?"
migrated: false
---

# How do I transfer tokens with quill?

This article assumes that you already [set up an air-gapped wallet with quill](https://learn.internetcomputer.org/hc/en-us/articles/41523709355668), which consists of an air-gapped computer that has [quill](https://github.com/dfinity/quill) installed together with an identity file containing a private key. Using the air-gapped wallet also requires a mobile phone and the [Scan & Send](https://p5deo-6aaaa-aaaab-aaaxq-cai.raw.ic0.app/) application.

## Transferring tokens to the air-gapped wallet

You can display the addresses of the wallet with the following command:
    
    
    % quill --pem-file identity.pem public-ids
    PEM decryption password: [hidden]
    Principal id: adett-lionk-6fxvm-cjgo2-ilfvx-7kbcj-ijzvx-3un7v-pl45j-mttb6-aae
    Legacy account id: 8c38fd552fc9a6ba6cf4d574df0bb15212574f29ca3b459d2af05def37217488

The principal id, here `adett-lionk-6fxvm-cjgo2-ilfvx-7kbcj-ijzvx-3un7v-pl45j-mttb6-aae`, can be used to send any token that complies with the [ICRC-1 standard](https://github.com/dfinity/ICRC-1/blob/main/standards/ICRC-1/README.md).

The ICP account id, here `8c38fd552fc9a6ba6cf4d574df0bb15212574f29ca3b459d2af05def37217488`, can be used to send ICP tokens from wallets that do not support the ICRC-1 standard. When sending tokens from centralized exchanges, you usually have to use this address format.

## Transferring tokens from the air-gapped wallet

### Transferring ICP tokens

ICP tokens can be sent toward addresses of either of the above two formats using the following command:
    
    
    % quill --pem-file identity.pem transfer --amount [AMOUNT] [TO-ADDRESS] --qr

The value `AMOUNT` is the amount of ICP tokens, specified with up to 8 decimal digits. The displayed QR code can be scanned with the Scan & Send application.

### Transferring ckBTC or SNS tokens

Quill supports sending ckBTC and SNS tokens using the ICRC-1 address format. For ckBTC, the command is as follows:
    
    
    % quill --pem-file identity.pem ckbtc transfer --satoshis [AMOUNT] [TO-ADDRESS] --qr

The value `AMOUNT` is the amount of Satoshis to be sent. The displayed QR code can be scanned via the Scan & Send application.

For SNS tokens, one first needs to create a file that contains the canister ids. For the Dragginz DAO, for example, the file `dragginz.json` would look as follows:
    
    
    { "governance_canister_id": "zqfso-syaaa-aaaaq-aaafq-cai", "ledger_canister_id": "zfcdd-tqaaa-aaaaq-aaaga-cai", "root_canister_id": "zxeu2-7aaaa-aaaaq-aaafa-cai", "swap_canister_id": "zcdfx-6iaaa-aaaaq-aaagq-cai" }

Given this file, the command for transferring DKP tokens is then as follows:
    
    
    % quill --pem-file identity.pem sns transfer --canister-ids-file dragginz.json --amount [AMOUNT] [TO-ADDRESS] --qr

## Tools used in this tutorial

  * [Scan & Send](https://p5deo-6aaaa-aaaab-aaaxq-cai.raw.ic0.app/) for ICP using QR codes
  * [Quill](https://github.com/dfinity/quill) for creating transactions



