---
learn_hub_id: 43823123678100
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/43823123678100-How-can-I-stake-ICP-with-quill"
learn_hub_title: "How can I stake ICP with quill?"
learn_hub_section: "Tokens & wallets"
learn_hub_category: "How can I use ICP?"
migrated: false
---

# How can I stake ICP with quill?

You can use `quill` to stake ICP by creating a neuron in the Network Nervous System (NNS), and subsequently manage and disburse your neuron. The benefit of this method is security: `quill` supports air-gapped operation, which enables you to keep your cryptographic keys optimally secure. We assume that you have already [prepared an air-gapped setup](https://learn.internetcomputer.org/hc/en-us/articles/41523709355668) and [transferred ICP tokens](https://learn.internetcomputer.org/hc/en-us/articles/41526165816596) to it, and that you're thus familiar with the tools – `quill` and the [Scan & Send](https://p5deo-6aaaa-aaaab-aaaxq-cai.raw.ic0.app) application – to bridge the air gap. Throughout the tutorial, we assume that your private key is stored in a file `identity.pem`, which is the same setup we assume in the other tutorials.

## Create a neuron by staking ICP tokens

This step assumes that you have already transferred ICP tokens to your `quill` wallet. If you haven't done so yet, please [do the initial steps](https://learn.internetcomputer.org/hc/en-us/articles/41526165816596) now.

You can then use the neuron-stake command in quill to create the neuron, as follows:
    
    
    $ quill --pem-file identity.pem neuron-stake --name $NAME --amount $AMOUNT --qr

In the above command, `$NAME` can be an arbitrary string of up to 8 characters, which you can use to identify your neuron for the purposes of increasing your stake later with `quill`. For example, if you intend to have only one eight-year neuron, you could use the name `8yneuron`. This string has no meaning otherwise, and will not be visible anywhere else. You can store the string on your air-gapped computer. It is recommended that you also write the string down.

The `$AMOUNT` is a decimal number that specifies how many ICP tokens shall be staked. The amount should not include the transaction fee, but remember that it will still be deducted from your account, so if you wish to stake everything you’ve got, stake your balance minus the 0.0001 ICP fee.

The command generates a QR code that you need to scan with the [Scan & Send](https://p5deo-6aaaa-aaaab-aaaxq-cai.raw.ic0.app/) application. After sending the transaction, the application will display a response which looks like this:
    
    
    (
      record {
        result = opt variant {
          NeuronId = record { id = 5_241_875_388_871_980_017 }
        };
      },
    )

The neuron id, `5_241_875_388_871_980_017` in this example, will be needed for subsequent steps and generally referred to as `$NEURON_ID`.

## Set the dissolve delay of a neuron

After creating your neuron, it is not locked. In order to participate in governance and collect staking rewards, you need to increase the dissolve delay of your neuron to at least 6 months. To increase the dissolve delay of a neuron whose id is `$NEURON_ID,` there is a command of the form:
    
    
    $ quill --pem-file identity.pem neuron-manage $NEURON_ID --additional-dissolve-delay-seconds $SECONDS --qr

This shows the `neuron-manage` subcommand, which is used to manipulate neurons after they have been staked. In this case, `$SECONDS` seconds are added to the delay time.

The following table gives typical values for `$SECONDS`:

**Duration** | `$SECONDS`  
---|---  
six months |  `15_778_800` (60 seconds * 60 minutes * 24 hours * 182.625 days)  
one year |  `31_557_600` (60 seconds * 60 minutes * 24 hours * 365.25 days)  
four years |  `126_230_400` (60 seconds * 60 minutes * 24 hours * 365.25 days * 4 years)  
eight years |  `252_460_800` (60 seconds * 60 minutes * 24 hours * 365.25 days * 8 years)  
  
If you specify a dissolve delay longer than 8 years, it will be rounded down to 8 years.

The command will show a QR code that you need to scan with the application.

## Increase the stake of an existing neuron

The command is exactly the same as for creating the neuron initially, make sure to use the same value as `$NAME`.

## Set up voting

While you can use `quill` to vote on proposals, there is a better way: You can configure your neuron so that you can vote from a different interface, such as the [NNS dapp](https://nns.internetcomputer.org). At the same time, this method still preserves the full security of the air-gapped setup for your tokens and rewards; the setup enables the NNS dapp only for voting on proposals and setting up following. This is considered the best trade-off in terms of security and usability.

For this setup, you need to retrieve your _principal id_ from the NNS dapp, which you can see by clicking on the person icon in the upper right corner. The principal id will look similar to this: `2xt3l-tqk2i-fpygm-lseru-pvgek-t67vb-tu3ap-k0mnu-dr4hl-z3kpn-o2e`.

You can then add the principal id from the NNS dapp as a so-called hotkey to your neuron:
    
    
    $ quill --pem-file identity.pem neuron-manage $NEURON_ID --add-hot-key $PRINCIPAL --qr

where `$NEURON_ID` is your neuron id and `$PRINCIPAL_ID` is the principal id you copied from the NNS dapp.

After scanning the QR code and sending the transaction to the IC, you will be able to see your neuron, configure following, and vote in the NNS dapp.

## Disburse the voting rewards

After you participated in governance for a certain time period (at least a few days), your neuron will accumulate maturity that can be converted into ICP tokens. You can use the following command:
    
    
    $ quill --pem-file identity.pem neuron-manage $NEURON_ID --disburse-maturity --qr

The process of disbursing maturity takes one full week. The ICP tokens will be credited to your `quill` wallet, but you can [transfer them anywhere](https://learn.internetcomputer.org/hc/en-us/articles/41526165816596) as soon as they appear.

## Start dissolving the neuron

After you created your neuron and increased the dissolve delay, the neuron will _not_ automatically start to dissolve. That is, unless you start dissolving the neuron, it will remain locked. Once you start dissolving it, the dissolve delay will count downward until it reaches zero, at which point you can disburse the ICP staked in the neuron. You can use the following command to start dissolving your neuron:
    
    
    $ quill --pem-file identity.pem neuron-manage $NEURON_ID --start-dissolving --qr

**Warning:** As soon as you start dissolving your neuron, you will immediately lose the entire age bonus you may have accumulated.

## Stop dissolving the neuron

In order to stop the neuron from dissolving, you can use the following command:
    
    
    $ quill --pem-file identity.pem neuron-manage $NEURON_ID --stop-dissolving --qr

After you stop dissolving your neuron, it will again accumulate age bonus.

## Disburse the neuron

When the dissolve delay of the neuron reached zero, the ICP staked in the neuron can be disbursed. You can use the following command:
    
    
    $ quill --pem-file identity.pem neuron-manage $NEURON_ID --disburse --qr

The ICP tokens that were staked in the neuron will be transferred to the main `quill` wallet, from where they can be transferred anywhere.

