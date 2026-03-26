// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import rehypeRewriteLinks from "./plugins/rehype-rewrite-links.mjs";
import rehypeExternalLinks from "./plugins/rehype-external-links.mjs";
import remarkIcpCliVersion from "./plugins/remark-icp-cli-version.mjs";
import remarkSnippet from "./plugins/remark-snippet.mjs";
import agentDocs from "./plugins/astro-agent-docs.mjs";
import { sidebar } from "./sidebar.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://beta-docs.internetcomputer.org",
  markdown: {
    // Rehype plugins work with Starlight (remark plugins don't — Starlight overrides them).
    // See: https://github.com/dfinity/icp-cli/issues/423
    rehypePlugins: [rehypeRewriteLinks, rehypeExternalLinks],
    remarkPlugins: [remarkSnippet, remarkIcpCliVersion],
  },
  integrations: [
    starlight({
      title: "ICP Developer Docs",
      components: {
        EditLink: "./src/components/EditLink.astro",
      },
      head: [
        {
          tag: "link",
          attrs: {
            rel: "llms",
            href: "/llms.txt",
            type: "text/plain",
            title: "LLM-friendly documentation index",
          },
        },
        {
          tag: "script",
          content: `document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('a[href^="http"]').forEach(a=>{a.setAttribute('target','_blank');a.setAttribute('rel','noopener noreferrer')});document.querySelectorAll('[data-copy]').forEach(b=>{b.addEventListener('click',()=>{navigator.clipboard.writeText(b.dataset.copy);const i=b.querySelector('svg');if(i){const orig=i.innerHTML;i.innerHTML='<polyline points="20 6 9 17 4 12" />';i.style.stroke='#22c55e';i.style.opacity='1';setTimeout(()=>{i.innerHTML=orig;i.style.stroke='';i.style.opacity=''},1500)}})})})`,
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
    // Generate .md endpoints, llms.txt, and agent signaling for agent-friendly docs.
    // Listed after starlight() so the astro:build:done hook runs after sitemap generation.
    agentDocs(),
  ],
});
