---
title: "Testing SNS Launch"
description: "How to test your SNS configuration before proposing a mainnet launch"
sidebar:
  order: 3
doc_type: how-to
level: advanced
last_verified: 2026-03-10
---

An SNS launch is irreversible once the decentralization swap succeeds. Thorough testing is critical before submitting your NNS proposal.

## Testing approaches

| Approach | Environment | Purpose |
|----------|-------------|---------|
| Local testing | Local replica | Full end-to-end launch simulation |
| Mainnet testflight | ICP mainnet | Validate with real infrastructure |

## Local testing with sns-testing

The [sns-testing](https://github.com/dfinity/sns-testing) repository provides scripts to simulate the entire SNS launch process on a local replica.

### What you can test

- Deploying SNS canisters with your init parameters.
- Running the decentralization swap.
- Submitting and voting on proposals.
- Upgrading dapp canisters through SNS governance.
- Exercising custom proposal types.

### Getting started

```bash
git clone https://github.com/dfinity/sns-testing.git
cd sns-testing
```

Follow the repository's README for setup instructions. The scripts handle deploying local NNS canisters, creating the SNS, and simulating the swap.

### Key testing steps

1. **Deploy your dapp locally** alongside the NNS and SNS infrastructure.
2. **Configure SNS init parameters** in your `sns_init.yaml`.
3. **Run the SNS creation flow** -- the scripts simulate the NNS proposal and automatic deployment.
4. **Participate in the swap** -- simulate ICP contributions from test identities.
5. **Verify post-launch governance** -- submit upgrade proposals, test treasury management, and validate custom proposals.

> The `sns-testing` repo is one approach. You are free to build your own testing framework, fork `sns-testing`, or combine it with other tools.

## Validating init parameters

Before testing the full flow, validate your configuration:

```bash
sns-cli validate --init-config-file sns_init.yaml
```

Check for:

- **Token distribution** -- Ensure allocations to treasury, developers, and swap sum correctly.
- **Swap bounds** -- Minimum and maximum ICP targets should be realistic.
- **Neuron parameters** -- Dissolve delays, voting rewards, and follow rules make governance workable.
- **Proposal thresholds** -- Ensure proposals can realistically reach quorum.

## Testing post-launch operations

Testing the launch itself is necessary but not sufficient. You should also verify that the dapp can be fully managed by the DAO:

- **Canister upgrades** -- Submit an SNS proposal to upgrade your dapp canister. Verify the Wasm is installed correctly.
- **Custom proposals** -- If your dapp uses custom proposal types, test that they execute correctly.
- **Asset canister management** -- If your dapp includes frontend assets, verify that asset updates work through SNS proposals.
- **Treasury operations** -- Test transferring tokens from the SNS treasury.

### Common issues found during testing

- Missing pipelines for creating upgrade proposals.
- Permissions that were previously admin-only but now need to go through governance.
- Missing monitoring for canister health and cycles.
- Custom proposal execution failures due to incorrect Candid encoding.

## Mainnet testflight

For a higher-fidelity test, you can run an SNS testflight on mainnet. This deploys real SNS canisters but with test parameters, allowing you to validate the process against production infrastructure.

Coordinate with the DFINITY SNS team for testflight access and guidance.

## Pre-launch checklist

Before submitting your NNS proposal:

- [ ] Local SNS testing passes end-to-end.
- [ ] Init parameters validated with `sns-cli validate`.
- [ ] Post-launch governance operations tested (upgrades, custom proposals).
- [ ] Tokenomics reviewed and documented publicly.
- [ ] Community discussion thread created on the [DFINITY forum](https://forum.dfinity.org/).
- [ ] NNS root added as co-controller of all dapp canisters.
- [ ] Asset canister permissions updated for decentralized control.
- [ ] Monitoring and alerting in place for dapp canisters.

## Further reading

- [Launching an SNS](/guides/governance/launching/) -- Full launch walkthrough.
- [Managing an SNS](/guides/governance/managing/) -- Post-launch operations.
- [sns-testing repository](https://github.com/dfinity/sns-testing)
