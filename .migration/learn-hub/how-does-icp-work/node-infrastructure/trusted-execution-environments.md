---
learn_hub_id: 46124920595988
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/46124920595988-Trusted-Execution-Environments"
learn_hub_title: "Trusted Execution Environments"
learn_hub_section: "Node Infrastructure"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Trusted Execution Environments

The Internet Computer Protocol strengthens its confidentiality and integrity guarantees by running nodes inside Trusted Execution Environments (TEEs).

This work is part of Milestone Magnetosphere and is being rolled out gradually across the network, with the first machines already live. In this article, we explore the security properties TEEs provide and how the Internet Computer Protocol leverages them.

![Securing the Internet Computer with Trusted Execution Environments](https://learn.internetcomputer.org/hc/article_attachments/46126182872340)

## The Internals of an ICP Node

The Internet Computer is composed of many nodes distributed across the globe and operated by independent node providers. Each node is a physical server running a host operating system (_HostOS_), which in turn runs a virtual machine (_GuestOS_).

All critical components, such as the orchestrator, the replica, the canisters, and their associated state, run inside the GuestOS. The GuestOS is logically isolated from the HostOS, which is treated as untrusted.

## TEE Foundations for ICP Nodes

While this virtualization-based isolation has always been in place, it was previously possible for a highly sophisticated attacker with physical access to a node to compromise the host and inspect or tamper with the memory and state of the GuestOS.

TEEs address this by providing hardware-enforced isolation between a virtual machine and its host. Even if the HostOS or hypervisor is compromised, the confidentiality and integrity of the GuestOS is still preserved.

The Internet Computer Protocol currently relies on AMD’s TEE technology: **Secure Encrypted Virtualization – Secure Nested Paging (SEV-SNP)**. SEV-SNP provides four core features that make it possible to place trust in a GuestOS running on a potentially compromised host:

  1. **Memory Encryption** \- Protection of the GuestOS memory from unauthorized reads or writes by the host.
  2. **VM Launch Measurements** \- Cryptographic measurements that capture how the VM was initialized.
  3. **Attestation Reports** \- Verifiable evidence that a VM is running inside a genuine SEV-SNP TEE with a specific configuration.
  4. **Sealing Keys** \- Hardware-derived keys that allow data to be securely encrypted for persistent storage.



In the following, we will highlight each of the four features in more detail and explain how they are used by the Internet Computer Protocol.

### Memory Encryption

SEV-SNP encrypts all memory pages of a virtual machine using keys protected by the CPU’s secure processor. This means that even if an attacker gains full control over the host machine, any attempt to inspect the VM’s memory will only result in encrypted blobs.

This is important for the Internet Computer, as a node’s runtime memory contains highly sensitive data, including canister state and cryptographic material (e.g., signing keys and threshold key shares).

### VM Launch Measurements

A VM launch measurement in SEV-SNP is a cryptographic fingerprint that represents the state of a virtual machine at launch. It is computed by the SEV-SNP secure processor and captures both the contents of the VM’s initial memory and relevant configuration metadata. In effect, the measurement uniquely identifies what software was loaded and how the virtual machine was initialized.

The launch measurement is derived from inputs such as the CPU model and firmware, the guest kernel, the initial ramdisk, and the kernel command-line parameters. Because the measurement reflects these inputs exactly, even a single-byte change in the guest software or configuration results in a different launch measurement.

Importantly, the launch measurement can also be computed offline, using the same inputs that are used to initialize the VM. This makes it possible to know the expected measurement of a VM before it is ever started.

The Internet Computer Protocol relies on VM launch measurements to securely identify different versions of the GuestOS. For each GuestOS release, the expected launch measurement can be computed ahead of time and published as part of the release process. As long as nodes run the same GuestOS version, their launch measurements will be identical across all Internet Computer nodes.

The kernel command-line parameters included in the measurement contain, among other things, the expected hash of the root filesystem, which is verified during early boot. As a result, any modification to the GuestOS, whether in code, configuration, or filesystem contents, leads to a different launch measurement.

These measurements play a central role for both remote attestation and sealing keys to bind trust and confidentiality to a specific, verified software configuration.

![SEV-SNP attestation report](https://learn.internetcomputer.org/hc/article_attachments/46124888515860)

### Attestation Reports

An attestation report in AMD SEV-SNP is a cryptographically signed document produced by the SEV-SNP secure processor. It serves as verifiable evidence that a virtual machine is running inside a genuine Trusted Execution Environment (TEE).

The report includes important information such as the VM’s launch measurement and a unique hardware identifier of the CPU. By examining the launch measurement, a verifier can determine precisely what software and configuration were used to initialize the VM. In other words, the attestation report allows anyone to confirm what is running inside the VM and that it is indeed protected by SEV-SNP.

For the Internet Computer Protocol, attestation reports are critical to trust and transparency. They allow nodes and external parties to verify that a machine is running an approved GuestOS release, tying the VM back to the code base.

### Sealing Keys

A sealing key is a cryptographic key generated inside a Trusted Execution Environment (TEE) that cannot be accessed outside the virtual machine. In AMD SEV-SNP, sealing keys are derived from two sources: the CPU’s unique hardware identifier (chip ID) and the VM’s launch measurement.

Because of this derivation:

  * Each machine produces a different key, even for the same GuestOS release;
  * The key is tied to the specific software and configuration of the VM; if either changes, the key cannot decrypt previously sealed data.



Sealing keys can be used to encrypt sensitive information such that it can only be decrypted inside the original VM with the original configuration, providing a strong guarantee of confidentiality and integrity for stored data.

In the Internet Computer, sealing keys are used to protect the persistent state of a node. By encrypting this data with a sealing key, the protocol ensures that it can only be accessed by the intended GuestOS running on the intended hardware. This provides a powerful security guarantee: even if an attacker gains physical access to a node or copies the disk elsewhere, they cannot decrypt the node’s persistent data without the exact VM configuration and CPU.

## Practical Considerations of Running TEE-Protected ICP Nodes

With the foundational features of TEEs in place, running Internet Computer nodes inside AMD SEV-SNP environments introduces new operational considerations. The protocol must handle challenges such as:

  1. leveraging sealing keys for disk encryption,
  2. enabling remote attestation to allow externals to verify that the nodes are running an approved GuestOS version within a TEE,
  3. securely upgrading nodes to a new GuestOS version without data loss and leakage,
  4. allowing failure recoveries in emergency situations.



In the following sections, we explore each of these topics in detail.

### Leveraging Sealing Keys to Encrypt the Disks

#### SEV-SNP and Persistent Storage

Out of the box, AMD SEV-SNP provides memory encryption for virtual machines, protecting runtime data in RAM from being accessed by the host. However, SEV-SNP does not automatically encrypt persistent storage. Without additional measures, data written to disk remains readable by the host operating system. To fully protect node state, persistent data must be encrypted before being written to disk using keys that are private to the virtual machine.

Sealing keys provide a solution: they allow data on disk to be encrypted such that only the intended GuestOS, running on the intended hardware and version, can decrypt it.

Partition name  
---  
EFI  
GRUB  
config  
boot (A)  
root (A)  
**var (A)**   
encryption key based on VM A's measurement  
boot (B)  
root (B)  
**var (B)**   
encryption key based on VM B's measurement  
**store**   
(2 encryption keys based on each VM's measurement)  
  
#### Guest Disk Layout

The layout of an Internet Computer GuestOS disk is fairly standard, consisting of partitions for boot, root, var, and a shared data store. However, the ICP node’s upgrade mechanism introduces a key twist: some partitions are duplicated across two sets (A and B) to allow safe upgrades. The full disk layout is shown on the right.

Each partition set (A and B) contains a boot, root, and var partition. This design allows the node to download and prepare the next GuestOS version into the inactive partition set while continuing to run the current version. In case of a failed upgrade, the node can simply boot from the previous partition set.

Only partitions that store sensitive data are encrypted. The var partitions are private to the currently active GuestOS, containing runtime data for that VM. The store partition is shared between both VMs and contains persistent data accessible to all GuestOS versions. System and configuration partitions (boot, root, config) are not encrypted, both because their contents are not confidential and because, in the case of the root partition, their integrity is protected via the root hash included in the VM launch measurement.

#### Traditional Disk Encryption

Internet Computer nodes have always used disk encryption for the data partitions. However, the encryption keys were independent of the GuestOS and could, in principle, be accessed by a malicious GuestOS. This left a potential attack vector: a highly skilled adversary could compromise the GuestOS and read the encrypted data.

#### Using SEV-SNP Sealing Keys for Disk Encryption

With SEV-SNP, encryption keys can now be derived from the VM’s sealing key, which is tied to both the CPU’s unique hardware identifier and the GuestOS launch measurement. This ensures that:

  * Each node has a unique key.
  * Only the GuestOS that was used to encrypt the partition can decrypt it.
  * Any change in the GuestOS version or hardware prevents access to previously encrypted data.



When a node is deployed from scratch:

  1. Encrypted partitions are created.
  2. LUKS passphrases for each partition are derived from the SEV-SNP sealing key using HKDF.
  3. Each encrypted partition receives a unique passphrase.



The figure below shows how the LUKS encryption key is derived and ultimately depends on the specific GuestOS release and CPU:

![SEV-SNP key derivation](https://learn.internetcomputer.org/hc/article_attachments/46124920593428)

On reboot, the GuestOS requests the sealing key from the SEV-SNP secure processor. As long as the launch measurement has not changed, the same sealing key is returned, allowing the node to decrypt the partitions. If the launch measurement changes (e.g., after an upgrade), a different sealing key is generated and the encrypted partitions can no longer be accessed.

This approach tightly couples data confidentiality and integrity to the GuestOS version, ensuring that persistent storage remains protected even if an attacker gains physical access to the host. At the same time, it creates a dependency: before a new GuestOS can access the data, we need a way to verify the integrity and authenticity of the new VM. This is where remote attestation comes in, providing the foundation for trust between nodes and enabling secure upgrades.

### Remote Attestation of TEE-Enabled GuestOS

Running TEE-enabled GuestOSs provides strong confidentiality and integrity guarantees, but those guarantees are meaningless if nobody can verify them. This is where remote attestation becomes critical: it allows parties, whether other nodes or external users, to confirm that a VM is running a genuine, approved GuestOS in a secure TEE.

#### Node-to-Node Attestation

Before sensitive data or secrets are shared between nodes, SEV-SNP-enabled nodes must attest each other to ensure that the other party is running a valid GuestOS. This is already integral to the upgrade process, where a new GuestOS running in an Upgrade VM must provide an attestation report to the old GuestOS before receiving the disk encryption key.

As SEV-SNP adoption expands, node-to-node attestation will be extended to connection establishment across the network. When two nodes communicate, each attests the other, guaranteeing that secrets and sensitive data are exchanged only with trustworthy nodes.

#### External Attestation

Remote attestation is also important for external parties, such as IC users, who want to verify that the nodes serving them are running TEE-enabled GuestOSs.  
To balance security and accessibility:

  * SEV-SNP-equipped nodes provide a dedicated attestation endpoint for external verification.
  * Access to this endpoint is restricted by strict firewall rules and is only available via API boundary nodes (API BNs).
  * External parties indirectly attest individual nodes through these API BNs, which in turn verify the nodes they communicate with.



This layered attestation approach ensures that both the network and external users can trust the integrity and confidentiality of TEE-enabled GuestOSs, while maintaining security and scalability.

With an understanding of both disk encryption and remote attestation, we now have all the pieces needed to explore GuestOS upgrades. Upgrades must securely transfer access to encrypted data while ensuring that only verified, trusted GuestOSes are allowed to run: combining the protections of sealing keys and attestation in practice.

### Upgrades of TEE-Enabled GuestOS

In TEE-enabled Internet Computer nodes, upgrading the GuestOS introduces a challenge: the new GuestOS has a different SEV-SNP launch measurement, which means its sealing key, and therefore the derived disk encryption key, differs from the one of the old GuestOS. Without a special upgrade process, the new GuestOS would be unable to access the node’s encrypted data store.

To securely transfer access to encrypted data, the old and new GuestOS instances run side-by-side in parallel. The key idea is: Both VMs verify each other using SEV-SNP remote attestation to ensure that they are running on genuine TEE hardware and an approved GuestOS version. Once the new GuestOS proves its integrity and authenticity, the old GuestOS securely shares the disk encryption key with the new GuestOS over an encrypted channel.

This ensures that only a legitimate, verified GuestOS can obtain the key and decrypt the data.

#### Upgrade Process in Detail

**Preparation**

  * When a new GuestOS release is approved, its attributes (e.g., root filesystem hash and launch measurement) are published to the NNS Registry, which serves as the source of truth for valid GuestOS versions.
  * A malicious GuestOS cannot participate because it will have no entry in the Registry.



**Initiating an Upgrade**

  * A proposal to upgrade a subnet or a set of nodes is submitted and voted on by the ICP community. If the proposal is accepted, the upgrade starts.



**Deployment to Inactive Partition**

  * The nodes download the new GuestOS image into the inactive partition set.
  * The old GuestOS continues running from the active set.



**Launching the Upgrade VM**

  * A temporary Upgrade VM boots the new GuestOS while the old GuestOS is still running.
  * The Upgrade VM cannot yet access the encrypted store or var partitions because its sealing key and derived disk encryption key differ.



**Mutual Attestation**

  * The Upgrade VM generates an attestation report, which contains its launch measurement.
  * It sends the report to the old GuestOS (key exchange server) over a TLS channel.
  * The old GuestOS verifies the attestation report against the NNS Registry to ensure the new GuestOS is approved.



**Secure Key Exchange**

  * Once verified, the old GuestOS shares the disk encryption key with the Upgrade VM.
  * The Upgrade VM can now decrypt the partitions. It then replaces the old key with a new key derived from its own launch measurement.



**Completion**

  * Both the old and Upgrade VMs shut down.
  * The new GuestOS boots from the upgraded partition set and can access the data using its own derived encryption key.



This process ensures that encrypted data remains confidential and is accessible only to a verified GuestOS, even during upgrades. The same procedure repeats for future upgrades, maintaining security across the node’s lifecycle.

### Emergency Recovery of TEE-Enabled GuestOS

TEE-enabled GuestOSes are designed to lock anyone out, including node operators, hosts, and potential attackers. While this ensures strong confidentiality and integrity, it also creates a challenge: if a node fails or its GuestOS becomes unresponsive, there is no simple way to intervene.

Even though every GuestOS release undergoes extensive testing, unexpected failures cannot be completely ruled out. Bugs in rarely executed code paths, hardware quirks, or unforeseen incompatibilities may cause a node to crash or prevent the GuestOS from fully starting. In these cases, the Internet Computer Protocol needs a secure way to recover the node, even if such events remain extremely rare.

Historically, emergency recoveries have occurred only a few times, and the frequency has decreased as the platform matured. For example, during 2025, not even a single emergency recovery was necessary.

Recovery is never automatic. It is always coordinated by a recovery coordinator and must be approved by the community. Without an elected proposal, neither the coordinator nor node operators can modify the node. This ensures that recoveries maintain the security guarantees of the TEE while respecting the decentralized governance of the Internet Computer.

The recovery approach depends on the severity of the failure. If the node’s orchestrator is still responsive and can interact with the NNS registry, existing recovery methods can be used. If the orchestrator is unresponsive, new strategies are required. These include a manual rollback initiated by the node provider and, if that fails, the deployment of a specially crafted, community-approved Recovery-GuestOS. The following sections describe both approaches in detail.

#### Manual Rollback of GuestOS

Manual rollback is the first line of defense when a node encounters issues after an upgrade. Its success assumes that the previous GuestOS version was stable and fully operational before the upgrade.

Thanks to the dual partition setup, the node maintains two sets of partitions (A and B), allowing the new GuestOS to be downloaded into the inactive set while the active set continues running. In the event of a failure, node providers can simply switch the active partition set back to the previous version. This action can be performed from outside the GuestOS, via the HostOS limited console, without compromising confidentiality or integrity.

The full process is as follows:

  1. The recovery coordinator submits a proposal to the NNS marking the problematic GuestOS version as broken, including a description of the issue.
  2. If the community approves the proposal, nodes will refuse to upgrade to the broken version, even if the subnet record still references it. This ensures that nodes do not immediately upgrade again after a successful rollback.
  3. Node providers activate the rollback function via the HostOS limited console, switching the active partition set to the previous GuestOS version.
  4. If successful, the previous GuestOS boots, and the node can resume normal operation. With the orchestrator responsive again, standard recovery and upgrade procedures can continue. Once a fixed GuestOS version is released and approved, nodes can safely upgrade to it.



#### Booting a Recovery-GuestOS with the Same SEV-SNP Measurement

In rare cases, a node may be so severely broken that manual rollback is insufficient. Even the previously working GuestOS may fail to boot, leaving the node’s data inaccessible. Because the persistent data is encrypted with a key derived from the broken GuestOS’s SEV-SNP launch measurement, it cannot be accessed by any other GuestOS version. This creates a fundamental challenge: how can the node be restored without losing access to its encrypted state?

The core difficulty lies in the tight binding of the disk encryption key to the GuestOS launch measurement. SEV-SNP ensures that the key is only available to a VM with the same measurement, which depends (among others) on: kernel, initial ramdisk, kernel command-line parameters.

These components cannot be changed, as any modification would result in a different launch measurement, making the encrypted data inaccessible. The root filesystem, however, is indirectly part of the measurement through its hash: the kernel command-line includes the root hash, and the filesystem is only mounted if the hash matches. Normally, this prevents any modifications to the root partition.

To overcome this, the Internet Computer introduces a Recovery-GuestOS mechanism. The goal is to provide a “fixed” GuestOS that can boot and restore node functionality, while using the same launch measurement as the broken GuestOS such that it retains access to the encrypted data.

This is achieved by keeping the kernel, initramdisk, and kernel command-line identical to the base (broken) GuestOS, while replacing the root filesystem with a version containing the necessary fixes.

The table below highlights the key differences between a standard GuestOS upgrade image and a Recovery-GuestOS image, illustrating which components are preserved, which can change, and how the Recovery-GuestOS is authorized to access the disk while maintaining the original launch measurement.

| upgrade image | recovery image  
---|---|---  
**can be reproduced and verified by the community** | yes | yes  
**kernel, initrd, kernel command-line** | arbitrary | same as in base image  
**root filesystem hash corresponds to the** _**root_hash**_**kernel command-line parameter's value** | yes | no  
**boot partition contains NNS proposal with root filesystem hash** | no | yes  
  
The system introduces a special NNS-approved override mechanism: during early boot, if the actual root filesystem hash does not match the expected hash in the kernel command line, the node checks for a `BlessAlternativeGuestOsVersion` proposal. If present and valid, this proposal allows the Recovery-GuestOS to mount its new root filesystem while preserving the original launch measurement. This ensures the disk encryption key remains unchanged, so the data stays accessible.

##### Recovery Process

The Recovery-GuestOS procedure works as follows:

  1. The recovery coordinator identifies the affected nodes and collects their chip IDs and the base GuestOS launch measurement.
  2. A Recovery-GuestOS branch is prepared in the Internet Computer repository.
  3. A root filesystem image for recovery is created, and a `BlessAlternativeGuestOsVersion` proposal is submitted to the NNS, containing:
     * Recovery root filesystem hash
     * Base launch measurement
     * List of authorized node chip IDs
  4. Once the proposal is approved, a Recovery-GuestOS upgrade image is built, combining the base kernel, initramdisk, kernel command-line, the recovery rootfs, and the signed proposal.
  5. Node operators deploy the Recovery-GuestOS via the HostOS limited console.
  6. During early boot, the integrity checker detects the root hash mismatch, verifies the NNS proposal, confirms the node’s measurement and chip ID match the proposal, and then mounts the recovery root filesystem.
  7. The Recovery-GuestOS boots successfully, allowing the node to resume operation while maintaining SEV-SNP privacy guarantees.



Since the integrity checker is part of the initramdisk, a malicious actor cannot tamper with it without affecting the SEV-SNP launch measurement, preserving the security of the node.

