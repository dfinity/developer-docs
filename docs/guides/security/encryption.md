---
title: "Encryption with VetKeys"
description: "Encrypt and decrypt data on ICP using VetKeys for onchain privacy, key management, and identity-based encryption"
sidebar:
  order: 6
---

TODO: Write content for this page.

<!-- Content Brief -->
How to encrypt data on ICP using VetKeys. Cover the end-to-end flow: setting up a canister with VetKeys, encrypting data client-side with a transport key, storing encrypted data onchain, and decrypting with derived keys. Include patterns for: encrypted onchain storage (e.g. encrypted-notes), distributed key management (DKMS), identity-based encryption (IBE), and timelock encryption. Show both backend (Rust/Motoko canister code) and frontend (JS decryption) sides. Reference the encrypted-notes and vetkd examples as real-world implementations.

<!-- Source Material -->
- Portal: building-apps/network-features/vetkeys/ (9 files: intro, API, BLS-signatures, DKMS, encrypted-storage, IBE, timelock, VRF, demos)
- icskills: vetkd
- Examples: vetkd (both), vetkeys (both), encrypted-notes-dapp-vetkd (both), filevault (Motoko)
- Learn Hub: check for VetKeys articles

<!-- Cross-Links -->
- concepts/vetkeys -- VetKeys conceptual background (what they are, how the protocol works)
- guides/security/data-integrity -- certified variables and signature verification
- guides/authentication/internet-identity -- identity-based patterns
- concepts/chain-key-cryptography -- threshold cryptography foundation
