# icp-cli Ecosystem + Examples Inventory

Compiled 2026-03-11. Sources: icp-cli/docs (33 files), icp-cli-recipes (4 recipes), icp-cli-templates (6 templates), dfinity/examples (~97 examples).

---

## icp-cli Docs → Developer Docs

| icp-cli Page | Developer Docs Page | Relationship |
|---|---|---|
| `index.md` (landing) | guides/tools/overview | link — landing page for icp-cli site |
| `quickstart.md` | getting-started/quickstart | sync — our quickstart should mirror icp-cli's quickstart closely |
| `tutorial.md` | getting-started/quickstart, getting-started/project-structure | link — tutorial is the detailed version of quickstart |
| `telemetry.md` | (none) | link only — reference from tools/overview |
| **Concepts** | | |
| `concepts/project-model.md` | getting-started/project-structure | sync candidate — icp.yaml structure, .icp/ directory, canister discovery |
| `concepts/build-deploy-sync.md` | guides/canister-management/lifecycle | link — deploy lifecycle is core canister lifecycle content |
| `concepts/environments.md` | guides/canister-management/cycles-management, guides/canister-management/settings | link — environments are key for multi-env deployments |
| `concepts/recipes.md` | getting-started/project-structure, guides/tools/overview | link — recipes are a core icp-cli concept |
| `concepts/canister-discovery.md` | guides/canister-calls/onchain-calls, guides/frontends/asset-canister | sync candidate — canister env vars, frontend-to-backend wiring |
| `concepts/binding-generation.md` | guides/canister-calls/binding-generation | sync candidate — this is exactly the binding generation topic |
| **Guides** | | |
| `guides/installation.md` | getting-started/quickstart | sync candidate — install steps must be in our quickstart |
| `guides/local-development.md` | getting-started/quickstart, guides/frontends/asset-canister | link — dev workflow, frontend dev server setup |
| `guides/deploying-to-mainnet.md` | guides/canister-management/cycles-management | sync candidate — identity, ICP, cycles, deploy workflow |
| `guides/deploying-to-specific-subnets.md` | guides/canister-management/subnet-selection | sync candidate — subnet selection, colocation |
| `guides/canister-snapshots.md` | guides/canister-management/snapshots | sync candidate — this IS the snapshots guide |
| `guides/canister-migration.md` | guides/canister-management/lifecycle | link — advanced canister migration |
| `guides/managing-environments.md` | guides/canister-management/cycles-management | link — multi-env setup |
| `guides/managing-identities.md` | guides/defi/wallet-integration | link — identity management reference |
| `guides/tokens-and-cycles.md` | guides/canister-management/cycles-management, guides/defi/token-ledgers | link — ICP/cycles/ICRC-1 token commands |
| `guides/containerized-networks.md` | guides/testing/strategies | link — Docker-based test networks |
| `guides/using-recipes.md` | getting-started/project-structure | link — how to configure build recipes |
| `guides/creating-recipes.md` | (none) | link only — advanced topic for recipe authors |
| `guides/creating-templates.md` | (none) | link only — advanced topic for template authors |
| **Reference** | | |
| `reference/cli.md` | guides/tools/overview | link — always link to https://dfinity.github.io/icp-cli/ |
| `reference/configuration.md` | getting-started/project-structure | link — icp.yaml schema reference |
| `reference/canister-settings.md` | guides/canister-management/settings | link — all canister settings |
| `reference/environment-variables.md` | guides/canister-calls/onchain-calls, guides/frontends/asset-canister | link — env vars for build and runtime |
| **Migration** | | |
| `migration/from-dfx.md` | guides/tools/migrating-from-dfx | sync — already auto-synced from icp-cli repo |

---

## Recipes → Developer Docs

| Recipe | Latest Version | Developer Docs Pages | What to Show |
|---|---|---|---|
| `@dfinity/rust` | v3.1.0 | getting-started/quickstart, getting-started/project-structure | Inline icp.yaml snippet showing recipe config; link to recipe README for params |
| `@dfinity/motoko` | v4.0.0 | getting-started/quickstart, getting-started/project-structure | Inline icp.yaml snippet showing recipe config; link to recipe README for params |
| `@dfinity/asset-canister` | v2.1.0 | guides/frontends/asset-canister, getting-started/project-structure | Inline icp.yaml snippet; explain build/dir/version params; link to recipe README |
| `@dfinity/prebuilt` | v2.0.0 | guides/canister-management/lifecycle, guides/canister-management/reproducible-builds | Inline icp.yaml snippet for deploying pre-built WASM; mention sha256 verification |

