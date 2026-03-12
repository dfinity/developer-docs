---
title: "Chain-Key Cryptography"
description: "Threshold signatures that enable cross-chain integration, fast finality, and chain evolution"
sidebar:
  order: 9
icskills: []
---

TODO: Write content for this page.

<!-- Content Brief -->
Explain chain-key cryptography from a developer perspective. Cover threshold ECDSA (Bitcoin/Ethereum signing), threshold Schnorr (Bitcoin Taproot), BLS signatures (consensus and certification), key management across subnets, and chain evolution technology (subnet membership changes without downtime). Focus on what developers can do with chain-key: sign for other chains, verify responses, build cross-chain apps.

<!-- Source Material -->
- Portal: chain-key sections (scattered across multiple files)
- Learn Hub: [Chain-Key Cryptography](https://learn.internetcomputer.org/hc/en-us/articles/34209486239252), [Subnet Keys and Subnet Signatures](https://learn.internetcomputer.org/hc/en-us/articles/34209540682644), [Chain-Key Signatures](https://learn.internetcomputer.org/hc/en-us/articles/34209497587732), [Chain Evolution](https://learn.internetcomputer.org/hc/en-us/articles/34210120121748)

<!-- Writing Note -->
Present threshold signatures (ECDSA, Schnorr) as a general-purpose cryptographic primitive, not just tied to specific chains. Emphasize that these schemes support virtually any blockchain — include a supported chains table (see Portal's chain-fusion/supported-chains.mdx). Chain fusion guides cover Bitcoin/Ethereum specifically, but this concept page should make clear that threshold signing is the underlying capability enabling integration with any compatible chain.

<!-- Cross-Links -->
- concepts/chain-fusion -- chain-key enables chain fusion
- guides/chain-fusion/bitcoin -- ECDSA/Schnorr in practice
- guides/chain-fusion/ethereum -- ECDSA in practice
- concepts/vetkeys -- related cryptographic primitive
