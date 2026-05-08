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

- Runs the [replica](../references/glossary.md#replica) process and the orchestrator (implementing the four-layer protocol stack)
- Executes canisters and manages their state
- Participates in consensus with other nodes in the subnet
- Manages cryptographic key material and threshold signature operations

Running GuestOS in a virtual machine ensures every node presents the same software environment to the replica, regardless of the underlying hardware. It also enables the Trusted Execution Environment (TEE) protection described below.

## Trusted Execution Environments

Running the GuestOS inside a virtual machine provides logical isolation from the host, but a sophisticated attacker with physical access to a node could historically inspect or tamper with GuestOS memory by compromising the HostOS or hypervisor.

Trusted Execution Environments (TEEs) address this by enforcing hardware-level isolation between a virtual machine and its host. Even if the HostOS or hypervisor is compromised, the confidentiality and integrity of GuestOS memory and state are preserved. TEE-enabled nodes are being rolled out across the network as hardware is upgraded.

ICP uses AMD's **Secure Encrypted Virtualization with Secure Nested Paging (SEV-SNP)** as its TEE technology. SEV-SNP provides four capabilities that together make it possible to trust a GuestOS running on a potentially compromised host:

1. **Memory encryption**: protection of GuestOS memory from unauthorized reads or writes by the host
2. **VM launch measurements**: cryptographic fingerprints that capture how the VM was initialized
3. **Attestation reports**: verifiable evidence that a VM is running inside a genuine SEV-SNP TEE with a specific configuration
4. **Sealing keys**: hardware-derived keys that allow data to be securely encrypted for persistent storage

![Securing the Internet Computer with Trusted Execution Environments](/concepts/node-infrastructure/tee-overview.jpg)

### Memory encryption

SEV-SNP encrypts all memory pages of the GuestOS virtual machine using keys protected by the CPU's secure processor. A host that gains full control of the machine can only read encrypted blobs from the GuestOS memory: canister state, cryptographic key shares, and other sensitive runtime data remain confidential.

### VM launch measurements

A VM launch measurement is a cryptographic fingerprint of the GuestOS at the moment it starts. The SEV-SNP secure processor computes this measurement from the CPU model and firmware, the guest kernel, the initial ramdisk, and the kernel command-line parameters. Any single-byte change to the GuestOS software or configuration produces a different measurement.

The kernel command-line parameters included in the measurement contain, among other things, the expected hash of the root filesystem, which is verified during early boot. Any modification to the GuestOS (whether in code, configuration, or filesystem contents) therefore leads to a different launch measurement.

For each GuestOS release, the expected launch measurement can be computed in advance and published as part of the release. Nodes running the same GuestOS version produce identical measurements, which provides a basis for verifying that a node is running approved software.

### Attestation reports

An attestation report is a signed document produced by the SEV-SNP secure processor. It contains the VM's launch measurement and the CPU's unique hardware identifier, signed by AMD's root of trust. This gives any verifier (whether another node or an external party) the ability to confirm that:

- The VM is running inside a genuine SEV-SNP TEE
- The specific software and configuration that were loaded match an approved GuestOS release

![SEV-SNP attestation report](/concepts/node-infrastructure/tee-attestation-report.svg)

ICP uses attestation in two ways:

- **Node-to-node attestation.** Before sensitive data or secrets are shared between nodes, SEV-SNP-enabled nodes attest each other. This is integral to the upgrade process (see below) and will be extended to all network connections as SEV-SNP adoption expands: each node pair attests the other at connection establishment, ensuring secrets are only exchanged with verified nodes.
- **External attestation.** SEV-SNP-equipped nodes expose a dedicated attestation endpoint for external verification. Access is restricted by firewall rules and is only available through API boundary nodes. External parties indirectly attest individual nodes through these API boundary nodes, which in turn verify the nodes they communicate with.

### Sealing keys

A sealing key is derived from two inputs: the CPU's unique hardware identifier and the VM's launch measurement. This means:

- Each node produces a unique sealing key, even for the same GuestOS version
- If the GuestOS changes (for example after an upgrade), the derived key changes and previously encrypted data becomes inaccessible until a secure key handoff completes

ICP uses sealing keys to encrypt the GuestOS disk partitions that contain sensitive runtime data. This ensures that even if an attacker copies the disk to another machine, the data cannot be decrypted: the sealing key depends on the specific CPU and the exact GuestOS configuration.

## Disk encryption

### Partition layout

Each node maintains two partition sets (A and B). This dual layout allows a new GuestOS version to be prepared in the inactive set while the current version continues running, and enables rollback if an upgrade fails.

| Partition | Notes |
|---|---|
| EFI | |
| GRUB | |
| config | |
| boot (A) | |
| root (A) | |
| **var (A)** | Encrypted; key derived from VM A's launch measurement |
| boot (B) | |
| root (B) | |
| **var (B)** | Encrypted; key derived from VM B's launch measurement |
| **store** | Encrypted; two keys, one per VM measurement |

Only partitions holding sensitive data are encrypted. The `var` partitions contain runtime data private to the currently active GuestOS. The `store` partition holds persistent data shared across GuestOS versions. System partitions (`boot`, `root`, `config`) are not encrypted: their contents are not confidential, and root filesystem integrity is covered by the root hash embedded in the kernel command-line, which is part of the VM launch measurement.

### From traditional disk encryption to sealing-key-based encryption

ICP nodes have always used disk encryption for data partitions. However, the previous encryption keys were independent of the GuestOS and could in principle be accessed by a malicious GuestOS, leaving a potential attack vector for a highly skilled adversary who could compromise the GuestOS and read the encrypted data.

With SEV-SNP, LUKS passphrases for each encrypted partition are now derived from the SEV-SNP sealing key using HKDF, giving each partition a unique passphrase tied to both the CPU and the exact GuestOS version. This means only the GuestOS that encrypted a partition can decrypt it, and any change in GuestOS version or hardware prevents access to previously encrypted data.

![SEV-SNP key derivation](/concepts/node-infrastructure/tee-key-derivation.svg)

On reboot, the GuestOS requests the sealing key from the SEV-SNP secure processor. As long as the launch measurement has not changed, the same sealing key is returned, allowing the node to decrypt the partitions. If the launch measurement changes (for example after an upgrade), a different sealing key is generated and the encrypted partitions can no longer be accessed. This is where the upgrade process and remote attestation come in.

## GuestOS upgrades

When a new GuestOS is approved by the NNS, its attributes (root filesystem hash and launch measurement) are published to the NNS registry, which serves as the source of truth for valid GuestOS versions. A malicious GuestOS cannot participate because it will have no entry in the registry.

The upgrade then runs the old and new GuestOS instances in parallel:

1. A proposal to upgrade a subnet or set of nodes is submitted and approved by the ICP community.
2. The new GuestOS image is downloaded into the inactive partition set while the current GuestOS continues running.
3. A temporary **Upgrade VM** boots the new GuestOS. It cannot yet access the encrypted `store` or `var` partitions because its sealing key (derived from the new launch measurement) differs from the current one.
4. The Upgrade VM generates an attestation report containing its launch measurement and sends it to the old GuestOS over a TLS channel.
5. The old GuestOS verifies the attestation report against the NNS registry to confirm the new GuestOS is an approved release.
6. Once verified, the old GuestOS shares the disk encryption key with the Upgrade VM. The Upgrade VM re-encrypts the partitions with a key derived from its own sealing key.
7. Both VMs shut down. The node boots into the upgraded GuestOS, which can now access the data using its own derived key.

This process ensures that disk access transfers only to a verified, NNS-approved GuestOS version, and repeats for every future upgrade.

## Emergency recovery

TEE-enabled GuestOSes are designed to lock everyone out (including node operators) unless a specific, governance-gated recovery process is followed. Recovery is never automatic and always requires an NNS proposal approved by the community. Historically, emergency recoveries have occurred only a few times, and during 2025 not a single one was necessary.

### Manual rollback

Manual rollback is the first option when a node fails after an upgrade. The dual partition layout means the previous GuestOS version still resides on the inactive partition set.

1. The recovery coordinator submits a proposal to the NNS marking the problematic GuestOS version as broken. If approved, nodes refuse to upgrade to that version again even if the subnet record still references it.
2. Node providers switch the active partition set back to the previous version via the HostOS limited console, without touching the GuestOS or breaking TEE guarantees.
3. The previous GuestOS boots and the node resumes normal operation. Once a fixed GuestOS version is released and approved, nodes upgrade to it.

### Recovery-GuestOS

When neither partition set boots, manual rollback is insufficient. The encrypted partitions can only be decrypted by a GuestOS with the original launch measurement, so no other GuestOS version can access the data, including a fixed one.

The Internet Computer solves this with a Recovery-GuestOS: a specially crafted image that keeps the same kernel, initramdisk, and kernel command-line as the broken GuestOS (preserving the launch measurement) while replacing the root filesystem with a fixed version. The table below shows how this differs from a standard upgrade image:

| | Upgrade image | Recovery image |
|---|---|---|
| Can be reproduced and verified by the community | yes | yes |
| kernel, initrd, kernel command-line | arbitrary | same as in base image |
| Root filesystem hash matches `root_hash` kernel parameter | yes | no |
| Boot partition contains NNS proposal with root filesystem hash | no | yes |

Because the root hash in the kernel command-line no longer matches the recovery root filesystem, a special override is needed: the `BlessAlternativeGuestOsVersion` NNS proposal. During early boot, if the actual root hash does not match the expected hash in the kernel command-line, the integrity checker looks for this proposal. If present, valid, and listing the specific node's chip ID, the recovery root filesystem is mounted while preserving the original launch measurement, and therefore the same disk encryption key.

The full process:

1. The recovery coordinator collects the affected nodes' chip IDs and the base GuestOS launch measurement.
2. A Recovery-GuestOS branch is prepared in the Internet Computer repository.
3. A recovery root filesystem is created, and a `BlessAlternativeGuestOsVersion` proposal is submitted to the NNS with the recovery root filesystem hash, base launch measurement, and list of authorized chip IDs.
4. Once approved, a Recovery-GuestOS upgrade image is built combining the base kernel, initramdisk, kernel command-line, the recovery rootfs, and the signed proposal.
5. Node operators deploy it via the HostOS limited console.
6. During early boot, the integrity checker detects the root hash mismatch, verifies the NNS proposal, confirms the node's measurement and chip ID match, and mounts the recovery root filesystem.
7. The Recovery-GuestOS boots and the node resumes operation, with SEV-SNP privacy guarantees intact.

Because the integrity checker is part of the initramdisk, a malicious actor cannot tamper with it without changing the SEV-SNP launch measurement, preserving the security of the node.

## Further reading

- [Glossary: replica](../references/glossary.md#replica): the software stack that runs inside GuestOS

<!-- Upstream: informed by Learn Hub articles "Overview" (Node Infrastructure), "Trusted Execution Environments" (migrated, source retired) -->
