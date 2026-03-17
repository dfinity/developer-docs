---
title: "Offchain Calls"
description: "Call canister functions from frontends, scripts, and backend services using IC agent libraries"
sidebar:
  order: 4
icskills: []
---

TODO: Write content for this page.

<!-- Content Brief -->
Call canister functions from outside the IC using agent libraries. Explain the IC agent concept: a client-side library that constructs ingress messages, signs them, and sends them to boundary nodes. Cover the agent ecosystem: official agents for JavaScript/TypeScript (@dfinity/agent / @icp-sdk/core) and Rust (ic-agent), plus community agents for Go, Python, Java, Dart, .NET, Elixir, C, and others. Show basic setup and a query/update call example for the two official agents. Cover canister discovery (env vars, ic_env cookie, PUBLIC_*_CANISTER_ID), the query vs update distinction from the caller perspective (agents route queries to a single replica for speed and route updates through consensus for reliability — Candid annotations determine which type each method uses, and generated bindings handle this automatically), authentication context (anonymous, delegations from Internet Identity), and error handling. Show how generated bindings (from binding-generation) provide a typed interface. Link to community agents for other languages.

<!-- Source Material -->
- Portal: building-apps/interact-with-canisters/agents/overview (agent concept + language list)
- JS SDK: @icp-sdk/core (https://js.icp.build/core) -- HttpAgent, actor creation
- JS SDK: @icp-sdk/canisters (https://js.icp.build/canisters) -- canister utilities
- Rust agent: https://docs.rs/ic-agent/latest/ic_agent/
- Go agent (community): https://github.com/aviate-labs/agent-go
- Python agent (community): https://github.com/eliezhao/icp-py-core
- Java agent (community): https://github.com/ic4j/ic4j-agent
- Dart agent (community): https://github.com/AstroxNetwork/agent_dart
- .NET agent (community): https://github.com/Gekctek/ICP.NET
- Elixir agent (community): https://github.com/diodechain/icp_agent
- C agent (community): https://github.com/Zondax/icp-client-cpp

- icp-cli: concepts/canister-discovery.md
- Template: hello-world (frontend calling backend)
- Examples: hello-world (both), whoami (JS frontend)

<!-- Cross-Links -->
- guides/canister-calls/candid -- interface definitions (shared by all agents)
- guides/canister-calls/candid#binding-generation -- generating typed clients
- guides/canister-calls/onchain-calls -- canister-to-canister alternative
- guides/frontends/asset-canister -- deploying the frontend that makes these calls
- guides/authentication/internet-identity -- adding auth to calls
