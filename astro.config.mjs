// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import rehypeRewriteLinks from "./plugins/rehype-rewrite-links.mjs";
import rehypeExternalLinks from "./plugins/rehype-external-links.mjs";
import remarkIcpCliVersion from "./plugins/remark-icp-cli-version.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://docs.internetcomputer.org",
  markdown: {
    // Rehype plugins work with Starlight (remark plugins don't — Starlight overrides them).
    // See: https://github.com/dfinity/icp-cli/issues/423
    rehypePlugins: [rehypeRewriteLinks, rehypeExternalLinks],
    remarkPlugins: [remarkIcpCliVersion],
  },
  integrations: [
    starlight({
      title: "ICP Developer Docs",
      customCss: [
        "@fontsource/inter/400.css",
        "@fontsource/inter/500.css",
        "@fontsource/inter/600.css",
        "@fontsource/inter/700.css",
        "./src/styles/custom.css",
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/dfinity/developer-docs",
        },
      ],
      editLink: {
        baseUrl:
          "https://github.com/dfinity/developer-docs/edit/main/",
      },
      sidebar: [
        {
          label: "Getting Started",
          autogenerate: { directory: "getting-started" },
        },
        {
          label: "Guides",
          items: [
            // Build: core development
            {
              label: "Backends",
              autogenerate: { directory: "guides/backends" },
            },
            {
              label: "Canister Calls",
              autogenerate: { directory: "guides/canister-calls" },
            },
            {
              label: "Frontends",
              autogenerate: { directory: "guides/frontends" },
            },
            {
              label: "Authentication",
              autogenerate: { directory: "guides/authentication" },
            },
            // Quality & shipping
            {
              label: "Testing",
              autogenerate: { directory: "guides/testing" },
            },
            {
              label: "Canister Management",
              autogenerate: { directory: "guides/canister-management" },
            },
            {
              label: "Security",
              autogenerate: { directory: "guides/security" },
            },
            // Advanced features
            {
              label: "Chain Fusion",
              autogenerate: { directory: "guides/chain-fusion" },
            },
            {
              label: "DeFi",
              autogenerate: { directory: "guides/defi" },
            },
            {
              label: "Governance",
              autogenerate: { directory: "guides/governance" },
            },
            {
              label: "Tools",
              autogenerate: { directory: "guides/tools" },
            },
          ],
        },
        {
          label: "Concepts",
          autogenerate: { directory: "concepts" },
        },
        {
          label: "Languages",
          items: [
            { slug: "languages", label: "Overview" },
            {
              label: "Motoko",
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
              autogenerate: { directory: "languages/rust" },
            },
          ],
        },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
        },
      ],
    }),
  ],
});
