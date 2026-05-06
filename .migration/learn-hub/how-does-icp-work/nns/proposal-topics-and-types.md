---
learn_hub_id: 34140518658068
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34140518658068-Proposal-Topics-and-Types"
learn_hub_title: "Proposal Topics and Types"
learn_hub_section: "NNS - Network Nervous System "
learn_hub_category: "How does ICP work?"
migrated: false
---

# Proposal Topics and Types

In the Network Nervous System (NNS), governance is performed by means of [proposals](https://learn.internetcomputer.org/hc/en-us/articles/34084113508500) that are voted on and execute automatically upon being adopted. Each proposal has a _proposal type_ , which determines the action taken when the proposal is adopted or rejected. Each type of proposal belongs to a specific _proposal topic_. The following list contains all present proposals types grouped by their topics. For more information on what to consider when verifying the different kinds of proposals, please refer to the [tutorial on verifying proposals](https://internetcomputer.org/docs/current/developer-docs/daos/nns/concepts/proposals/verify-proposals).

## Topic `ProtocolCanisterManagement`

This topic covers proposals for managing the canisters which are essential to the Internet Computer Protocol's operation. This includes the canisters comprising the NNS DAO, such as [NNS governance](https://dashboard.internetcomputer.org/canister/rrkah-fqaaa-aaaaa-aaaaq-cai), [NNS root](https://dashboard.internetcomputer.org/canister/r7inp-6aaaa-aaaaa-aaabq-cai), the [registry canister](https://dashboard.internetcomputer.org/canister/rwlgt-iiaaa-aaaaa-aaaaa-cai), and the [ICP ledger](https://dashboard.internetcomputer.org/canister/ryjl3-tyaaa-aaaaa-aaaba-cai) canister.

  * `InstallCode`: Install, reinstall, or upgrade the code of a canister that is controlled by the NNS.
  * `UpdateCanisterSettings`: Update the settings of a canister that is controlled by the NNS.
  * `StopOrStartCanister`: Stop or start a canister that is controlled by the NNS.
  * `HardResetNnsRootToVersion`: Uninstall and install the root canister with the Wasm provided in the function. If `InitArgs` are provided, they will be passed to the `canister_init` function of the Wasm provided. This function is meant as a 'break glass' mechanism for when an open call context in the root canister is preventing root or another canister from upgrading.



## Topic `ServiceNervousSystemManagement`

This topic covers proposals to manage the canisters of [service nervous systems (SNS)](https://learn.internetcomputer.org/hc/en-us/articles/34084394684564), including upgrading relevant canisters and managing SNS framework canister Web Assembly code modules through SNS-W.

  * `InstallCode`, `UpdateCanisterSettings`, and `StopOrStartCanister` are the same as in topic `ProtocolCanisterManagement`, only targeting different canisters.
  * `AddSnsWasm`: Add a new SNS canister Wasm to SNS-W. All SNS DAOs can then upgrade to new versions along the upgrade path.
  * `InsertSnsWasmUpgradePathEntries`: Insert custom upgrade path entries into SNS-W for all SNSes, or for an SNS specified by its governance canister ID.



## Topic `ApplicationCanisterManagement`

This topic covers proposals to manage NNS-controlled canisters not covered by the above topics.

  * `InstallCode`, `UpdateCanisterSettings`, and `StopOrStartCanister` are the same as in topics `ProtocolCanisterManagement` and `ServiceNervousSystemManagement` only targeting different canisters.
  * `BitcoinSetConfig`: A proposal to set the configuration of the Bitcoin canister that underlies the Bitcoin API. The configuration includes the amount of fees to charge, whether or not the Bitcoin canister should sync new blocks from the network, whether the API is enabled, etc.



## Topic `IcOsVersionElection`

To upgrade the ICP protocol, the NNS DAO first elects new IC OS versions (the software that is run by ICP nodes). In a second step, selected nodes can be upgraded to the previously elected IC OS versions. This proposal type is for the first part, i.e., to elect new versions.

HostOS is the hypervisor OS running on the IC node machine. Its main responsibilities include initializing and configuring the node machine hardware and passing functionality through to the GuestOS. The GuestOS, a VM running on the HostOS, contains the critical parts of the IC Protocol code, including the IC Replica, which runs the IC Canisters smart contracts.

This topic contains the following proposal types:

  * `ReviseElectedGuestosVersions`: A proposal to change the set of elected GuestOS versions. The version to elect is added to the registry, identified by the Git revision of the installation image, along with the URLs of the upgrade image and the SHA-256 checksum of the image. Besides creating a record for that version to the registry, the proposal also appends that version to the list of elected versions that can be installed on nodes of a subnet. Only elected GuestOS versions can be deployed.
  * `ReviseElectedHostosVersions`: A proposal to change the set of currently elected HostOS versions by electing a new version, and/or un-electing some previously elected versions. HostOS versions are identified by the hash of the installation image. The version to elect is added to the registry, and the versions to un-elect are removed from the registry, ensuring that HostOS cannot upgrade to these versions anymore.



## Topic `IcOsVersionDeployment`

This proposal is used to upgrade selected nodes to IC OS versions that have previously been approved ("elected") by the NNS DAO under the `IcOsVersionElection` topic.

This topic includes the following proposal types:

  * `DeployHostosToSomeNodes`: Deploy a HostOS version to a specified set of nodes, changing the HostOS version used on those nodes.
  * `DeployGuestosToAllSubnetNodes`: Deploy a GuestOS version to a specified subnet, changing the GuestOS version used on that subnet. The version must be in the list of elected GuestOS versions. The upgrade is complete when the subnet nodes create the next regular CUP, and then all subnet nodes restart and load the CUP with the new code.
  * `DeployGuestosToSomeApiBoundaryNodes`: Update the GuestOS version on a set of API Boundary Nodes.
  * `DeployGuestosToAllUnassignedNodes`: Update the GuestOS version on all unassigned nodes.



## Topic `Governance`

This topic covers proposals for governing the Internet Computer. In contrast to most other topics, which have reward weight 1, governance proposals have reward weight 20. This means that participation in this topic is rewarded more.

This topic includes the following proposal types:

  * `Motion`: Motion proposals are the only proposals that don't have a direct onchain effect. Rather they can be used as polls that should guide the future strategy of the ICP ecosystem.
  * `UninstallCode`: Uninstall code of a canister.
  * `SetDefaultFollowees`: Sets default following. Newly created NNS neurons will be created with this default choice of followers for the topics.
  * `KnownNeuron`: This proposal registers a [known neuron](https://learn.internetcomputer.org/hc/en-us/articles/34084120668692#h_01JN0SR92VPHVFPYXWAHKF3BYP) or, if a known neuron with this ID and name is already registered, it updates the known neuron. A known neuron has the following attributes. 
    * `string name`: a name that identifies the know neuron.
    * `optional string description`: a description, for example what person or group is controlling the neuron, what their background is, and how they intend to vote.
    * `repeated string links`: a list of links, for example to socials where voters can find more information.
    * `repeated Topic committed_topics`: a list of proposal topics that the neuron commits to voting on.
  * `DeregisterKnownNeuron`: This proposal de-registers a known neuron. That is it removes the neuron with the given neuron ID from the list of [known neurons.](https://learn.internetcomputer.org/hc/en-us/articles/34084120668692#h_01JN0SR92VPHVFPYXWAHKF3BYP)



## Topic `SnsAndCommunityFund`

This topic includes proposals that concern SNS decentralization swaps and the Neurons' Fund (formerly called Community Fund). In contrast to most other topics, this topic has reward weight 20. This means that participation in this topic is rewarded more.

This topic currently only includes one proposal type:

  * `CreateServiceNervousSystem`: This proposal installs a set of canisters for a new SNS DAO and specifies all settings, including the initial token distribution, the conditions for the initial decentralization swap, the initial SNS DAO parameters, as well as the Neurons' Fund contribution.



## Topic `NetworkEconomics`

This topic includes proposals concerning network economics. This topic contains the following proposal types:

  * `UpdateNodeRewardsTable`: Update the node rewards table. This table is the basis for distributing rewards to node providers according to some rules, depending on where they are. You can find more information and the current reward table on [this Wiki page](https://wiki.internetcomputer.org/wiki/Node_Provider_Remuneration).
  * `NetworkEconomics`: Network economics contains the parameters for several operations related to the economy of the network and settings of the NNS DAO that can be changed by a proposal of this type.  
A single proposal can update one or several economic parameters. The default values (0) are considered unchanged. Thus, a valid proposal only needs to set the parameters that it wishes to change. Note that this also means that it is not possible to set any of the values to 0.  
The following parameters can be changed: 
    * **Reject cost** : The amount of ICP the proposer of a rejected proposal will be charged to prevent the spamming of frivolous proposals.
    * **Minimum neuron stake** : Set the minimum number of ICP required for the creation of a neuron. The same limit must also be respected when increasing the dissolve delay or changing the neuron state from dissolving to aging.
    * **Neuron management fee** : The cost in ICP per neuron management proposal. Here the NNS is doing work on behalf of a specific neuron, and a small fee will be applied to prevent overuse of this feature (i.e., spam).
    * **Minimum ICP/XDR rate** : To prevent mistakes, there is a lower bound for the ICP/XDR rate, managed by network economic proposals.
    * **Dissolve delay of spawned neurons** : The dissolve delay of a neuron spawned from the maturity of an existing neuron.
    * **Maximum node provider rewards** : The maximum rewards to be distributed to node providers in a single distribution event (proposal).
    * **Transaction fee** : The transaction fee that must be paid for each ledger transaction.
    * **Maximum number of proposals to keep per topic** : The maximum number of proposals to keep, per topic. When the total number of proposals for a given topic is greater than this number, the oldest proposals that have reached a “final” state may be deleted to save space
    * **Neurons' Fund economics** : This includes all parameters related to the [Neurons' Fund](https://learn.internetcomputer.org/hc/en-us/articles/34084179554196): 
      * `max_theoretical_neurons_fund_participation_amount_xdr`: A theoretical limit which should be smaller than any realistic amount of maturity that practically needs to be reserved from the Neurons' Fund for a given SNS swap.
      * `neurons_fund_matched_funding_curve_coefficients`: Defines a threshold specifying the shape of the matching function used by the Neurons' Fund to determine how much to contribute for a given direct participation amount.
      * `minimum_icp_xdr_rate` and `maximum_icp_xdr_rate` are respectively the minimum and maximum value of the ICP/XDR conversion rate used by the Neurons' Fund for converting XDR values into ICP.
    * **Voting Power economics** : This includes all parameters that affect the voting power of neurons. 
      * `start_reducing_voting_power_after_seconds`: A neuron has to regularly take any of the three actions: vote directly, set vote delegations, [confirm the vote delegations.](https://learn.internetcomputer.org/hc/en-us/articles/34084120668692#h_01JJ2G9K5P709E5TQDRKTT3ZTP) If the neurons hasn't done so for a period of time, its deciding voting power starts decreasing linearly. This number decides after which period of time this is the case.
      * `clear_following_after_seconds`: A neuron has to regularly take any of the three actions: vote directly, set vote delegations, [confirm the vote delegations.](https://learn.internetcomputer.org/hc/en-us/articles/34084120668692#h_01JJ2G9K5P709E5TQDRKTT3ZTP) If the neurons hasn't done so for a period of time, its deciding voting power starts decreasing linearly (see last parameter) until it reaches zero. At this time, all voting delegations ("following") are removed. This parameter defines after which period of not taking the necessary actions this point is reached where following is removed.
      * `neuron_minimum_dissolve_delay_to_vote_seconds`: The minimum dissolve delay a neuron must have in order to be eligible to vote. Neurons with a dissolve delay lower than this threshold are not eligible to vote on proposals, even if they are otherwise active.
  * `ClearProvisionalWhitelist`: Clears the provisional whitelist, which allows the listed principals to create canisters with cycles. The mechanism is only needed for bootstrapping and testing and must be deactivated afterward.



## Topic `SubnetManagement`

All proposals that change the network's subnet topology and configuration.

The following proposal types relate to the creation and composition of subnets:

  * `CreateSubnet`: Combine a specified set of nodes, typically drawn from data centers and operators in such a way as to guarantee their independence, into a new subnet. The execution of this proposal first initiates a new instance of the distributed key generation protocol.  
The transcript of that protocol is written to a new subnet record in the registry, together with the initial configuration information for the subnet, from where the nodes comprising the subnet pick it up.
  * `UpdateConfigOfSubnet`: Update a subnet's configuration. This proposal updates the subnet record in the registry, with the changes being picked up by the nodes on the subnet when they reference the respective registry version. Subnet configuration comprises protocol parameters that must be consistent across the subnet (e.g. message sizes).
  * `AddNodeToSubnet`: Add a new node to a subnet. The node cannot be currently assigned to a subnet. The execution of this proposal changes an existing subnet record to add a node. From the perspective of the NNS, this update is a simple update of the subnet record in the registry.
  * `RemoveNodesFromSubnet`: Remove a node from a subnet. It then becomes available for reassignment. The execution of this proposal changes an existing subnet record to remove a node. From the perspective of the NNS, this update is a simple update of the subnet record in the registry.
  * `ChangeSubnetMembership`: Change the subnet node membership. This function combines the functions for adding and removing nodes from the subnet record into one, adding the property of atomic node replacement (node swap) on top. The nodes that are being added to the subnet must be currently unassigned. The nodes that are being removed from the subnet must be currently assigned to the subnet.
  * `RecoverSubnet`: Update a subnet’s recovery CUP used to recover subnets that have stalled. Nodes that find a recovery CUP for their subnet will load that CUP from the registry and restart the replica from that CUP.



The following proposal types relate to firewall rules:

  * `SetFirewallConfig:` Change the firewall configuration in the registry and define which boundary nodes the subnet replicas will communicate with.
  * `AddFirewallRules`: Add firewall rules in the registry.
  * `RemoveFirewallRules`: Remove firewall rules in the registry.
  * `UpdateFirewallRules`: Update firewall rules in the registry.



The following proposal types define which principals can create canisters on which subnets, managed by the cycles minting canister:

  * `SetAuthorizedSubnetworks`: Informs the cycles minting canister that a certain principal is authorized to use certain subnetworks (from a list). Can also be used to set the “default” list of subnetworks that principals without special authorization are allowed to use.
  * `UpdateSubnetType`: Updates the available subnet types in the cycles minting canister.
  * `ChangeSubnetTypeAssignment`: Changes the assignment of subnets to subnet types in the cycles minting canister.
  * `UpdateSnsWasmSnsSubnetIds`: Update the list of SNS subnet IDs that SNS Wasm will deploy SNS instances to.



The following proposal types are used for canister migration, e.g., if it is ever needed to split a subnet:

  * `RerouteCanisterRanges`: Update the routing table in the registry which defines the range of canister IDs that are on which subnet.
  * `PrepareCanisterMigration`: Insert or update `canister_migrations` entries. This is used during a subnet migration of canisters (e.g., when a subnet needs to be split).
  * `CompleteCanisterMigration`: Remove `canister_migrations` entries. This is used during a subnet migration of canisters (e.g., when a subnet needs to be split).



##    
Topic `ParticipantManagement`

All proposals that administer network participants, notably data center and node provider identities. This topic contains the following proposal types:

  * `AddOrRemoveDataCenters`: Add or remove data center records in the registry.
  * `AddOrRemoveNodeProvider`: Assign or revoke an identity to a node provider and any associated key information regarding the legal person that should provide a way to uniquely identify it.



## Topic `NodeAdmin`

Proposals that administer node machines. This topic contains the following proposal types:

  * `AssignNoid`: Assign an identity to a node operator, such as a funding partner, associating key information regarding its ownership, the jurisdiction in which it is located, and other information. The node operator is stored as a record in the registry. It contains the remaining node allowance for that node operator, that is the number of nodes the node operator can still add to the ICP. When an additional node is added by the node operator, the remaining allowance is decreased.
  * `UpdateNodeOperatorConfig`: Change a node operator’s allowance in the registry.
  * `RemoveNodeOperators`: Remove a Node Operator from the registry.
  * `RemoveNodes`: Remove unassigned nodes from the registry.
  * `UpdateSshReadonlyAccessForAllUnassignedNodes`: A proposal to update SSH readonly access for all unassigned nodes.



## Topic `KYC`

This topic only includes the following type concerned with KYCing Genesis neurons:

  * `ApproveGenesisKYC`: When new neurons were created at Genesis, their KYC value was set to `GenesisKYC=false`. This restricts what actions they can perform. Specifically, they cannot spawn new neurons, and once their dissolve delays are zero, they cannot be disbursed and their balances unlocked to new accounts. This proposal sets `GenesisKYC=true` for batches of principals.



The Genesis event disburses all ICP in the form of neurons, whose principals must be KYCed. Consequently, all neurons created after Genesis have `GenesisKYC=true` set automatically since they must have been derived from balances that have already been KYCed.  
  


## Topic `NeuronManagement` (restricted voting)

A special topic that can be used for multiple users to collectively manage a neuron. Specifically, a neuron can be managed by the followees for this topic.

In a few aspects, `NeuronManagement` proposals behave differently than other proposals:

  * Only the neuron’s followers on this topic are allowed to vote (and thus have a ballot).
  * The [restrictions which private neurons can be followed](https://learn.internetcomputer.org/hc/en-us/articles/34084120668692#01JY3Q496PCW6VVT0R6XXST12S) do not apply to this topic.
  * Because the set of eligible voters for proposals on this topic is restricted, proposals on this topic have a shorter than normal voting period.



This topic only includes one proposal type:

  * `ManageNeuron`: The proposal calls a command on a specified target neuron. Only the followers of the target neuron may vote on these proposals.



