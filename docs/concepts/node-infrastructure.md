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

### Memory encryption

SEV-SNP encrypts all memory pages of the GuestOS virtual machine using keys protected by the CPU's secure processor. A host that gains full control of the machine can only read encrypted blobs from the GuestOS memory: canister state, cryptographic key shares, and other sensitive runtime data remain confidential.

### VM launch measurements

A VM launch measurement is a cryptographic fingerprint of the GuestOS at the moment it starts. The SEV-SNP secure processor computes this measurement from the guest kernel, initial ramdisk, kernel command-line parameters, and CPU configuration. Any modification to the GuestOS software or configuration produces a different measurement.

For each GuestOS release, the expected launch measurement can be computed in advance and published as part of the release. Nodes running the same GuestOS version produce identical measurements, which provides a basis for verifying that a node is running approved software.

### Attestation reports

An attestation report is a signed document produced by the SEV-SNP secure processor. It contains the VM's launch measurement and the CPU's unique hardware identifier, signed by AMD's root of trust. This gives any verifier, whether another node or an external party, the ability to confirm that:

- The VM is running inside a genuine SEV-SNP TEE
- The specific software and configuration that were loaded match an approved GuestOS release

ICP uses attestation during GuestOS upgrades (nodes attest each other before exchanging disk encryption keys) and exposes attestation endpoints for external verification through API boundary nodes.

### Sealing keys

A sealing key is derived from two inputs: the CPU's unique hardware identifier and the VM's launch measurement. This means:

- Each node produces a unique sealing key, even for the same GuestOS version
- If the GuestOS changes (for example after an upgrade), the derived key changes and previously encrypted data becomes inaccessible until a secure key handoff completes

ICP uses sealing keys to encrypt the GuestOS disk partitions that contain sensitive runtime data. This ensures that even if an attacker copies the disk to another machine, the data cannot be decrypted: the sealing key depends on the specific CPU and the exact GuestOS configuration.

## Disk encryption and upgrades

GuestOS disk partitions containing sensitive data (canister state, cryptographic material) are encrypted using keys derived from the SEV-SNP sealing key. Each node maintains two partition sets (A and B), allowing a new GuestOS version to be prepared in the inactive set while the current version continues running.

When a new GuestOS is approved by the NNS, the upgrade process runs the old and new GuestOS instances in parallel. They mutually attest each other using SEV-SNP before the old GuestOS shares the disk encryption key with the new one over an encrypted channel. This ensures that disk access is transferred only to a verified, NNS-approved GuestOS version.

## Further reading

- [Glossary: replica](../references/glossary.md#replica): the software stack that runs inside GuestOS

<!-- Upstream: informed by Learn Hub articles "Overview" (Node Infrastructure), "Trusted Execution Environments" (migrated, source retired) -->