### Recipe icp.yaml Snippets to Inline

**Rust recipe** (~8 lines):
```yaml
canisters:
  - name: backend
    recipe:
      type: "@dfinity/rust@v3.1.0"
      configuration:
        package: backend
        shrink: true
```

**Motoko recipe** (~7 lines):
```yaml
canisters:
  - name: backend
    recipe:
      type: "@dfinity/motoko@v4.0.0"
      configuration:
        main: src/main.mo
```

**Asset canister recipe** (~9 lines):
```yaml
canisters:
  - name: frontend
    recipe:
      type: "@dfinity/asset-canister@v2.1.0"
      configuration:
        build:
          - npm install
          - npm run build
        dir: dist
```

**Prebuilt recipe** (~8 lines):
```yaml
canisters:
  - name: my-canister
    recipe:
      type: "@dfinity/prebuilt@v2.0.0"
      configuration:
        path: ./my-canister.wasm
        sha256: <hash>
```

---

## Templates → Developer Docs

| Template | Subfolder | Developer Docs Pages | Context |
|---|---|---|---|
| hello-world | `hello-world` | getting-started/quickstart, guides/frontends/asset-canister, guides/canister-calls/binding-generation | Default template for `icp new`. Full-stack: Motoko/Rust backend + React frontend. Shows canister discovery via ic_env cookie, @icp-sdk/bindgen Vite plugin. |
| motoko | `motoko` | getting-started/quickstart | Backend-only Motoko template. Simplest starting point for Motoko developers. |
| rust | `rust` | getting-started/quickstart | Backend-only Rust template. Shows Rust recipe with shrink, custom candid, metadata. |
| bitcoin-starter | `bitcoin-starter` | guides/chain-fusion/bitcoin | Bitcoin integration template. Shows bitcoind-addr network config, environment-specific BITCOIN_NETWORK env var, multi-environment setup (local/staging/production). |
| proxy | `proxy` | guides/testing/strategies, guides/canister-management/cycles-management | Proxy canister for forwarding calls with cycles on connected networks. Useful for testing cycle-dependent methods on mainnet. |
| static-website | `static-website` | guides/frontends/asset-canister, guides/frontends/frameworks | Pure frontend: Vite + asset-canister recipe. No backend. Good example for hosting-only use case. |

### Template Mentions

- **getting-started/quickstart**: Show `icp new my-project --subfolder hello-world` (already covered in icp-cli quickstart)
- **getting-started/project-structure**: Explain hello-world template output: icp.yaml, backend/, frontend/, .icp/
- **guides/chain-fusion/bitcoin**: Reference `icp new my-project --subfolder bitcoin-starter` with the multi-environment icp.yaml
- **guides/frontends/asset-canister**: Reference static-website template as simplest frontend-only example

---

## Examples → Developer Docs

### Chain Fusion Examples

| Example | Language | Feature | Developer Docs Page | Inline or Link |
|---|---|---|---|---|
| motoko/basic_bitcoin | Motoko | Bitcoin send/receive via ECDSA+Schnorr APIs | guides/chain-fusion/bitcoin | Link |
| rust/basic_bitcoin | Rust | Bitcoin send/receive via ECDSA+Schnorr APIs | guides/chain-fusion/bitcoin | Link |
| rust/basic_ethereum | Rust | Ethereum send/receive ETH via tECDSA + HTTPS outcalls | guides/chain-fusion/ethereum | Link |
| rust/basic_solana | Rust | Solana integration (redirects to sol-rpc-canister repo) | guides/chain-fusion/solana | Link |
| rust/basic_dogecoin | Rust | Dogecoin integration (redirects to dogecoin-canister repo) | guides/chain-fusion/dogecoin | Link |
| motoko/evm_block_explorer | Motoko | EVM block explorer via HTTPS outcalls | guides/chain-fusion/ethereum | Link |
| rust/evm_block_explorer | Rust | EVM block explorer via HTTPS outcalls | guides/chain-fusion/ethereum | Link |

