---
learn_hub_id: 34209486239252
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34209486239252-Chain-Key-Cryptography"
learn_hub_title: "Chain-Key Cryptography"
learn_hub_section: "Chain-Key Cryptography"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Chain-Key Cryptography

_Chain-key cryptography_ enables subnets of the Internet Computer to jointly hold cryptographic keys, in a way that no small subset of potentially misbehaving nodes on the subnet can perform useful operations with the key, but the majority of honest nodes together can. Chain-key cryptography provides several major benefits to ICP:

  1. Secure and efficient subnet-to-subnet communication enables ICP to scale horizontally, increasing the compute and memory capacity as more nodes are joining the Internet Computer.
  2. [Certified responses](https://learn.internetcomputer.org/hc/en-us/articles/34214090576404) enable clients to validate the information they receive from ICP nodes efficiently and without the need of keeping any blockchain state.
  3. Smart contracts have access to a source of unpredictable and unbiased randomness.
  4. [Chain-key signatures](https://learn.internetcomputer.org/hc/en-us/articles/34209497587732) enable canister smart contracts on ICP to hold assets and invoke smart contracts on other blockchain networks.
  5. [vetKeys](https://internetcomputer.org/docs/current/references/vetkeys-overview) enable dapps to encrypt data based on encryption keys controlled by canister smart contracts.



## Digital Signatures

A _digital signature scheme_ is a very traditional type of public-key cryptosystem, in which a secret key (held only by the signer) is used to generate a digital signature on a message, and a public key (available to everyone) may be used to efficiently verify a digital signature on a message. The basic security property achieved by such a scheme is that a valid signature on a message cannot be created without explicitly invoking the signing algorithm with the corresponding secret key.

A _threshold signature scheme_ is a digital signature scheme where the secret signing key is never stored in one location (which would become a single point of failure). Rather, the secret key is effectively split up into _secret shares_ , and each secret share is stored on a different machine. To sign a message, these machines must agree to sign the message and coordinate with one another to generate a digital signature in a distributed fashion (importantly, without ever reconstructing the secret signing key in one location).

## Sharing Cryptographic Keys among the Nodes of a Subnet

While threshold signature schemes have been around for a long time, the Internet Computer is the first blockchain-based system to fully integrate this technology in the core of its design. Each subnet is associated with the public key of such a threshold signature scheme.

More technically, Chain-Key Cryptography is the combination of two cryptographic protocols: The first is a _distributed key generation_ protocol in which nodes of a subnet can together generate shares of a cryptographic key. The protocol ensures that the actual cryptographic key never actually exists at any one place, it exists only _virtually_ , determined by the shares held by all nodes together. A variation of the same protocol is used to re-share the cryptographic key when, e.g. the membership of a subnet changes and new nodes participate in the protocol. The second protocol is the  _threshold signature_ protocol, which the nodes evaluate together when a message has to be signed.

