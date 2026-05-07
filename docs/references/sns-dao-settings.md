---
title: "SNS Settings"
description: "Reference for all SNS nervous system parameters (NervousSystemParameters)"
---

Each SNS is customized through its **nervous system parameters**, also called SNS settings. These parameters govern voting power calculation, governance rules, digital asset economics, and reward behavior. Parameters are set at launch and can be changed by governance proposal at any time.

For background, see [SNS framework](../concepts/sns-framework.md).

## Neuron settings

| Parameter | Type | Description |
|---|---|---|
| `neuron_minimum_stake_e8s` | `nat64` | Minimum number of e8s (10⁻⁸ of the SNS digital asset) that can be staked in a neuron. Must be larger than `transaction_fee_e8s`. |
| `max_number_of_neurons` | `nat64` | Maximum number of neurons allowed. New neurons are blocked once this ceiling is reached. Ceiling: 200,000. |
| `max_number_of_principals_per_neuron` | `nat64` | Maximum number of principals that can hold permissions for a single neuron. |
| `neuron_claimer_permissions` | permission set | The set of permissions automatically granted to the principal that claims a new neuron. |
| `neuron_grantable_permissions` | permission set | The superset of permissions that a principal with `ManagePrincipals` permission can grant to others on the same neuron. |
| `default_followees` | map | Default following rules applied to every newly created neuron, as a mapping of proposal function IDs to followee neuron IDs. |
| `max_followees_per_function` | `nat64` | Maximum number of followees a neuron can configure per proposal function. Ceiling: 15. |

## Voting power settings

| Parameter | Type | Description |
|---|---|---|
| `neuron_minimum_dissolve_delay_to_vote_seconds` | `nat64` | Minimum dissolve delay a neuron must have to be eligible to vote. Must be less than `max_dissolve_delay_seconds`. |
| `max_dissolve_delay_seconds` | `nat64` | Maximum dissolve delay achievable by a neuron. The dissolve delay bonus is saturated at this value. |
| `max_dissolve_delay_bonus_percentage` | `nat64` | Additional voting power percentage granted at maximum dissolve delay. Set to 100 for a 2x bonus (matching NNS behavior). Set to 0 for no bonus. |
| `max_neuron_age_for_age_bonus` | `nat64` | Maximum neuron age (seconds) at which the age bonus is saturated. |
| `max_age_bonus_percentage` | `nat64` | Additional voting power percentage granted at maximum age. Set to 25 for a 1.25x bonus (matching NNS behavior). Set to 0 for no bonus. |

## Proposal and governance settings

| Parameter | Type | Description |
|---|---|---|
| `reject_cost_e8s` | `nat64` | Fee (in e8s) charged to the proposer when a proposal is rejected, to discourage spam. |
| `initial_voting_period_seconds` | `nat64` | Initial voting period for non-critical proposals. The actual period may be extended by wait-for-quiet. Does not affect existing proposals. |
| `wait_for_quiet_deadline_increase_seconds` | `nat64` | Maximum total extension added by wait-for-quiet when a proposal outcome flips. The voting period can increase by at most twice this value. Does not affect existing proposals. |
| `max_proposals_to_keep_per_action` | `nat64` | Maximum number of proposals retained per proposal type. When exceeded, the oldest finalized proposals are eligible for deletion. Ceiling: 700. |
| `max_number_of_proposals_with_ballots` | `nat64` | Maximum number of open (unsettled) proposals with stored ballots. When reached, only a few critical proposal types can still be submitted. Ceiling: 700. |

## Digital asset and fee settings

| Parameter | Type | Description |
|---|---|---|
| `transaction_fee_e8s` | `nat64` | Per-transfer fee on the SNS ledger, in e8s. Does not apply to minting or burning. |

## Voting reward settings

All reward settings live inside a single nested field: **`voting_rewards_parameters`**. If this field is absent, voting rewards are disabled.

| Parameter | Full field name | Description |
|---|---|---|
| round duration | `round_duration_seconds` | Length of a single reward distribution round, in seconds. Rewards are distributed to voting neurons at the end of each round. Default: 86,400 (1 day). |
| r\_max | `initial_reward_rate_basis_points` | Starting annualized reward rate as a fraction of total supply, in basis points (100 = 1%). |
| r\_min | `final_reward_rate_basis_points` | Floor reward rate after the transition period, in basis points. Set to 0 to end issuance after `t_delta`. |
| t\_delta | `reward_rate_transition_duration_seconds` | Duration of the quadratic decline from r\_max to r\_min, in seconds. |
| t\_start | `start_timestamp_seconds` | Timestamp (Unix seconds) when reward accrual begins. Set automatically to the current time when rewards are first enabled. |

## Maturity modulation

| Parameter | Type | Description |
|---|---|---|
| `maturity_modulation_disabled` | `opt bool` | If true, maturity modulation is disabled for this SNS: the ±5% conversion randomness is not applied when neuron holders disburse maturity. The CMC is still polled but the fetched value is ignored. Default: false (modulation enabled). |

## SNS framework upgrade

| Parameter | Type | Description |
|---|---|---|
| `automatically_advance_target_version` | `opt bool` | If true, the SNS automatically upgrades to the latest NNS-approved SNS version without a governance proposal. Defaults to true for newly created SNSs, false for older ones. |

<!-- Upstream: informed by Learn Hub article "DAO Settings" (migrated, source retired); hand-written based on NervousSystemParameters protobuf spec -->