### Cryptography / Threshold Signatures

| Example | Language | Feature | Developer Docs Page | Inline or Link |
|---|---|---|---|---|
| motoko/threshold-ecdsa | Motoko | Threshold ECDSA signing | guides/chain-fusion/bitcoin, guides/chain-fusion/ethereum | Link |
| rust/threshold-ecdsa | Rust | Threshold ECDSA signing | guides/chain-fusion/bitcoin, guides/chain-fusion/ethereum | Link |
| motoko/threshold-schnorr | Motoko | Threshold Schnorr signing | guides/chain-fusion/bitcoin | Link |
| rust/threshold-schnorr | Rust | Threshold Schnorr signing | guides/chain-fusion/bitcoin | Link |
| motoko/vetkd | Motoko | VetKD (Verifiable Encrypted Threshold Key Derivation) | guides/security/data-integrity | Link |
| rust/vetkd | Rust | VetKD | guides/security/data-integrity | Link |
| motoko/vetkeys | Motoko | VetKeys encryption | guides/security/data-integrity | Link |
| rust/vetkeys | Rust | VetKeys encryption | guides/security/data-integrity | Link |

### Token & DeFi Examples

| Example | Language | Feature | Developer Docs Page | Inline or Link |
|---|---|---|---|---|
| motoko/icp_transfer | Motoko | ICP ledger transfer | guides/defi/token-ledgers | Link |
| rust/icp_transfer | Rust | ICP ledger transfer | guides/defi/token-ledgers | Link |
| motoko/token_transfer | Motoko | ICRC-1 token transfer | guides/defi/token-ledgers, guides/defi/chain-key-tokens | Link |
| rust/token_transfer | Rust | ICRC-1 token transfer | guides/defi/token-ledgers, guides/defi/chain-key-tokens | Link |
| motoko/token_transfer_from | Motoko | ICRC-2 transfer_from (approve+transfer) | guides/defi/token-ledgers | Link |
| rust/token_transfer_from | Rust | ICRC-2 transfer_from | guides/defi/token-ledgers | Link |
| motoko/icrc2-swap | Motoko | ICRC-2 token swap | guides/defi/token-ledgers | Link |
| rust/receiving-icp | Rust | Receiving ICP in a canister | guides/defi/token-ledgers | Link |
| motoko/tokenmania | Motoko | Token game (full app) | guides/defi/token-ledgers | Link |
| rust/tokenmania | Rust | Token game (full app) | guides/defi/token-ledgers | Link |

### HTTPS Outcalls

| Example | Language | Feature | Developer Docs Page | Inline or Link |
|---|---|---|---|---|
| motoko/send_http_get | Motoko | HTTPS outcall GET | guides/backends/https-outcalls | Inline (core code ~20 lines) |
| rust/send_http_get | Rust | HTTPS outcall GET | guides/backends/https-outcalls | Inline (core code ~25 lines) |
| motoko/send_http_post | Motoko | HTTPS outcall POST | guides/backends/https-outcalls | Link |
| rust/send_http_post | Rust | HTTPS outcall POST | guides/backends/https-outcalls | Link |
| rust/exchange-rates | Rust | HTTPS outcalls to fetch exchange rates | guides/backends/https-outcalls | Link |

### Backend Features

