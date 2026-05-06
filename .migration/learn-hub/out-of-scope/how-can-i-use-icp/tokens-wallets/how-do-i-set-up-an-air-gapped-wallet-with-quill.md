---
learn_hub_id: 41523709355668
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/41523709355668-How-do-I-set-up-an-air-gapped-wallet-with-quill"
learn_hub_title: "How do I set up an air-gapped wallet with quill?"
learn_hub_section: "Tokens & wallets"
learn_hub_category: "How can I use ICP?"
migrated: false
---

# How do I set up an air-gapped wallet with quill?

Self-custody based on a seed phrase and an air-gapped computer maximizes control over one's tokens. The downside is that it requires significant technical skills and effort to set it up securely and to use it.

The core idea of this method is to maintain the private keys on a computer that is air-gapped, ie. not connected to the Internet, and thus safe from remote attacks. The computer can sign the transactions but not send them to the network. The signed transactions are instead displayed on the computer screen as QR codes, and a mobile phone is used to scan and decode the QR code and send the transaction to the network. As the phone only forwards the already signed transaction and does not touch sensitive cryptographic keys, the security of this method depends entirely on the air-gapped computer.

## Preparing your hardware and software

The hardware requirements are fairly low. Common options are an old laptop or a [Raspberry Pi](https://www.raspberrypi.com). The below description assumes that you have set up macOS or some variant of Linux. 

  1. Install [quill](https://github.com/dfinity/quill) by downloading the appropriate version from the [releases page](https://github.com/dfinity/quill/releases) (or building it from source code, if you prefer).
  2. Make sure to deactivate any and all network connections on the computer in order to air-gap it.



## Generate the seed phrase and private key

On your air-gapped computer, run the following command:
    
    
    % quill generate

The command will as you for a password, print the seed phrase on the screen, and generate a file `identity.pem` that is password-encrypted and contains the private key. Write down the seed phrase and store it in a safe place.

The command will also print your _principal id_ and your _legacy account id_. These are your public addresses, you will need them to receive tokens. The _legacy account id_ is only used for ICP tokens, such as if you send ICP tokens from a centralized exchange. The _principal id_ is used for all tokens except for ICP. The If you want to copy the addresses to your phone, you can use the command
    
    
    % quill --pem-file identity.pem public-ids | quill qr-code --file /dev/stdin

and scan the resulting QR code with your phone. Paste the result to a note or text file on your phone.

## Final steps

The method uses a seed phrase to encode the private key. The seed phrase serves as a backup in case the computer breaks or is otherwise inaccessible. Never show your seed phrase to anyone. Do not store your seed phrase on any electronic device other than the air-gapped computer.

Write your seed phrase on a sheet of paper or use a more durable option such as a steel wallet like the [Billfodl](https://billfodl.com). As you only need your seed phrase to recover the private key on your air-gapped computer, you should store it safely in a place like a bank vault or a private safe.

You of course also need to protect your air-gapped computer from physical access as well as using appropriate measures like strong passwords and disk encryption.

## Additional tools

  * [Harpo](https://github.com/THLO/harpo) is an open-source tool that allows to split a seed phrase in multiple shares.
  * The readme file in the [quill repository](https://github.com/dfinity/quill) will guide you through the use of quill.



