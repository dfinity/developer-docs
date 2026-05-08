---
title: "Node Infrastructure"
description: "How ICP nodes are structured: the IC-OS operating system stack, virtual machine isolation, and Trusted Execution Environments."
---

Every node in the Internet Computer network runs **IC-OS**: a custom operating system stack based on Ubuntu Linux and designed specifically for ICP. IC-OS provides a consistent, secure execution environment across all nodes regardless of the underlying hardware, which is a prerequisite for the deterministic execution that consensus requires.

## IC-OS: three operating systems in one

IC-OS is not a single operating system but a layered stack of three systems, each with a distinct role.

### SetupOS

SetupOS is used once: when initializing a new node for the first time. A [node provider](../references/glossary.md#node-provider) boots from a USB drive containing SetupOS, which automatically:

- Verifies that the hardware meets ICP node requirements
- Tests network connectivity
- Installs HostOS and GuestOS onto the machine
- Configures the node with its identity and initial cryptographic keys

After setup completes, the machine reboots into HostOS. SetupOS is not used again unless the node needs to be re-provisioned from scratch.

### HostOS

HostOS runs directly on the physical hardware. Its sole purpose is to configure and run the GuestOS virtual machine. It:

- Launches the GuestOS virtual machine
- Manages hardware resource allocation
- Handles GuestOS upgrades pushed by the [Network Nervous System (NNS)](../references/glossary.md#network-nervous-system-nns)
- Provides a security boundary between the physical hardware and the ICP software stack

HostOS is intentionally minimal. It treats the GuestOS as an untrusted process running in a virtual machine, which limits what a compromised GuestOS can do to the host and what the host can do to the guest.

### GuestOS

GuestOS runs inside a virtual machine on top of HostOS. This is where the ICP software actually executes. GuestOS:

- Runs the [replica](../references/glossary.md#replica) process (implementing the four-layer protocol stack)
- Executes canisters and manages their state
- Participates in consensus with other nodes in the subnet
- Manages cryptographic key material and threshold signature operations

Running GuestOS in a virtual machine ensures every node presents the same software environment to the replica, regardless of the underlying hardware. It also enables the Trusted Execution Environment (TEE) protection described below.

## Trusted Execution Environments

Running the GuestOS inside a virtual machine provides logical isolation from the host, but a sophisticated attacker with physical access to a node could historically inspect or tamper with GuestOS memory by compromising the HostOS or hypervisor.

Trusted Execution Environments (TEEs) address this by enforcing hardware-level isolation between a virtual machine and its host. Even if the HostOS or hypervisor is compromised, the confidentiality and integrity of GuestOS memory and state are preserved. TEE-enabled nodes are being rolled out across the network as hardware is upgraded.

ICP uses AMD's **Secure Encrypted Virtualization with Secure Nested Paging (SEV-SNP)** as its TEE technology. SEV-SNP provides four capabilities that together make it possible to trust a GuestOS running on a potentially compromised host.

![Securing the Internet Computer with Trusted Execution Environments](/concepts/node-infrastructure/tee-overview.jpg)

### Memory encryption

SEV-SNP encrypts all memory pages of the GuestOS virtual machine using keys protected by the CPU's secure processor. A host that gains full control of the machine can only read encrypted blobs from the GuestOS memory: canister state, cryptographic key shares, and other sensitive runtime data remain confidential.

### VM launch measurements

A VM launch measurement is a cryptographic fingerprint of the GuestOS at the moment it starts. The SEV-SNP secure processor computes this measurement from the guest kernel, initial ramdisk, kernel command-line parameters, and CPU configuration. Any modification to the GuestOS software or configuration produces a different measurement.

For each GuestOS release, the expected launch measurement can be computed in advance and published as part of the release. Nodes running the same GuestOS version produce identical measurements, which provides a basis for verifying that a node is running approved software.

### Attestation reports

An attestation report is a signed document produced by the SEV-SNP secure processor. It contains the VM's launch measurement and the CPU's unique hardware identifier, signed by AMD's root of trust. This gives any verifier, whether another node or an external party, the ability to confirm that:

- The VM is running inside a genuine SEV-SNP TEE
- The specific software and configuration that were loaded match an approved GuestOS release

![SEV-SNP attestation report](/concepts/node-infrastructure/tee-attestation-report.svg)

ICP uses attestation in two ways:

- **Node-to-node attestation.** Before sensitive data or secrets are shared between nodes, SEV-SNP-enabled nodes attest each other. This is integral to the upgrade process (see below) and will be extended to all network connections as SEV-SNP adoption expands: each node pair attests the other at connection establishment, ensuring secrets are only exchanged with verified nodes.
- **External attestation.** SEV-SNP-equipped nodes expose a dedicated attestation endpoint for external verification. Access is restricted by firewall rules and is only available through API boundary nodes. This allows IC users and external parties to verify that the nodes serving them are running TEE-enabled GuestOSes.

### Sealing keys

A sealing key is derived from two inputs: the CPU's unique hardware identifier and the VM's launch measurement. This means:

- Each node produces a unique sealing key, even for the same GuestOS version
- If the GuestOS changes (for example after an upgrade), the derived key changes and previously encrypted data becomes inaccessible until a secure key handoff completes

ICP uses sealing keys to encrypt the GuestOS disk partitions that contain sensitive runtime data. This ensures that even if an attacker copies the disk to another machine, the data cannot be decrypted: the sealing key depends on the specific CPU and the exact GuestOS configuration.

## Disk encryption

Each node maintains two partition sets (A and B). This dual layout allows a new GuestOS version to be prepared in the inactive set while the current version continues running. Only partitions holding sensitive data are encrypted: the `var` partitions (runtime data private to the active GuestOS) and the `store` partition (persistent data shared across GuestOS versions). System partitions (`boot`, `root`, `config`) are not encrypted: root filesystem integrity is covered by the root hash embedded in the kernel command-line, which is part of the VM launch measurement.

LUKS passphrases for each encrypted partition are derived from the SEV-SNP sealing key using HKDF, so each partition gets a unique passphrase that is tied to both the CPU and the exact GuestOS version.

![SEV-SNP key derivation](/concepts/node-infrastructure/tee-key-derivation.svg)

## GuestOS upgrades

When a new GuestOS is approved by the NNS, the upgrade process runs the old and new GuestOS instances in parallel using the A/B partition layout:

1. The new GuestOS image is downloaded into the inactive partition set while the current GuestOS continues running.
2. A temporary **Upgrade VM** boots the new GuestOS. It cannot yet access the encrypted partitions because its sealing key (derived from the new launch measurement) differs from the current one.
3. The Upgrade VM sends its SEV-SNP attestation report to the running GuestOS. The running GuestOS verifies the report against the NNS registry to confirm the new GuestOS is an approved release.
4. Once verified, the running GuestOS shares the disk encryption key with the Upgrade VM over an encrypted channel. The Upgrade VM re-encrypts the partitions with a key derived from its own sealing key.
5. Both VMs shut down. The node boots into the upgraded GuestOS, which can now access the encrypted data using its own derived key.

This process ensures that disk access transfers only to a verified, NNS-approved GuestOS version.

## Emergency recovery

TEE-enabled GuestOSes are designed to lock everyone out, including node providers, unless a specific recovery process is followed. Recovery is never automatic and always requires an NNS proposal approved by the community.

**Manual rollback** is the first option when a node fails after an upgrade. Because the previous GuestOS version still resides on the inactive partition set, node providers can switch back to it via the HostOS limited console without breaking TEE guarantees.

**Recovery-GuestOS** is used when manual rollback is insufficient, for example when neither partition set boots. The challenge is that the encrypted partitions can only be decrypted by a GuestOS with the original launch measurement. To address this, the Internet Computer supports a specially crafted Recovery-GuestOS that keeps the same kernel, initramdisk, and kernel command-line as the broken GuestOS (preserving the launch measurement) but replaces the root filesystem with a fixed version. The mismatch between the root hash in the kernel command-line and the actual recovery root filesystem is allowed only if a `BlessAlternativeGuestOsVersion` NNS proposal is present, approved by the community, and lists the specific node's chip ID. This ensures that recovery access is always governance-gated and auditable.

## Further reading

- [Glossary: replica](../references/glossary.md#replica): the software stack that runs inside GuestOS

<!-- Upstream: informed by Learn Hub articles "Overview" (Node Infrastructure), "Trusted Execution Environments" (migrated, source retired) -->
