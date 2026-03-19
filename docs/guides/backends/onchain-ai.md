---
title: "Onchain AI"
description: "Call large language models directly from canister code using the LLM canister"
sidebar:
  order: 8
---

TODO: Write content for this page.

<!-- Content Brief -->
Guide for using the LLM canister (`w36hm-eqaaa-aaaal-qr76a-cai`) to call large language models directly from canister code. Cover: (1) What the LLM canister is — an onchain service providing access to LLMs without HTTPS outcalls, (2) Setup — adding the `ic-llm` crate (Rust) or `llm` package from mops (Motoko) to your project, (3) Prompt API — simple one-shot prompts with `LLM.prompt()`, (4) Chat API — multi-message conversations with system/user/assistant roles, (5) Streaming responses, (6) Limitations — 10 messages per chat, 10KiB prompt size, 200-token output limit, (7) Currently supported models (Llama 3.1 8B), (8) Cycles costs (free during initial rollout). Show code examples in both Rust and Motoko. Explain how this differs from calling external AI APIs via HTTPS outcalls (decentralized inference, no API keys, deterministic via random beacon seeding).

<!-- Source Material -->
- Forum post: https://forum.dfinity.org/t/introducing-the-llm-canister-deploy-ai-agents-with-a-few-lines-of-code/41424
- Rust library: docs.rs/ic-llm
- Motoko library: mops.one/llm
- Examples: llm_chatbot (Rust), llm_chatbot (Motoko) from dfinity/examples

<!-- Cross-Links -->
- ../backends/https-outcalls -- alternative approach (external AI APIs)
- ../../concepts/canisters -- what canisters are
- ../../concepts/app-architecture -- where LLM fits in app design