| Example | Language | Feature | Developer Docs Page | Inline or Link |
|---|---|---|---|---|
| motoko/parallel_calls | Motoko | Parallel inter-canister calls | guides/canister-calls/parallel-calls | Link (good walkthrough) |
| rust/parallel_calls | Rust | Parallel inter-canister calls | guides/canister-calls/parallel-calls | Link |
| rust/inter-canister-calls | Rust | Basic inter-canister calls | guides/canister-calls/onchain-calls | Link |
| motoko/cert-var | Motoko | Certified variables | guides/backends/certified-variables | Link |
| motoko/hello_cycles | Motoko | Sending/receiving cycles | guides/canister-management/cycles-management | Link |
| rust/periodic_tasks | Rust | Timers / periodic tasks | guides/backends/timers | Link |
| motoko/random_maze | Motoko | Onchain randomness | guides/backends/randomness | Link |
| motoko/pub-sub | Motoko | Pub/sub pattern | guides/canister-calls/onchain-calls | Link |
| motoko/composite_query | Motoko | Composite queries | guides/canister-calls/onchain-calls | Link |
| rust/composite_query | Rust | Composite queries | guides/canister-calls/onchain-calls | Link |
| motoko/query_stats | Motoko | Query statistics | guides/canister-management/logs | Link |
| rust/query_stats | Rust | Query statistics | guides/canister-management/logs | Link |
| motoko/canister_logs | Motoko | Canister logging | guides/canister-management/logs | Link |
| rust/canister_logs | Rust | Canister logging | guides/canister-management/logs | Link |
| motoko/low_wasm_memory | Motoko | Low WASM memory handling | guides/canister-management/optimization | Link |
| rust/low_wasm_memory | Rust | Low WASM memory handling | guides/canister-management/optimization | Link |
| motoko/classes | Motoko | Motoko classes / canister factory | guides/canister-management/lifecycle | Link |
| motoko/canister_factory | Motoko | Programmatic canister creation | guides/canister-management/lifecycle | Link |
| rust/performance_counters | Rust | Performance counters | guides/canister-management/optimization | Link |
| rust/guards | Rust | Access control guards | guides/security/access-management | Link |
| rust/simd | Rust | SIMD operations in WASM | guides/canister-management/optimization | Link |
| rust/backend_wasm64 | Rust | Wasm64 backend | guides/canister-management/optimization, guides/canister-management/large-wasm | Link |
| rust/x509 | Rust | X.509 certificate handling | guides/security/data-integrity | Link |
| rust/candid_type_generation | Rust | Candid type generation | guides/canister-calls/candid | Link |
| rust/canister-info | Rust | Canister info API | guides/canister-management/lifecycle | Link |
| rust/canister-snapshots | Rust | Programmatic snapshots | guides/canister-management/snapshots | Link |
| rust/canister-snapshot-download | Rust | Snapshot download | guides/canister-management/snapshots | Link |
| rust/unit_testable_rust_canister | Rust | Unit testing patterns | guides/testing/strategies | Link |
| rust/stake_neuron_from_cli | Rust | NNS neuron staking | guides/governance/managing | Link |
| rust/sns-adaptor | Rust | SNS adaptor canister | guides/governance/launching | Link |

### Authentication / Identity

| Example | Language | Feature | Developer Docs Page | Inline or Link |
|---|---|---|---|---|
| motoko/internet_identity_integration | Motoko | Internet Identity login | guides/authentication/internet-identity | Link |
| motoko/encrypted-notes-dapp-vetkd | Motoko | Encrypted notes with II + VetKD | guides/authentication/internet-identity, guides/security/data-integrity | Link |
| rust/encrypted-notes-dapp-vetkd | Rust | Encrypted notes with II + VetKD | guides/authentication/internet-identity, guides/security/data-integrity | Link |
| motoko/who_am_i | Motoko | Caller principal identification | guides/security/access-management | Inline (~10 lines) |
| rust/who_am_i | Rust | Caller principal identification | guides/security/access-management | Inline (~10 lines) |

### Frontend / Hosting

| Example | Language | Feature | Developer Docs Page | Inline or Link |
|---|---|---|---|---|
| hosting/static-website | HTML/CSS | Basic static website hosting | guides/frontends/asset-canister | Link |
| hosting/photo-storage | JS | Photo storage with asset canister | guides/frontends/asset-canister | Link |
| hosting/react | React | React app hosting | guides/frontends/frameworks | Link |
| hosting/godot-html5-template | Godot | Godot game hosting | guides/frontends/frameworks | Link |
| hosting/unity-webgl-template | Unity | Unity WebGL hosting | guides/frontends/frameworks | Link |
| hosting/my_crypto_blog | JS | Blog with crypto features | guides/frontends/asset-canister | Link |
| hosting/oisy-signer-demo | JS | OISY wallet signer demo | guides/defi/wallet-integration | Link |
| svelte/svelte-motoko-starter | Svelte+Motoko | Svelte + Motoko starter | guides/frontends/frameworks | Link |
| svelte/sveltekit-starter | SvelteKit | SvelteKit starter | guides/frontends/frameworks | Link |

### Native Apps

