---
title: "IC Dashboard APIs"
description: "Five public REST APIs for querying ICP network state: metrics, governance, ICRC tokens, ICP ledger, and SNS data."
sidebar:
  order: 16
---

The Internet Computer exposes five public REST APIs for querying live network state. All are read-only and require no authentication. Each has its own subdomain, versioned base path, and Swagger UI for interactive exploration.

| API | Base URL | Swagger / Docs |
|-----|----------|----------------|
| IC API | `https://ic-api.internetcomputer.org/api/v3/` | [swagger](https://ic-api.internetcomputer.org/api/v3/swagger) |
| Metrics API | `https://metrics-api.internetcomputer.org/api/v1/` | [docs](https://metrics-api.internetcomputer.org/api/v1/docs) |
| ICRC API | `https://icrc-api.internetcomputer.org/api/v1/` | [docs](https://icrc-api.internetcomputer.org/docs) |
| Ledger API | `https://ledger-api.internetcomputer.org/api/v1/` | [swagger](https://ledger-api.internetcomputer.org/swagger-ui/) |
| SNS API | `https://sns-api.internetcomputer.org/api/v1/` | [docs](https://sns-api.internetcomputer.org/docs) |

## IC API

**`https://ic-api.internetcomputer.org/api/v3/`** — general network data across 40 endpoint groups.

| Group | What it returns |
|-------|----------------|
| `metrics` | Prometheus metrics: instruction rate, node count, cycle burn rate, block rate, total subnets, registered canisters, neuron counts, community fund, energy consumption, and more |
| `daily_stats` | Daily aggregate throughput: update calls/s, query calls/s, message counts |
| `subnets` / `subnets v4` | Subnet list, subnet details, replica versions per subnet |
| `nodes` / `node_providers` | Node list with data center and operator, node provider details |
| `data_centers` | Data center locations and node counts |
| `boundary-node-locations` | Boundary node geographic distribution |
| `canisters` / `canisters v4` | Deployed canisters, canister details by ID |
| `neurons` / `neuron_voting_powers` | Neuron details, voting power, maturity modulation |
| `governance_metrics` | Aggregate governance statistics |
| `proposals` / `proposals_over_time` | Proposal list, participation rates, tallies, deadline extensions |
| `icp_xdr_conversion_rates` / `icp_usd_rate` | ICP token price and conversion rates |
| `bitcoin` | Bitcoin integration metrics |
| `block_heights` / `block_heights_over_time` | Block production data |
| `images` | Generated images for proposals, canisters, neurons, nodes, and more |

Full endpoint reference: [ic-api.internetcomputer.org/api/v3/swagger](https://ic-api.internetcomputer.org/api/v3/swagger)

## Metrics API

**`https://metrics-api.internetcomputer.org/api/v1/`** — time-series metrics, organized by topic.

| Group | What it returns |
|-------|----------------|
| `IC` | General ICP metrics: cycle burn rate, transaction rate |
| `Instructions` | Instruction execution rate over time |
| `Transactions` | Transaction counts and rates |
| `Blocks` | Block production metrics |
| `Governance` | Total voting power over time |
| `Conversion Rates` | ICP/XDR conversion rate history |
| `Bitcoin` | Bitcoin integration metrics over time |
| `Boundary Nodes` | Boundary node count over time |
| `Internet Identity` | Internet Identity user count over time |
| `Canisters` | Canister count over time |
| `Energy Consumption` | Network energy usage |
| `Trustworthy Metrics` | Certified block total metrics |

Full endpoint reference: [metrics-api.internetcomputer.org/api/v1/docs](https://metrics-api.internetcomputer.org/api/v1/docs)

## ICRC API

**`https://icrc-api.internetcomputer.org/api/v1/`** — data for any ICRC-standard token. Requires the token's ledger canister ID as a path parameter.

| Group | What it returns |
|-------|----------------|
| `accounts` | Accounts holding a token, account owner lookup |
| `transactions` | Transaction history, transaction details, transaction count and volume |
| `circulating-supply` | Circulating supply, supply values over time |
| `holders` | Account holders list |
| `total-supply` | Total token supply |
| `blocks` | Ledger blocks, block details |
| `ledgers` | Ledger list, ledger metadata |
| `token_values` | Token value data |
| `total-burned-per-day` | Daily burn totals |
| `total-new-accounts-per-day` | Daily new account creation |
| `transaction-count` / `transaction-volume` | Aggregate transaction metrics |
| `images` | Graph images for ledger, transactions, and accounts |

Full endpoint reference: [icrc-api.internetcomputer.org/docs](https://icrc-api.internetcomputer.org/docs)

## Ledger API

**`https://ledger-api.internetcomputer.org/api/v1/`** — data for the ICP ledger specifically. For other ICRC tokens, use the [ICRC API](#icrc-api) instead.

| Group | What it returns |
|-------|----------------|
| `Accounts` | Accounts that have made transactions, account balance history, transaction history per account |
| `Transactions` | Transaction history, transaction details, daily transaction counts |
| `Total & Circulating Supplies` | Total ICP supply, circulating supply, supply over time |
| `ICP Burned` | Total ICP burned |
| `Metrics` | Transaction volume metrics, unique accounts per day |

Full endpoint reference: [ledger-api.internetcomputer.org/swagger-ui/](https://ledger-api.internetcomputer.org/swagger-ui/)

## SNS API

**`https://sns-api.internetcomputer.org/api/v1/`** — data for all SNS instances deployed on ICP.

| Group | What it returns |
|-------|----------------|
| `snses` | List of all deployed SNSes |
| `neurons` | Neuron list for an SNS, neuron details, neuron count |
| `proposals` | Proposals for an SNS, proposal details, proposal count |
| `statistics` | SNS statistics |
| `healthchecks` | SNS health status |
| `images` | Generated images for SNS neurons, proposals |

Full endpoint reference: [sns-api.internetcomputer.org/docs](https://sns-api.internetcomputer.org/docs)

<!-- Upstream: informed by dfinity/portal docs/references/dashboard-apis.mdx -->
