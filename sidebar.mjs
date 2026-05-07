/**
 * Shared sidebar definition.
 *
 * Single source of truth consumed by:
 *   - astro.config.mjs  (passed to Starlight)
 *   - plugins/astro-agent-docs.mjs  (derives llms.txt section grouping)
 *
 * Format follows the Starlight sidebar schema:
 *   https://starlight.astro.build/reference/configuration/#sidebar
 */

export const sidebar = [
  {
    label: "Getting started",
    autogenerate: { directory: "getting-started" },
  },
  {
    label: "Guides",
    items: [
      { slug: "guides/ai-coding-agents", label: "AI coding agents" },
      // Build: core development
      {
        label: "Backends",
        collapsed: true,
        autogenerate: { directory: "guides/backends" },
      },
      {
        label: "Canister calls",
        collapsed: true,
        autogenerate: { directory: "guides/canister-calls" },
      },
      {
        label: "Frontends",
        collapsed: true,
        autogenerate: { directory: "guides/frontends" },
      },
      {
        label: "Authentication",
        collapsed: true,
        autogenerate: { directory: "guides/authentication" },
      },
      // Quality & shipping
      {
        label: "Testing",
        collapsed: true,
        autogenerate: { directory: "guides/testing" },
      },
      {
        label: "Canister management",
        collapsed: true,
        autogenerate: { directory: "guides/canister-management" },
      },
      {
        label: "Security",
        collapsed: true,
        autogenerate: { directory: "guides/security" },
      },
      // Advanced features
      {
        label: "Digital assets",
        collapsed: true,
        autogenerate: { directory: "guides/digital-assets" },
      },
      {
        label: "Chain Fusion",
        collapsed: true,
        autogenerate: { directory: "guides/chain-fusion" },
      },
      {
        label: "Governance",
        collapsed: true,
        autogenerate: { directory: "guides/governance" },
      },
    ],
  },
  {
    label: "Concepts",
    collapsed: true,
    items: [
      // Network: infrastructure topology, nodes, and scaling
      {
        label: "Network",
        collapsed: true,
        items: [
          { slug: "concepts/network-overview", label: "Overview" },
          { slug: "concepts/node-infrastructure" },
          { slug: "concepts/edge-infrastructure" },
          { slug: "concepts/evolution-scaling" },
        ],
      },
      // Protocol Stack: ICP's internal execution layers
      {
        label: "Protocol stack",
        collapsed: true,
        items: [
          { slug: "concepts/protocol", label: "Overview" },
          { slug: "concepts/protocol/peer-to-peer" },
          { slug: "concepts/protocol/consensus" },
          { slug: "concepts/protocol/message-routing" },
          { slug: "concepts/protocol/execution" },
          { slug: "concepts/protocol/state-synchronization" },
          { slug: "concepts/protocol/performance" },
        ],
      },
      // Canisters: the developer runtime and canister capabilities
      {
        label: "Canisters & capabilities",
        collapsed: true,
        items: [
          { slug: "concepts/canisters" },
          { slug: "concepts/principals" },
          { slug: "concepts/app-architecture" },
          { slug: "concepts/cycles" },
          { slug: "concepts/orthogonal-persistence" },
          { slug: "concepts/timers" },
          { slug: "concepts/verifiable-randomness" },
          { slug: "concepts/https-outcalls" },
        ],
      },
      // Cryptography: ICP's cryptographic primitives
      {
        label: "Cryptography",
        collapsed: true,
        items: [
          { slug: "concepts/chain-key-cryptography" },
          { slug: "concepts/certified-data" },
          { slug: "concepts/vetkeys" },
        ],
      },
      // Chain Fusion: cross-chain integration
      {
        label: "Chain Fusion",
        collapsed: true,
        items: [
          { slug: "concepts/chain-fusion", label: "Overview" },
          { slug: "concepts/chain-fusion/bitcoin" },
          { slug: "concepts/chain-fusion/ethereum" },
          { slug: "concepts/chain-fusion/solana" },
          { slug: "concepts/chain-fusion/dogecoin" },
          { slug: "concepts/chain-fusion/chain-key-tokens" },
          { slug: "concepts/chain-fusion/exchange-rate-canister" },
        ],
      },
      // Trust & governance: security model, governance, and economics
      {
        label: "Trust & governance",
        collapsed: true,
        items: [
          { slug: "concepts/governance" },
          { slug: "concepts/sns-framework" },
          { slug: "concepts/network-economics" },
          { slug: "concepts/ledgers" },
          { slug: "concepts/security" },
        ],
      },
    ],
  },
  {
    label: "Languages",
    items: [
      { slug: "languages", label: "Overview" },
      {
        label: "Motoko",
        collapsed: true,
        items: [
          { slug: "languages/motoko", label: "Overview" },
          {
            label: "Fundamentals",
            autogenerate: {
              directory: "languages/motoko/fundamentals",
            },
          },
          {
            label: "ICP features",
            autogenerate: {
              directory: "languages/motoko/icp-features",
            },
          },
          {
            label: "Reference",
            autogenerate: {
              directory: "languages/motoko/reference",
            },
          },
        ],
      },
      {
        label: "Rust",
        collapsed: true,
        autogenerate: { directory: "languages/rust" },
      },
    ],
  },
  { slug: "references/developer-tools", label: "Developer tools" },
  {
    label: "References",
    collapsed: true,
    items: [
      // Development reference: system API, costs, subnets, errors
      {
        label: "Development reference",
        collapsed: true,
        items: [
          { slug: "references/management-canister" },
          { slug: "references/cycles-costs" },
          { slug: "references/subnet-types" },
          { slug: "references/execution-errors" },
        ],
      },
      // Canister registry: known canisters and their IDs
      {
        label: "Canister registry",
        collapsed: true,
        items: [
          { slug: "references/system-canisters" },
          { slug: "references/protocol-canisters" },
          { slug: "references/application-canisters" },
          { slug: "references/chain-key-canister-ids" },
        ],
      },
      // Standards: ICRC standard family
      {
        label: "Standards",
        collapsed: true,
        items: [
          { slug: "references/icrc-standards" },
          { slug: "references/digital-asset-standards" },
        ],
      },
      // Governance: NNS and SNS parameter references
      {
        label: "Governance",
        collapsed: true,
        items: [
          { slug: "references/nns-proposal-types" },
          { slug: "references/sns-settings" },
        ],
      },
      // Formal specifications (ungrouped to avoid 4-level nesting with IC interface spec)
      { slug: "references/candid-spec" },
      {
        label: "IC interface spec",
        collapsed: true,
        autogenerate: { directory: "references/ic-interface-spec" },
      },
      { slug: "references/http-gateway-protocol-spec" },
      { slug: "references/internet-identity-spec" },
      { slug: "references/glossary" },
    ],
  },
];