| Example | Language | Feature | Developer Docs Page | Inline or Link |
|---|---|---|---|---|
| native-apps/unity_ii_applink | Unity/C# | Unity + Internet Identity (App Link) | guides/authentication/internet-identity | Link |
| native-apps/unity_ii_deeplink | Unity/C# | Unity + Internet Identity (Deep Link) | guides/authentication/internet-identity | Link |
| native-apps/unity_ii_universallink | Unity/C# | Unity + Internet Identity (Universal Link) | guides/authentication/internet-identity | Link |

### Other

| Example | Language | Feature | Developer Docs Page | Inline or Link |
|---|---|---|---|---|
| motoko/hello_world | Motoko | Hello world | getting-started/quickstart | Link |
| rust/hello_world | Rust | Hello world | getting-started/quickstart | Link |
| motoko/backend_only | Motoko | Backend-only canister | getting-started/project-structure | Link |
| rust/backend_only | Rust | Backend-only canister | getting-started/project-structure | Link |
| motoko/daily_planner | Motoko | Full CRUD app | guides/backends/data-persistence | Link |
| rust/daily_planner | Rust | Full CRUD app | guides/backends/data-persistence | Link |
| motoko/superheroes | Motoko | CRUD with relationships | guides/backends/data-persistence | Link |
| motoko/flying_ninja | Motoko | Game example | (none — showcase only) | Link from getting-started/what-next |
| rust/flying_ninja | Rust | Game example | (none — showcase only) | Link from getting-started/what-next |
| motoko/llm_chatbot | Motoko | LLM chatbot | guides/backends/onchain-ai | Link |
| rust/llm_chatbot | Rust | LLM chatbot | guides/backends/onchain-ai | Link |
| motoko/ic-pos | Motoko | Point-of-sale app | guides/defi/token-ledgers | Link |
| motoko/nft-creator | Motoko | NFT creation | guides/defi/token-ledgers | Link |
| motoko/filevault | Motoko | Encrypted file storage | guides/security/data-integrity | Link |
| rust/photo_gallery | Rust | Photo gallery with storage | guides/backends/data-persistence | Link |
| rust/qrcode | Rust | QR code generation | guides/backends/https-outcalls | Link |
| rust/face-recognition | Rust | Face recognition (WASM ML) | guides/canister-management/optimization | Link |
| rust/image-classification | Rust | Image classification (WASM ML) | guides/canister-management/optimization | Link |
| wasm/counter | WASM | Raw WASM counter | (none — advanced showcase) | — |

---

## Sync Candidates

These icp-cli docs pages are strong candidates for syncing content into developer-docs (either via automated sync or manual rewrite that stays in close alignment):

1. **`migration/from-dfx.md`** → `guides/tools/migrating-from-dfx` — Already synced from icp-cli repo. Keep as-is.

2. **`guides/installation.md`** → `getting-started/quickstart` — Installation steps MUST match between the two. Consider syncing the install section or extracting a shared snippet.

3. **`quickstart.md`** → `getting-started/quickstart` — Our quickstart should use identical commands. Sync the command sequence (icp new, network start, deploy, canister call).

4. **`concepts/canister-discovery.md`** → `guides/canister-calls/onchain-calls` and `guides/frontends/asset-canister` — Canister environment variables and the ic_env cookie mechanism are critical for both frontend-to-backend and backend-to-backend communication. This content should be rewritten for our docs with links back to the icp-cli version.

5. **`concepts/binding-generation.md`** → `guides/canister-calls/binding-generation` — Short enough to adapt into our page, linking to @icp-sdk/bindgen, candid crate, and didc.

6. **`guides/canister-snapshots.md`** → `guides/canister-management/snapshots` — This is the definitive guide; rewrite with links back.

7. **`guides/deploying-to-specific-subnets.md`** → `guides/canister-management/subnet-selection` — Subnet selection is production-critical; rewrite with links back.

8. **`guides/deploying-to-mainnet.md`** → `guides/canister-management/cycles-management` — Identity setup, ICP acquisition, cycles minting, and deployment workflow. Rewrite the cycles/deployment portion.

Pages that should be **link-only** (not synced):
- `reference/cli.md` — Always link to https://dfinity.github.io/icp-cli/
- `reference/configuration.md` — Link to icp-cli site
- `reference/canister-settings.md` — Link to icp-cli site
- `reference/environment-variables.md` — Link to icp-cli site
- `guides/creating-recipes.md` — Advanced; link only
- `guides/creating-templates.md` — Advanced; link only
- `guides/containerized-networks.md` — Link only (mention Docker option in testing page)
- `telemetry.md` — Link only

