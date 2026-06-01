---
title: "NNS proposal types"
description: "All NNS proposal topics and their proposal types, with descriptions"
---

Network Nervous System (NNS) proposals are grouped into topics that determine their reward weight, voting period, and how neurons can delegate their votes. Each proposal type specifies which canister method is called on adoption. For background on how proposals work, see [Governance](../concepts/governance.md#proposals).

## Topic: ProtocolCanisterManagement

Manages canisters essential to the Internet Computer Protocol, including the NNS governance canister (`rrkah-fqaaa-aaaaa-aaaaq-cai`), NNS root (`r7inp-6aaaa-aaaaa-aaabq-cai`), the registry canister (`rwlgt-iiaaa-aaaaa-aaaaa-cai`), and the ICP ledger (`ryjl3-tyaaa-aaaaa-aaaba-cai`).

| Proposal type | Description |
|---|---|
| `InstallCode` | Install, reinstall, or upgrade the code of an NNS-controlled canister. |
| `UpdateCanisterSettings` | Update the settings of an NNS-controlled canister. |
| `StopOrStartCanister` | Stop or start an NNS-controlled canister. |
| `HardResetNnsRootToVersion` | Emergency reset of the root canister to a specified Wasm. Intended as a break-glass mechanism when an open call context prevents normal upgrades. |

## Topic: ServiceNervousSystemManagement

Manages SNS canister code and the SNS Wasm modules canister (SNS-W, `qaa6y-5yaaa-aaaaa-aaafa-cai`).

| Proposal type | Description |
|---|---|
| `InstallCode` | Same as in ProtocolCanisterManagement, targeting SNS canisters. |
| `UpdateCanisterSettings` | Same as in ProtocolCanisterManagement, targeting SNS canisters. |
| `StopOrStartCanister` | Same as in ProtocolCanisterManagement, targeting SNS canisters. |
| `AddSnsWasm` | Add a new SNS canister Wasm to SNS-W, making it available for SNS instances to upgrade to. |
| `InsertSnsWasmUpgradePathEntries` | Insert custom upgrade path entries into SNS-W for all SNSes or for a specific SNS. |

## Topic: ApplicationCanisterManagement

Manages NNS-controlled canisters not covered by the above topics.

| Proposal type | Description |
|---|---|
| `InstallCode` | Same as ProtocolCanisterManagement, targeting application canisters. |
| `UpdateCanisterSettings` | Same as ProtocolCanisterManagement, targeting application canisters. |
| `StopOrStartCanister` | Same as ProtocolCanisterManagement, targeting application canisters. |
| `BitcoinSetConfig` | Set the configuration of the Bitcoin integration canister: fees, block syncing, API enablement. |

## Topic: IcOsVersionElection

Elects new IC OS versions before deployment. The IC OS has two layers: HostOS (the hypervisor running on physical hardware) and GuestOS (the VM containing the replica).

| Proposal type | Description |
|---|---|
| `ReviseElectedGuestosVersions` | Add or remove GuestOS versions from the elected set. Identified by Git revision and installation image SHA-256. Only elected versions can be deployed to subnets. |
| `ReviseElectedHostosVersions` | Add or remove HostOS versions from the elected set. |

## Topic: IcOsVersionDeployment

Deploys previously elected IC OS versions to specific nodes or subnets.

| Proposal type | Description |
|---|---|
| `DeployHostosToSomeNodes` | Deploy a HostOS version to a specified set of nodes. |
| `DeployGuestosToAllSubnetNodes` | Deploy a GuestOS version to all nodes in a subnet. |
| `DeployGuestosToSomeApiBoundaryNodes` | Update the GuestOS version on a set of API Boundary Nodes. |
| `DeployGuestosToAllUnassignedNodes` | Update the GuestOS version on all unassigned nodes. |

## Topic: Governance

Reward weight: 20 (higher than most topics, incentivizing participation). Covers governance of the Internet Computer itself.

| Proposal type | Description |
|---|---|
| `Motion` | Non-binding vote used to signal community consensus on strategy. |
| `UninstallCode` | Uninstall code from a canister. |
| `SetDefaultFollowees` | Set the default following for newly created neurons. |
| `KnownNeuron` | Register or update a known neuron with a name, optional description, links, and committed proposal topics. |
| `DeregisterKnownNeuron` | Remove a neuron from the known neurons list. |

## Topic: SnsAndCommunityFund

Reward weight: 20. Covers SNS decentralization swaps and the Neurons' Fund.

| Proposal type | Description |
|---|---|
| `CreateServiceNervousSystem` | Install a new SNS and specify all settings: initial digital asset distribution, decentralization swap conditions, initial governance parameters, and Neurons' Fund contribution. |

## Topic: NetworkEconomics

Economic parameters for the network and NNS governance settings.

| Proposal type | Description |
|---|---|
| `UpdateNodeRewardsTable` | Update the table used to calculate node provider rewards by region. |
| `NetworkEconomics` | Update one or more economic parameters: reject cost, minimum neuron stake, neuron management fee, minimum ICP/XDR rate, spawned neuron dissolve delay, maximum node provider rewards, transaction fee, maximum proposals per topic, Neurons' Fund economics, and voting power parameters. |
| `ClearProvisionalWhitelist` | Remove principals from the bootstrapping whitelist that allows canister creation without cycles. Intended for use after mainnet initialization only. |

## Topic: SubnetManagement

Subnet topology, configuration, and canister routing.

**Subnet creation and composition:**

| Proposal type | Description |
|---|---|
| `CreateSubnet` | Create a new subnet from a set of nodes, triggering distributed key generation. |
| `UpdateConfigOfSubnet` | Update a subnet's protocol configuration (message sizes and similar consensus-level parameters). |
| `AddNodeToSubnet` | Add an unassigned node to a subnet. |
| `RemoveNodesFromSubnet` | Remove nodes from a subnet, making them available for reassignment. |
| `ChangeSubnetMembership` | Atomically add and remove nodes (node swap) in a single operation. |
| `RecoverSubnet` | Update a subnet's recovery catch-up package to recover a stalled subnet. |

**Firewall rules:**

| Proposal type | Description |
|---|---|
| `SetFirewallConfig` | Set firewall configuration in the registry. |
| `AddFirewallRules` | Add firewall rules. |
| `RemoveFirewallRules` | Remove firewall rules. |
| `UpdateFirewallRules` | Update firewall rules. |

**Subnet type and canister routing:**

| Proposal type | Description |
|---|---|
| `SetAuthorizedSubnetworks` | Authorize a principal to use specific subnets for canister creation via the Cycles Minting Canister. |
| `UpdateSubnetType` | Update the available subnet types in the Cycles Minting Canister. |
| `ChangeSubnetTypeAssignment` | Change which subnets are assigned to which subnet type. |
| `UpdateSnsWasmSnsSubnetIds` | Update the list of subnet IDs where SNS-W deploys new SNS instances. |
| `RerouteCanisterRanges` | Update the registry routing table (which canister ID ranges are on which subnet). |
| `PrepareCanisterMigration` | Insert canister migration entries for a subnet split. |
| `CompleteCanisterMigration` | Remove canister migration entries after a split completes. |

## Topic: ParticipantManagement

Node provider and data center identities.

| Proposal type | Description |
|---|---|
| `AddOrRemoveDataCenters` | Add or remove data center records in the registry. |
| `AddOrRemoveNodeProvider` | Assign or revoke an identity to a node provider, including legal entity information and jurisdiction. |

## Topic: NodeAdmin

Node machine administration.

| Proposal type | Description |
|---|---|
| `AssignNoid` | Assign an identity to a node operator and set their remaining node allowance. |
| `UpdateNodeOperatorConfig` | Update a node operator's allowance or configuration in the registry. |
| `RemoveNodeOperators` | Remove a node operator from the registry. |
| `RemoveNodes` | Remove unassigned nodes from the registry. |
| `UpdateSshReadonlyAccessForAllUnassignedNodes` | Update SSH read-only access for all unassigned nodes. |

## Topic: KYC

Genesis neuron KYC verification. All neurons created after genesis have `kyc_verified = true` automatically, since they derive from already-KYC-verified balances.

| Proposal type | Description |
|---|---|
| `ApproveGenesisKYC` | Set `kyc_verified = true` for a batch of genesis principals, enabling them to spawn neurons and disburse stakes. |

## Topic: NeuronManagement (restricted voting)

A special topic for collective management of a specific neuron. Only the target neuron's followers on this topic can vote, so proposals have a shorter-than-normal voting period. The standard restriction on following private neurons does not apply to this topic.

| Proposal type | Description |
|---|---|
| `ManageNeuron` | Call a command on a specified target neuron. Only the target neuron's followers may vote. |

<!-- Upstream: informed by Learn Hub article "Proposal Topics and Types" (migrated, source retired) -->
