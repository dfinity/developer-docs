---
title: "Application Canisters"
description: "Reference for the asset canister, SNS canisters, LLM canister, and other application-layer canisters with their interfaces and canister IDs"
sidebar:
  order: 8
---

Application canisters are well-known canisters at the application layer of the Internet Computer that developers commonly integrate into their projects. Unlike [system canisters](system-canisters.md) (which govern the network) or [protocol canisters](protocol-canisters.md) (which provide platform infrastructure), application canisters implement higher-level functionality: hosting web frontends, governing dapps via DAO, and running AI inference.

## Asset canister

The asset canister hosts static web assets — HTML, CSS, JavaScript, images, and other files — directly onchain. It is the standard way to deploy a web frontend on ICP. Responses are certified by the subnet, allowing HTTP gateways to verify integrity before serving content to browsers.

Asset canisters are deployed per-project. There is no global asset canister ID — each project creates its own.

### Recipe (icp.yaml)

```yaml
canisters:
  - name: frontend
    recipe:
      type: "@dfinity/asset-canister@v2.1.0"
      configuration:
        dir: dist
        build:
          - npm install
          - npm run build
```

- `recipe.type` — identifies this as an asset canister deployment
- `dir` — the build output directory whose contents are uploaded
- `build` — commands run automatically by `icp deploy` before uploading

### Interface

The asset canister exposes the following Candid methods:

**Permission management:**

| Method | Description |
|---|---|
| `grant_permission(arg)` | Grant a principal a permission role (Prepare, Commit, or ManagePermissions) |
| `revoke_permission(arg)` | Revoke a permission role from a principal |
| `list_permitted(arg)` | Query principals with a given permission role |
| `take_ownership()` | Caller becomes the sole authorized principal |

**Asset operations:**

| Method | Description |
|---|---|
| `store(arg)` | Upload a single asset in one call |
| `create_batch()` | Begin a chunked upload batch |
| `create_chunk(arg)` | Upload a chunk of a large asset |
| `commit_batch(arg)` | Finalize a batch and make assets live |
| `create_asset(arg)` | Create an asset entry without uploading content |
| `set_asset_content(arg)` | Set or replace the content of an asset |
| `unset_asset_content(arg)` | Remove content encoding from an asset |
| `delete_asset(arg)` | Delete an asset |
| `clear()` | Remove all assets from the canister |

**Asset queries:**

| Method | Description |
|---|---|
| `retrieve(key)` | Fetch raw asset bytes by key |
| `get(arg)` | Fetch an asset with encoding and metadata |
| `get_chunk(arg)` | Fetch a specific chunk of a large asset |
| `list()` | List all uploaded assets with metadata |
| `get_asset_properties(key)` | Query per-asset headers and aliasing settings |
| `set_asset_properties(arg)` | Set per-asset headers and aliasing |
| `certified_tree()` | Return the certificate tree for response verification |

**HTTP serving:**

| Method | Description |
|---|---|
| `http_request(req)` | Serve an HTTP request with certified response |
| `http_request_streaming_callback(token)` | Stream large responses in chunks |

### Configuration via `.ic-assets.json5`

Create `.ic-assets.json5` in your `dir` directory (or `public/`/`static/` so your build copies it):

```json5
[
  {
    "match": "**/*",
    "security_policy": "standard",
    "headers": {
      "Cache-Control": "public, max-age=0, must-revalidate"
    },
    "allow_raw_access": false
  },
  {
    "match": "assets/**/*",
    "headers": {
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  },
  {
    "match": "**/*",
    "enable_aliasing": true
  }
]
```

- `security_policy: "standard"` — applies the default Content Security Policy and security headers
- `allow_raw_access: false` — disables serving assets on the uncertified `raw.ic0.app` domain
- `enable_aliasing: true` — enables SPA fallback, serving `index.html` for unmatched paths

### Programmatic uploads

Use `@icp-sdk/canisters` (>= 3.5.0) to upload assets from code:

