---
learn_hub_id: 42494789123092
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/42494789123092-How-can-I-receive-ICP-tokens"
learn_hub_title: "How can I receive ICP tokens?"
learn_hub_section: "Governance"
learn_hub_category: "How can I use ICP?"
migrated: false
---

# How can I receive ICP tokens?

When you log into the NNS dapp for the first time you will not yet have any ICP tokens in your wallet. Therefore, you first might want transfer some tokens to the NNS dapp wallet. This also the first step required for staking a neuron with the NNS dapp.

## Get tokens from an exchange

If you already have ICP tokens on an exchange, you can transfer some of them to your NNS dapp account as explained in this video.

#### Step 1: Go on the Internet Computer Account page.

![](https://learn.internetcomputer.org/hc/article_attachments/42496260016660)

If you already [added sub-accounts](https://learn.internetcomputer.org/hc/en-us/articles/42494280383252), you now see the list of them. 

#### Step 2: Copy the ICP address of your account.

You have two options how to find the address of one of your accounts, for example the 'Main' account.

  * You can click on the QR-code symbol next to the account 'Main'. This will lead you to the following window where you can copy the ICP address.

![](https://learn.internetcomputer.org/hc/article_attachments/42496260020372)

  * You can use the 'Receive' button and select the account 'Main' at the top. You then see the option to copy the address.

![](https://learn.internetcomputer.org/hc/article_attachments/42496302608276)

#### Step 3: Go to your exchange and send tokens to the address you just copied.

Using this, you can send tokens from any exchange that supports sending ICP. The tokens should be visible in your wallet within a few minutes.

Not all exchanges support all features. It is advised to check with the exchange to be sure it supports the workflow described above.

## Get tokens from a developer identity using the CLI

This part explains how you can transfer ICP utility tokens from an account associated with your developer identity to your NNS dapp account.

To transfer ICP utility tokens controlled by your developer identity:

#### Step 1: Open a terminal shell on your local computer.

#### Step 2: Check that you are using an identity with control over the ledger account by running the following command:
    
    
    dfx identity whoami

In most cases, you should see that you are currently using your `default` developer identity. For example:
    
    
    default

####    
Step 3: View the textual representation of the principal for your current identity by running the following command:
    
    
    dfx identity get-principal

This command displays output similar to the following:
    
    
    tsqwz-udeik-5migd-ehrev-pvoqv-szx2g-akh5s-fkyqc-zy6q7-snav6-uqe

#### Step 4: Check the current balance in the ledger account associated with your identity by running the following command:
    
    
    dfx ledger --network ic balance

#### Step 5: Transfer ICP utility tokens to your Main account or a linked subaccount you create by running a command similar to the following:
    
    
    dfx ledger --network ic transfer <destination-account-id> --icp <ICP-amount> --memo <numeric-memo>

To find your account on the NNS dapp wallet, proceed as explained above. For example, assume your account is `0dff47055d84fd0d89cc55ff477c24026b5c2c9175f8fd36bcb66bb68cac81be` if you want to transfer 1 ICP utility token to this account, you can run the following command:
    
    
    dfx ledger --network ic transfer 0dff47055d84fd0d89cc55ff477c24026b5c2c9175f8fd36bcb66bb68cac81be --memo 12345 --icp 1

This example illustrates how to transfer ICP utility tokens using a whole number with the `--icp` command line option.  
You can also specify fractional units of ICP utility tokens—called **e8s** —using the `--e8s` option, either on its own or in conjunction with the `--icp` option.  
Alternatively, you can use the `--amount` to specify the number of ICP utility tokens to transfer with fractional units up to 8 decimal places, for example, as `5.00000025`.

The destination address can be any address in the ledger canister which might correspond to:

  * A wallet that is owned by a developer principal.
  * An account you have added using the NNS dapp.
  * An address for a wallet you have on an exchange.



  
If you transfer the ICP utility tokens to an account in the NNS dapp, you might need to refresh the browser to see the transaction reflected.

For more information about using the `dfx ledger` command line options, see [dfx ledger](https://internetcomputer.org/docs/building-apps/developer-tools/dfx/dfx-ledger).

