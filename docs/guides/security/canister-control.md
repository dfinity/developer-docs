---
title: "Canister control"
description: "Security best practices for canister control: using governance frameworks such as the SNS, verifying the trust level of canisters you depend on, and loading assets only from trusted domains."
sidebar:
  order: 10
---

## Use a governance framework such as the SNS to control your canisters

### Security concerns

If single entities or small groups control canisters, they can apply changes or updates whenever they like. If a canister, e.g., holds assets such as ICP, ckBTC, or ckETH on a user's behalf, this effectively means that the controller could decide at any time to steal these funds through methods such as updating the canister and transferring the assets to their account.

Furthermore, the controller of canisters serving web content (such as e.g., the asset canister) could maliciously modify the web application to e.g., steal user funds or perform security-sensitive actions on the user's behalf. For example, if [Internet Identity](../authentication/internet-identity.md) is used, the user principal's private key for the given origin is stored in the browser storage, and a malicious app can therefore fully control the private key, the user's session, and any assets controlled by that key.

Dapps are commonly reachable over their own custom domain name instead of ic0.app. These domains are registered with a DNS registrar by one of the developers. The developer can choose to have this domain point at a completely different web application, even one not hosted on ICP. Users will trust this domain and the app it serves. This could allow such a developer to steal funds, leak data, etc.

An app might have privileged features that are only accessible to principals that are on an allow list. For example, minting new tokens, debugging functions, managing permissions, removing NFTs for digital rights violations, etc. This means that whoever controls that principal (such as the app developers) may have central control over these privileged features.

For performance or privacy reasons, some components of an app may be hosted on external infrastructure. These external components often control principals used to interact with the canisters and are usually controlled by a developer holding credentials to the cloud environment. On top of that, third parties such as cloud providers can inspect and manipulate data in this environment if they choose. They could take ICP principal private keys out of this environment and call privileged operations on the canisters. External components can quickly lead to many additional centrally trusted parties. Depending on the value managed by an app, these parties could be tempted to act maliciously.

### Recommendations

In the following list, we first provide recommendations for centralized canister control and then move to recommendations for increasingly decentralized settings. From a security perspective, more decentralization is favorable. The following list could also be used as a basis for assessing an app's level of decentralization. This is just a set of recommendations and may be incomplete.

1. **The app uses central, external components:** The application makes use of centralized components such as those running in the cloud. The owners of these cloud services have full control over the application and assets managed by it. Your application should likely be further decentralized by avoiding central components. But while you have them, [securely manage your keys in the cloud](https://cloudsecurityalliance.org/research/topics/cloud-key-management/).
2. **The app is controlled by the developer team:** Your project is not under decentralized control, for example, because it is in an early development stage or does not (yet) hold significant funds. In that case, it is recommended to manage access to your canisters securely and ideally not let individuals control the application. To achieve that, consider the following:
    - Require approval by several individuals or parties to perform any canister controller operations.
    - Require approval by several individuals or parties for any security-sensitive changes at the application level that are restricted to privileged principals, such as admin operations including permissions management, minting new tokens, removing NFTs for digital rights violations, etc.
    - A helpful tool to achieve either of the above two points is the [orbit station canister](https://github.com/dfinity/orbit) which allows you to configure intricate policies for canister control. [Orbit](https://orbit.global/) also serves as an enterprise wallet where token funds are governed using policies. Ideally, individuals also manage their key material using hardware security modules, such as [YubiHSM](https://www.yubico.com/ch/store/yubihsm-2-series/) and physically protect these through methods such as using safes at different geographical locations. Some of HSMs support threshold signature schemes, which can help to further secure the setup.
3. **Full community governance**: The app is controlled by a governance framework such as ICP's [Service Nervous System (SNS)](../../concepts/governance.md#the-service-nervous-system), so that any security-sensitive changes to the canisters are only executed if the SNS community approves them collectively through a proposal voting mechanism. If an SNS is used:
    - Make sure voting power is distributed over many independent entities such that there is not one single or a few entities that can decide by themselves how the [community governance evolves](../../concepts/governance.md#neurons).
    - Ensure all components of the app are under SNS control, including the canisters serving the web frontends; see [SNS asset canisters](../governance/managing.md).
    - Consider the [SNS preparation checklist](../governance/launching.md). Important points from a security perspective are tokenomics, disclosing dependencies to external components, and performing security reviews.
    - Rather than self-deploying the SNS code or building your own governance system, consider using the official SNS on the SNS subnet, as this guarantees that the SNS is running an NNS-blessed version and maintained as part of ICP.

An alternative to community governance (3. above) would be to create an immutable canister by removing the canister controller completely. This can be achieved by setting the controller to a [black hole canister](https://github.com/ninegua/ic-blackhole). However, note that this implies that the canister can **never** be upgraded, which may have severe implications in case a bug is found. The complexity of ICP apps and the fact that complex frontends are hosted as canisters means that black holed canisters are rarely the right solution. The option to use a governance framework and thus being able to upgrade canisters is a big advantage of the ICP ecosystem compared to other chains.

:::note
Contrary to some other chains, immutable canisters need cycles to run, and they can receive cycles.
:::

It is also possible to implement a custom governance canister on ICP from scratch. If you decide to do this, be aware that this is security critical and must be security reviewed carefully. Furthermore, users will need to verify that the governance canister is controlled by itself.

## Verify the control and trust level of canisters you depend on

### Security concern

If your app depends on a third-party canister (e.g., by making inter-canister calls to it), it is important to verify that the callee satisfies an appropriate level of decentralization. For example:
- If funds or cycles are transferred to a third-party canister, one might require the canister to be controlled by a governance framework, as otherwise these funds are centrally controlled.
- If inter-canister calls are made to a centrally controlled and potentially malicious canister, that canister could execute a denial of service attack on the caller or even trigger functional bugs; see [be aware of the risks involved in calling untrustworthy canisters](./inter-canister-calls.md#be-aware-of-the-risks-involved-in-calling-untrustworthy-canisters).

### Recommendation

If you interact with a canister that you require to be decentralized, make sure it is controlled by the NNS, a service nervous system (SNS) or a governance framework, and review under what conditions and by whom the canister can be changed.

## Don't load JavaScript or other assets from untrusted domains

### Security concern

Loading untrusted JavaScript from domains other than `<canister-id>.icp0.io` means you completely trust that domain. Also, assets loaded from these domains (incl. `<canister-id>.raw.icp0.io`) will not use asset certification.

If they deliver malicious JavaScript, they can take over the web app or account. This could, for example, happen by reading the private key managed by the ICP JavaScript agent from the browser's local storage.

Note that also loading other assets such as [CSS](https://xsleaks.dev/docs/attacks/css-injection/) from untrusted domains is a security risk.

### Recommendation

- Loading JavaScript and other assets from other origins should be avoided. Especially for security-critical applications, you can't assume other domains to be trustworthy.

- Make sure all the content delivered to the browser is served and certified by the canister using asset certification. This holds in particular for any JavaScript, but also for fonts, CSS, etc.

- Use a [content security policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) to prevent scripts and other content from other origins from being loaded at all. See also [define security headers, including a content security policy (CSP)](./overview.md#web-security).

## Related

- [Trust in canisters](../canister-management/trust-in-canisters.md): how to assess whether a canister you did not write is safe to interact with, including the full trust spectrum from developer-controlled to black-holed

<!-- Upstream: sync from dfinity/portal building-apps/security/decentralization.mdx -->
