// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import rehypeRewriteLinks from "./plugins/rehype-rewrite-links.mjs";
import rehypeExternalLinks from "./plugins/rehype-external-links.mjs";
import remarkIcpCliVersion from "./plugins/remark-icp-cli-version.mjs";
import agentDocs from "./plugins/astro-agent-docs.mjs";
import { sidebar } from "./sidebar.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://beta-docs.internetcomputer.org",
  markdown: {
    // Rehype plugins work with Starlight (remark plugins don't — Starlight overrides them).
    // See: https://github.com/dfinity/icp-cli/issues/423
    rehypePlugins: [rehypeRewriteLinks, rehypeExternalLinks],
    remarkPlugins: [remarkIcpCliVersion],
  },
  integrations: [
    agentDocs(),
    starlight({
      title: "ICP Developer Docs",
      components: {
        EditLink: "./src/components/EditLink.astro",
      },
      head: [
        {
          // Agent-friendly docs: surface llms.txt directive early in <head>
          // so crawlers find it before the content area (agentdocsspec.com)
          tag: "link",
          attrs: {
            rel: "help",
            href: "/llms.txt",
            type: "text/plain",
            title: "LLM-friendly documentation index",
          },
        },
      ],
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
      sidebar,
    }),
  ],
});
