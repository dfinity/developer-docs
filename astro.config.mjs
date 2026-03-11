// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import remarkIcpCliVersion from "./plugins/remark-icp-cli-version.mjs";
import remarkExternalLinks from "./plugins/remark-external-links.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://docs.internetcomputer.org",
  markdown: {
    remarkPlugins: [remarkExternalLinks, remarkIcpCliVersion],
  },
  integrations: [
    starlight({
      title: "ICP Developer Docs",
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
            {
              label: "Canisters",
              autogenerate: { directory: "guides/canisters" },
            },
            {
              label: "Frontends",
              autogenerate: { directory: "guides/frontends" },
            },
            {
              label: "Authentication",
              autogenerate: { directory: "guides/authentication" },
            },
            {
              label: "Inter-Canister",
              autogenerate: { directory: "guides/inter-canister" },
            },
            {
              label: "Testing",
              autogenerate: { directory: "guides/testing" },
            },
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
              label: "Security",
              autogenerate: { directory: "guides/security" },
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
