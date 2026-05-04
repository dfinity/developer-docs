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
    label: "Getting Started",
    autogenerate: { directory: "getting-started" },
  },
  {
    label: "Guides",
    items: [
      { slug: "guides/ai-coding-agents", label: "AI Coding Agents" },
      // Build: core development
      {
        label: "Backends",
        collapsed: true,
        autogenerate: { directory: "guides/backends" },
      },
      {
        label: "Canister Calls",
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
        label: "Canister Management",
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
        label: "Digital Assets",
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
    autogenerate: { directory: "concepts" },
  },
  { slug: "reference/developer-tools", label: "Developer Tools" },
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
            label: "ICP Features",
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
  {
    label: "References",
    collapsed: true,
    items: [
      { slug: "reference/management-canister" },
      { slug: "reference/system-canisters" },
      { slug: "reference/protocol-canisters" },
      { slug: "reference/application-canisters" },
      { slug: "reference/icrc-standards" },
      { slug: "reference/digital-asset-standards" },
      { slug: "reference/chain-key-canister-ids" },
      { slug: "reference/cycles-costs" },
      { slug: "reference/subnet-types" },
      { slug: "reference/execution-errors" },
      { slug: "reference/http-gateway-spec" },
      { slug: "reference/candid-spec" },
      { slug: "reference/internet-identity-spec" },
      {
        label: "IC Interface Spec",
        collapsed: true,
        autogenerate: { directory: "reference/ic-interface-spec" },
      },
      { slug: "reference/glossary" },
    ],
  },
];
