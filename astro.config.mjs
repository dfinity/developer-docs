// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import rehypeRewriteLinks from "./plugins/rehype-rewrite-links.mjs";
import rehypeExternalLinks from "./plugins/rehype-external-links.mjs";
import remarkIcpCliVersion from "./plugins/remark-icp-cli-version.mjs";
import remarkSnippet from "./plugins/remark-snippet.mjs";
import remarkHeadingId from "./plugins/remark-heading-id.mjs";
import agentDocs from "./plugins/astro-agent-docs.mjs";
import { sidebar } from "./sidebar.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://beta-docs.internetcomputer.org",
  markdown: {
    // Rehype plugins work with Starlight (remark plugins don't — Starlight overrides them).
    // See: https://github.com/dfinity/icp-cli/issues/423
    rehypePlugins: [rehypeRewriteLinks, rehypeExternalLinks],
    remarkPlugins: [remarkHeadingId, remarkSnippet, remarkIcpCliVersion],
  },
  integrations: [
    starlight({
      title: "ICP Developer Docs",
      components: {
        EditLink: "./src/components/EditLink.astro",
        Footer: "./src/components/Footer.astro",
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
          tag: "link",
          attrs: {
            rel: "alternate",
            type: "application/rss+xml",
            title: "ICP Developer Docs",
            href: "/feed.xml",
          },
        },
        {
          tag: "meta",
          attrs: { name: "robots", content: "index, follow, max-image-preview:large" },
        },
        {
          tag: "meta",
          attrs: { name: "author", content: "DFINITY Foundation" },
        },
        {
          tag: "meta",
          attrs: { property: "og:image", content: "https://beta-docs.internetcomputer.org/og-image.png" },
        },
        {
          tag: "meta",
          attrs: { property: "og:image:alt", content: "ICP Developer Docs — Build on Internet Computer" },
        },
        {
          tag: "meta",
          attrs: { name: "twitter:image", content: "https://beta-docs.internetcomputer.org/og-image.png" },
        },
        {
          tag: "script",
          attrs: { type: "application/ld+json" },
          content: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": "https://beta-docs.internetcomputer.org/#website",
                "name": "ICP Developer Docs",
                "description": "Developer documentation for building full-stack web applications, DeFi protocols, and cross-chain integrations on the Internet Computer.",
                "url": "https://beta-docs.internetcomputer.org",
                "publisher": { "@id": "https://beta-docs.internetcomputer.org/#organization" },
              },
              {
                "@type": "Organization",
                "@id": "https://beta-docs.internetcomputer.org/#organization",
                "name": "DFINITY Foundation",
                "url": "https://dfinity.org",
              },
            ],
          }),
        },
        {
          tag: "script",
          content: `document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('a[href^="http"]').forEach(a=>{a.setAttribute('target','_blank');a.setAttribute('rel','noopener noreferrer')});document.querySelectorAll('[data-copy]').forEach(b=>{b.addEventListener('click',()=>{navigator.clipboard.writeText(b.dataset.copy);const i=b.querySelector('svg');if(i){const orig=i.innerHTML;i.innerHTML='<polyline points="20 6 9 17 4 12" />';i.style.stroke='#22c55e';i.style.opacity='1';setTimeout(()=>{i.innerHTML=orig;i.style.stroke='';i.style.opacity=''},1500)}})});const sb=document.getElementById('skills-give-btn');const sl=document.getElementById('skills-give-label');if(sb&&sl){const orig=sl.textContent;sb.addEventListener('click',()=>{navigator.clipboard.writeText('Fetch https://skills.internetcomputer.org/llms.txt and follow its instructions when building on ICP').catch(()=>{});sl.textContent='Now paste into your agent';setTimeout(()=>{sl.textContent=orig},3000)})}})`,
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