```javascript
import { AssetManager } from "@icp-sdk/canisters/assets";
import { HttpAgent } from "@icp-sdk/core/agent";

const agent = await HttpAgent.create({
  host: "https://ic0.app",
  shouldFetchRootKey: false,  // never fetch root key against mainnet
});

const assetManager = new AssetManager({
  canisterId: "your-asset-canister-id",
  agent,
});

// Upload a file (files >1.9MB are chunked automatically)
// fileBuffer: Uint8Array | ArrayBuffer | number[] — e.g. from fs.readFileSync, fetch, or the File API
await assetManager.store(fileBuffer, {
  fileName: "photo.jpg",
  contentType: "image/jpeg",
  path: "/uploads",
});

// List all assets
const assets = await assetManager.list();

// Delete an asset
await assetManager.delete("/uploads/old-photo.jpg");
```

### Wasm versioning

The asset canister Wasm version determines which features are available. Key versions:

- `0.30.2`+ — required for the `ic_env` cookie (used by `safeGetCanisterEnv()` from `@icp-sdk/core`)
- Omitting `configuration.version` in the recipe uses the latest version automatically

Downgrading the Wasm version may fail if the stable memory format changed between versions. If a downgrade is necessary, use `icp deploy --mode reinstall` (wipes all stored assets).

For version history, upgrade guidance, and deployment pitfalls, see the [Asset canister guide](../guides/frontends/asset-canister.md).

---

## SNS canisters

