---
title: "Network Economics"
description: "How the Internet Computer's economic model works: ICP uses, governance rewards, supply dynamics, and SNS asset configuration"
sidebar:
  order: 13
---

ICP's economic model is built around two native assets: **ICP** and **cycles**. They serve distinct purposes: ICP is a governance and value transfer digital asset; cycles are a stable-cost computational fuel that canisters consume to run. This separation keeps developer costs predictable regardless of ICP market price.

## ICP uses

ICP has four protocol-level uses:

**1. Governance participation.** ICP holders stake ICP to create [neurons](governance.md#neurons-and-voting-power) in the NNS governance system. Neurons vote on proposals and earn voting rewards in return. Staking longer increases voting power and rewards, creating an incentive for long-term alignment with the network.

**2. Cycle conversion.** ICP can be burned to mint cycles through the Cycles Minting Canister (CMC). Cycles are pegged to the XDR basket of currencies at a rate of 1 trillion cycles = 1 XDR. This means developer infrastructure costs are stable in fiat terms even as ICP's market price changes. See [Cycles](cycles.md) for details.

**3. Node provider rewards.** Nodes that run the Internet Computer are owned by independent node providers. These providers are compensated in newly minted ICP. Rewards are specified in XDR and converted to ICP based on a 30-day moving average exchange rate, so providers receive stable real-world compensation regardless of price fluctuations. The Cycles Minting Canister (CMC) fetches the ICP/XDR rate every 5 minutes from the exchange rate canister, which aggregates rates from external sources. It uses the start-of-day rates for the past 30 days to compute the moving average. The current conversion rate is available on the [ICP dashboard](https://dashboard.internetcomputer.org/network) and from the [CMC metrics endpoint](https://rkp4c-7iaaa-aaaaa-aaaca-cai.raw.icp0.io/metrics).

**4. SNS decentralization swaps.** Users can commit ICP to participate in the decentralization swap of an SNS. In return they receive the SNS's governance assets at a uniform price. The ICP raised enters the SNS treasury under NNS control and funds future development and operations.

Beyond these protocol uses, ICP functions as a medium of exchange and can be used to pay for services, NFTs, subscriptions, and other onchain activity.

## Governance rewards and maturity

Any ICP holder can stake ICP in a neuron to participate in NNS governance. Each day the NNS calculates a voting reward pot and distributes it among eligible neurons proportionally to their voting power and participation.

Reward rate schedule:
- **At genesis:** rewards are calibrated to distribute roughly 10% of total supply per year in annualized terms.
- **Over 8 years:** the rate declines to approximately 5% per year.

Rewards accumulate as **maturity** within the neuron, not as liquid ICP. Maturity can be converted to ICP (spawning), which at that point triggers the actual minting. This deferred minting means the total supply grows only when neurons choose to realize rewards, giving holders flexibility over when to enter circulation.

The daily reward amount is fixed (independent of total staked ICP), so lower overall participation means each participant earns a higher share. This self-regulating mechanism incentivizes participation.

## Supply dynamics

ICP has both inflationary and deflationary mechanisms:

**Inflationary:**
- New ICP is minted to pay node provider rewards.
- New ICP is minted when neurons spawn voting rewards as maturity.

**Deflationary:**
- ICP is burned when converted to cycles.
- ICP transaction fees are burned.
- Failed NNS proposals result in a small fee charged to the proposing neuron.

![ICP supply dynamics: governance rewards and node provider rewards increase supply; cycle conversion and transaction fees reduce it](/concepts/network-economics/deflation-inflation.png)

The net effect on supply depends on market conditions: when cycle demand is high (more computation), more ICP is burned. When governance participation is high, more ICP is minted. The [NNS dashboard](https://dashboard.internetcomputer.org/governance) shows live estimates of supply, staking, and annualized voting rewards.

## SNS economics

Each SNS deploys its own governance asset alongside its canister, with an economics configuration set at launch. The mechanics are similar to the NNS: staking for voting power, configurable voting reward minting, transaction fee burning, and a treasury for SNS-controlled spending.

Key parameters a team configures for their SNS:

- **Initial asset allocation**: how assets are split between the decentralization swap (community), SNS treasury, seed funders, and the development team. The SNS framework requires that at least as many assets are allocated to the swap as to the seed funders and development team combined.
- **Voting power**: teams can weight voting power by staking duration to encourage long-term commitment. The configuration must prevent the founding team from holding more than 50% of initial voting power.
- **Reward rate**: whether and at what rate the SNS mints new assets for governance participation.
- **Transaction fees**: a per-transfer fee that is burned, creating deflationary pressure.

SNS economics is entirely configurable and independent of the NNS economic model. Two SNS instances can have very different economic designs.

## Next steps

- [Governance](governance.md): NNS neurons, proposals, voting, and the SNS framework
- [Cycles](cycles.md): how cycle costs work and how ICP converts to cycles
- [Ledgers](ledgers.md): how ICP and other asset balances are tracked
- [Launching an SNS](../guides/governance/launching.md): the decentralization swap process

<!-- Upstream: informed by Learn Hub articles "Tokens and Governance", "Tokenomics", "SNS Tokenomics" (migrated, source retired) -->
