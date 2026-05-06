---
learn_hub_id: 34140499557908
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34140499557908-Neuron-Attributes"
learn_hub_title: "Neuron Attributes"
learn_hub_section: "NNS - Network Nervous System "
learn_hub_category: "How does ICP work?"
migrated: false
---

# Neuron Attributes

In the Network Nervous System (NNS), a [neuron](https://learn.internetcomputer.org/hc/en-us/articles/34084120668692) is an entity that participates in governance and holds voting power. Let's next look here at the detailed attributes of a neuron by looking at the [`Neuron` record](https://github.com/dfinity/ic/blob/173d06185f77265d97bc363d266ce79410f6b914/rs/nns/governance/canister/governance.did#L363C1-L386C3) in the interface of the [governance canister](https://dashboard.internetcomputer.org/canister/rrkah-fqaaa-aaaaa-aaaaq-cai).

  * `id : opt NeuronId`: A unique ID identifying the neuron. This is a number that is randomly chosen by the governance canister when a neuron is created.
  * `account : blob`: The neuron's account on the ICP token ledger, holding the tokens locked in the neuron. This corresponds to a subaccount of the NNS governance canister so that the tokens can only be transferred by dissolving the neuron.
  * `controller : opt principal`: The [principal](https://learn.internetcomputer.org/hc/en-us/articles/34250491785108) controlling the neuron. The controller has the permissions to read the neuron and perform any operations on the neuron.
  * `hot_keys : vec principal`: A list of principals that have limited permissions on the neuron. This can be used for example to use more accessible but less secure keys for everyday operations. Hotkey principals can read the neuron as well as vote with it, which includes both direct voting and changing following.
  * `cached_neuron_stake_e8s : nat64`: The amount of staked ICP tokens, measured in fractions of 10E-8 of an ICP token.
  * `neuron_fees_e8s : nat64`: The amount of ICP that this neuron has forfeited due to making proposals that were rejected or from using the functionality to manage other neurons through proposals. This value must be smaller than `neuron_stake_e8s`. When a neuron is disbursed, this amount of ICP is burned.
  * `created_timestamp_seconds : nat64`: The timestamp, in seconds from the Unix epoch, when the neuron was created.
  * `dissolve_state : opt DissolveState; type DissolveState = variant { DissolveDelaySeconds : nat64; WhenDissolvedTimestampSeconds : nat64; }`: The timer that defines how long the tokens in this neuron are locked for. When the neuron is dissolving, i.e., the timer is running down, this this stores the timestamp at which the neuron becomes dissolved `WhenDissolvedTimestampSeconds`. When the neuron is non-dissolving, `DissolveDelaySeconds` stores how much time, in seconds, is left until the neuron is dissolved when the dissolve timer is turned on again. A neuron is dissolved if `WhenDissolvedTimestampSeconds` is in the past or if `DissolveDelaySeconds` is zero.
  * `aging_since_timestamp_seconds : nat64`: The timestamp, in seconds from the Unix epoch, when this neuron last entered the non-dissolving state and has started aging. This value is meaningless when the neuron is dissolving and has age zero. The canonical value of this field for a dissolving neuron is `u64::MAX`.
  * `followees : vec record { int32; Followees }; type Followees = record { followees : vec NeuronId }`: The followees of a neuron, that is the group of neurons that this neuron follows. They are expressed as maps from proposal topics (expressed by integers) to a list of followees for this particular topic.
  * `recent_ballots : vec BallotInfo`: Information about how this neuron voted in the recent past.
  * `maturity_e8s_equivalent : nat64`: The accumulated unstaked maturity of the neuron, in e8s equivalent.
  * `staked_maturity_e8s_equivalent : opt nat64`: The accumulated staked maturity of the neuron, in e8s equivalent. Staked maturity becomes unstaked maturity once the neuron is dissolved.
  * `auto_stake_maturity : opt bool`: If set and true, the maturity rewarded to this neuron for voting will be automatically staked and will contribute to the neuron's voting power.
  * `spawn_at_timestamp_seconds : opt nat64`: This is used for neurons that were created when spawning maturity into a neuron. The value denotes the timestamp, in seconds from the Unix epoch, at which this neuron's maturity is replaced by newly minted ICP.
  * `visibility : opt int32`: The visibility defines how much information about this neuron is publicly accessible, i.e., visible to those who are neither the controller nor have hot-key privileges to this neuron. Visibility can be public, private, or undefined. For public neurons, the full neuron is accessible to everyone, for private neurons only subset of the fields is visible, which is encoded in the [`NeuronInfo` record](https://github.com/dfinity/ic/blob/173d06185f77265d97bc363d266ce79410f6b914/rs/nns/governance/canister/governance.did#L408) type, further excluding the fields `recent_ballots` and `joined_community_fund_timestamp_seconds`.
  * `voting_power_refreshed_timestamp_seconds` the time when the neuron last performed any of the following actions: direct voting, set following, or confirm following. This field is relevant for the neuron's voting power adjustment. If a neuron does not take any of these actions in more than 6 months (hence the timestamp is more than 6 months in the past from the current time), then the neuron has adjusted voting power. The adjustment has the effect that the neuron will have 0 voting power when this timestamp is 7 month in the past. At this time, the neuron's following choices will also be reset.
  * `known_neuron_data : opt KnownNeuronData; message KnownNeuronData { string name = 1; optional string description = 2; `: A neuron can be registered as a **known neuron** via proposal so that it can be followed by others. Known neurons have extra information, a name and optionally a description.
  * `joined_community_fund_timestamp_seconds : opt nat64`: Timestamp when this neuron joined the [neurons fund](https://learn.internetcomputer.org/hc/en-us/articles/34084179554196).
  * `transfer : opt NeuronStakeTransfer`: The record of the transfer that was made to create this neuron.
  * `kyc_verified : bool`: This is a field indicating whether genesis neurons have been KYC verified. `false` if this is a genesis neuron that has not been KYC verified.
  * `not_for_profit : bool`: Whether this neuron is "Not for profit", making it dissolvable by voting on a manage neuron proposal.
  * `neuron_type : opt int32`: The type of a neuron, identifying seed neurons and Early Contributor Token (ECT) neurons.



