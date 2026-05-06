---
learn_hub_id: 34209497587732
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34209497587732-Chain-Key-Signatures"
learn_hub_title: "Chain-Key Signatures"
learn_hub_section: "Chain-Key Cryptography"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Chain-Key Signatures

The main application of _chain-key signatures_ is to enable direct interoperability with other blockchains as part of [Chain Fusion](https://learn.internetcomputer.org/hc/en-us/articles/34329023770260). Using chain-key signatures, canister smart contracts obtain control over cryptographic keys: They have a public key, from which a blockchain address on another blockchain like Bitcoin or Ethereum can be derived, and they can sign transactions relative to that address. One major application of chain-key signatures is creating [chain-key tokens](https://learn.internetcomputer.org/hc/en-us/articles/34211397080980), which are twins of tokens from other blockchains that exist on ICP. Two major examples of these are ckBTC and ckETH, representations of BTC and ETH on the Internet Computer, in which a canister smart contract cryptographically controls the bitcoin and ether that backs the ckBTC and ckETH tokens 1:1. Indeed, using chain-key signatures is the strongest, most decentralized way of integrating blockchains as no additional trust assumptions besides that of the two blockchains are required. In particular, there are no additional parties that manage signature keys or their shares.

A key component of chain-key signatures is threshold cryptography. The threshold signature scheme used to implement [certified communication](https://learn.internetcomputer.org/hc/en-us/articles/34214090576404) for ICP is based on BLS signatures. While BLS signatures have distinct advantages, they are not used on many other blockchains. In order to work with other blockchains, the Internet Computer must use threshold signatures that are compatible with the digital signature schemes of those other blockchains. By far the most commonly used signature scheme (including Bitcoin and Ethereum) is the [ECDSA signature scheme](https://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm). Because of this, _threshold ECDSA_ signatures have been the first ones to be supported on the IC. Subsequently, support for [Schnorr signatures](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki) as used by Bitcoin has been added, enabling full use of Bitcoin features that depend on Taproot, such as [Ordinals](https://www.bitcoin.com/get-started/what-are-bitcoin-ordinals/). The recently added support for [EdDSA signatures](https://en.wikipedia.org/wiki/EdDSA) unlocks integration with blockchains like Solana, TON, or Cardano.

## Threshold ECDSA

Implementing a secure and efficient threshold signing protocol for ECDSA is much more challenging than for BLS signatures. While there has been a flurry of [research on threshold ECDSA in recent years](https://eprint.iacr.org/2020/1390), none of these protocols meet the demanding requirements of the Internet Computer: they all either assume a _synchronous network_ (meaning that the protocols will fail or become insecure if messages are unexpectedly delayed) or provide _no robustness_(meaning that the ability to produce signatures is completely lost if a _single_ node should crash) or _both_. Neither of these assumptions are acceptable on the IC: security and liveness must hold even in an _asynchronous network_ with many faulty nodes.

The DFINITY R&D team has designed, analyzed, and implemented a new threshold ECDSA signing protocol that works over an _asynchronous network_ and is quite _robust_ (it will still produce signatures if up to a third of the nodes in a subnet are crashed or corrupt) while still delivering acceptable performance. This signing protocol has been published in two research papers that [describe the protocol in detail](https://eprint.iacr.org/2022/506) and [prove the key elements of its security](https://eprint.iacr.org/2021/1330). The NNS DAO decided to adopt threshold ECDSA on the Internet Computer and to roll it out, such that canister smart contracts are able to have an ECDSA public key.

## Threshold Schnorr and EdDSA

The Schnorr signature scheme, of which EdDSA is a variant, is more amenable to being adapted to a threshold protocol than the ECDSA signature scheme. Consequently, the threshold signing protocols for Schnorr and EdDSA implemented in ICP are simplified variants of the ECDSA signing protocol, and inherit the property of robustness in an asynchronous network.