---

## Recommendations

### 1. Recipe Snippets Are the Primary Configuration Examples

Every developer-docs page that shows "how to set up a canister" should use recipe-based icp.yaml snippets. The four official recipes cover 95%+ of use cases:
- **Rust backend**: `@dfinity/rust`
- **Motoko backend**: `@dfinity/motoko`
- **Frontend/static**: `@dfinity/asset-canister`
- **Pre-built WASM**: `@dfinity/prebuilt`

Do NOT show raw build steps (cargo build, moc, etc.) as the primary approach. Show recipes first, then mention custom build steps as an escape hatch.

### 2. Templates as Starting Points in Quickstart

The getting-started/quickstart page should prominently feature:
- `icp new my-project --subfolder hello-world` as the default path
- `icp new my-project --subfolder rust` for Rust-only projects
- `icp new my-project --subfolder motoko` for Motoko-only projects
- `icp new my-project --subfolder bitcoin-starter` in the Bitcoin guide

### 3. Examples Repo Needs icp-cli Migration

The examples repo (`dfinity/examples`) still uses dfx commands throughout. All README files reference `dfx start`, `dfx deploy`, etc. Before linking heavily from developer-docs, the examples should be updated to use icp-cli. Priority examples for migration:
- hello_world (both languages) — linked from quickstart
- send_http_get/post (both) — linked from HTTPS outcalls guide
- basic_bitcoin (both) — linked from Bitcoin guide
- icp_transfer / token_transfer (both) — linked from token ledgers guide
- internet_identity_integration — linked from II guide
- parallel_calls (both) — linked from parallel calls guide

### 4. Inline vs. Link Decision Framework

**Inline** (copy code into docs page) when:
- Code is <30 lines and illustrates a single concept
- The pattern is stable and unlikely to change
- Examples: who_am_i (~10 lines), basic HTTP GET handler (~20 lines), recipe icp.yaml snippets

**Link** (point to examples repo) when:
- Example is a full project with multiple files
- Code changes frequently
- Example has its own README with deployment instructions
- Examples: basic_bitcoin, encrypted-notes-dapp, tokenmania

### 5. icp.yaml Environment Patterns to Highlight

The bitcoin-starter template shows an excellent pattern for multi-environment config with environment-specific canister env vars. This pattern should be referenced in:
- `guides/canister-management/cycles-management` — staging vs production
- `guides/chain-fusion/bitcoin` — regtest vs testnet vs mainnet
- `guides/canister-management/settings` — environment-specific settings

### 6. Canister Discovery is Cross-Cutting

The canister discovery mechanism (PUBLIC_CANISTER_ID env vars + ic_env cookie) appears in:
- icp-cli concepts/canister-discovery.md
- icp-cli guides/local-development.md (frontend dev server section)
- hello-world template README
- icp-cli concepts/binding-generation.md

This should be a single, well-explained section in `guides/canister-calls/onchain-calls` with cross-references from `guides/frontends/asset-canister` and `getting-started/project-structure`.

### 7. Missing Example Coverage

Some developer-docs pages have no corresponding examples:
- **guides/backends/data-persistence** — daily_planner and superheroes exist but are basic. Consider linking photo_gallery (Rust) for a more complete example.
- **guides/canister-management/reproducible-builds** — No dedicated example. Reference `@dfinity/prebuilt` recipe with sha256 verification.
- **guides/security/dos-prevention** — No example. This is a conceptual guide.
- **guides/security/inter-canister-calls** — guards example (Rust) covers access control but not call safety patterns.
- **guides/testing/pocket-ic** — containerized-networks guide covers Docker-based PocketIC, but no standalone PocketIC example exists in the examples repo.

### 8. Template-to-Recipe Version Alignment

Templates pin specific recipe versions (e.g., `@dfinity/rust@v3.1.0` in the rust template). Developer-docs should use unversioned recipe references or a placeholder like `@dfinity/rust@<version>` so they don't go stale. Note the icp-cli docs already use this pattern (e.g., `@dfinity/rust@v3.0.0` — one version behind the template). A remark plugin could inject current versions at build time, similar to how CLI link versions are injected.