When an SNS (Service Nervous System) is launched for a dapp, the SNS-W canister deploys a set of governance canisters on an SNS subnet. These canisters are created per-dapp — there is no single global SNS. To find the canister IDs for a specific SNS, look up the dapp on the [ICP Dashboard](https://dashboard.internetcomputer.org/).

### Canister set per SNS

| Canister | Purpose |
|---|---|
| **Governance** | Proposal submission, voting, neuron management |
| **Ledger** | SNS token transfers (ICRC-1 standard) |
| **Root** | Sole controller of all dapp canisters post-launch |
| **Swap** | Runs the decentralization swap (ICP for SNS tokens) |
| **Index** | Transaction indexing for the SNS ledger |
| **Archive** | Historical transaction storage |

### SNS governance interface

The governance canister is the primary interface for SNS operations:

| Method | Description |
|---|---|
| `manage_neuron` | Create, configure, or vote with a neuron |
| `get_neuron` | Query a neuron's state and voting power |
| `list_neurons` | List neurons for a principal |
| `get_proposal` | Query a proposal |
| `list_proposals` | List proposals with filtering |
| `get_nervous_system_parameters` | Query the current governance parameters |
| `get_metadata` | Query the SNS name, description, and logo |

### SNS ledger

The SNS ledger implements ICRC-1, ICRC-2, and ICRC-3. The key methods are the same as any ICRC-1 ledger:

| Method | Description |
|---|---|
| `icrc1_transfer` | Transfer SNS tokens |
| `icrc1_balance_of` | Query an account balance |
| `icrc1_total_supply` | Query the total token supply |
| `icrc2_approve` | Approve a spender |
| `icrc2_transfer_from` | Transfer on behalf of an approver |
| `icrc3_get_blocks` | Query transaction history (ICRC-3 transaction log) |

For token standard details, see [Token Standards](token-standards.md).

### Querying SNS canister IDs at runtime

After an SNS is launched, call the `list_sns_canisters` method on the Root canister to retrieve the IDs of all canisters in the set:

```bash
icp canister call <sns_root_id> list_sns_canisters '()' -e ic
# Returns: record { root: principal; swap: principal; ledger: principal; index: principal; governance: principal; dapps: vec principal; archives: vec principal }
```

For SNS launch configuration and governance setup, see [Launching an SNS](../guides/governance/launching.md).

---

## LLM canister

The LLM canister provides onchain AI inference using large language models, enabling canisters to generate text, run chat completions, and build AI agents without external API keys.

| Field | Value |
|---|---|
| Canister ID | [`w36hm-eqaaa-aaaal-qr76a-cai`](https://dashboard.internetcomputer.org/canister/w36hm-eqaaa-aaaal-qr76a-cai) |
| Candid interface | [llm-canister-ollama.did](https://github.com/dfinity/llm/releases/latest/download/llm-canister-ollama.did) |

### Supported models

| Model | Identifier |
|---|---|
| Llama 3.1 8B | `Llama3_1_8B` |

### Rust: `ic-llm` library

Add the `ic-llm` crate to your project:

```toml
[dependencies]
ic-cdk = "0.17"
ic-llm = "1.1.0"
```

**Single-turn prompt:**

```rust
use ic_cdk::update;
use ic_llm::{ChatMessage, Model};

#[update]
async fn prompt(prompt_str: String) -> String {
    ic_llm::prompt(Model::Llama3_1_8B, prompt_str).await
}
```

**Multi-turn chat:**

```rust
use ic_cdk::update;
use ic_llm::{ChatMessage, Model};

#[update]
async fn chat(messages: Vec<ChatMessage>) -> String {
    let response = ic_llm::chat(Model::Llama3_1_8B)
        .with_messages(messages)
        .send()
        .await;

    response.message.content.unwrap_or_default()
}
```

### Motoko: `llm` library (mops)

Add the `llm` package to your `mops.toml`:

```toml
[dependencies]
llm = "2.1.0"
```

**Single-turn prompt:**

```motoko
import LLM "mo:llm";

persistent actor {
  public func prompt(prompt : Text) : async Text {
    await LLM.prompt(#Llama3_1_8B, prompt);
  };
};
```

**Multi-turn chat:**

```motoko
import LLM "mo:llm";

persistent actor {
  public func chat(messages : [LLM.ChatMessage]) : async Text {
    let response = await LLM.chat(#Llama3_1_8B).withMessages(messages).send();

    switch (response.message.content) {
      case (?text) text;
      case null "";
    };
  };
};
```

### Local development

The LLM canister requires an Ollama server for local testing:

```bash
# Start the Ollama server
ollama serve

# Pull the model (one-time download, ~4 GiB)
ollama pull llama3.1:8b
```

icp-cli does not yet have an equivalent of dfx's `"type": "custom"` / `"remote"` canister configuration for pointing a local replica at the Ollama-backed LLM Wasm. To test the LLM canister locally, use the example project from [dfinity/examples](https://github.com/dfinity/examples/tree/master/rust/llm_chatbot) which includes the `dfx.json` configuration needed for this setup.

For a complete onchain AI guide, see [Onchain AI](../guides/backends/onchain-ai.md).

---

## Quick reference

| Canister | Canister ID | Purpose |
|---|---|---|
| Asset canister | Per-project | Static web asset hosting with HTTP certification |
| SNS governance | Per-dapp | DAO governance for a specific dapp |
| SNS ledger | Per-dapp | ICRC-1/ICRC-2/ICRC-3 token ledger for a specific SNS |
| SNS root | Per-dapp | Controller of all dapp canisters in the SNS set |
| SNS swap | Per-dapp | Decentralization swap (ICP for SNS tokens) |
| LLM | `w36hm-eqaaa-aaaal-qr76a-cai` | Onchain AI inference (Llama 3.1 8B) |

## Next steps

- [Asset canister guide](../guides/frontends/asset-canister.md) — deploying and configuring the asset canister for your project
- [Launching an SNS](../guides/governance/launching.md) — how to decentralize a dapp with SNS
- [Onchain AI](../guides/backends/onchain-ai.md) — building AI-powered canisters with the LLM canister
- [System canisters](system-canisters.md) — NNS, Internet Identity, ICP ledger, and other network-level canisters
- [Protocol canisters](protocol-canisters.md) — Bitcoin, ckBTC, EVM RPC, and other protocol-layer canisters

<!-- Upstream: informed by dfinity/icskills — skills/asset-canister/SKILL.md, skills/sns-launch/SKILL.md; dfinity/portal — docs/references/asset-canister.mdx; dfinity/examples — rust/llm_chatbot, motoko/llm_chatbot -->
