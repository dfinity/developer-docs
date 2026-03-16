/**
 * Astro integration for Agent-Friendly Documentation.
 * Implements https://agentdocsspec.com:
 *
 * 1. Markdown endpoints — serves a clean .md file alongside every HTML page
 * 2. llms.txt — discovery index listing all pages with links to .md endpoints
 *
 * Runs in the astro:build:done hook so it operates on the final build output.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "glob";
import matter from "gray-matter";

/**
 * Maps directory prefixes to section labels for llms.txt grouping.
 * Order here determines order in the generated file.
 * Uses longest-prefix matching, so "guides/backends" matches before "guides".
 */
const SECTIONS = [
  { dir: "getting-started", label: "Getting Started" },
  { dir: "guides/backends", label: "Backends" },
  { dir: "guides/canister-calls", label: "Canister Calls" },
  { dir: "guides/frontends", label: "Frontends" },
  { dir: "guides/authentication", label: "Authentication" },
  { dir: "guides/testing", label: "Testing" },
  { dir: "guides/canister-management", label: "Canister Management" },
  { dir: "guides/security", label: "Security" },
  { dir: "guides/chain-fusion", label: "Chain Fusion" },
  { dir: "guides/defi", label: "DeFi" },
  { dir: "guides/governance", label: "Governance" },
  { dir: "guides/tools", label: "Tools" },
  { dir: "guides", label: "Guides" },
  { dir: "concepts", label: "Concepts" },
  { dir: "languages/motoko/fundamentals", label: "Motoko — Fundamentals" },
  { dir: "languages/motoko/icp-features", label: "Motoko — ICP Features" },
  { dir: "languages/motoko/reference", label: "Motoko — Reference" },
  { dir: "languages/motoko", label: "Motoko" },
  { dir: "languages/rust", label: "Rust" },
  { dir: "languages", label: "Languages" },
  { dir: "reference", label: "Reference" },
];

// UTF-8 BOM — ensures browsers interpret .md files correctly even without
// a charset=utf-8 in the Content-Type header.
const BOM = "\uFEFF";

/** Strip YAML frontmatter and HTML comments from markdown content. */
function cleanMarkdown(raw) {
  const { content } = matter(raw);
  return BOM + content.replace(/<!--[\s\S]*?-->/g, "").trim() + "\n";
}

/** Find the best matching section for a file path (longest prefix wins). */
function findSection(filePath) {
  let best = null;
  for (const section of SECTIONS) {
    if (
      filePath.startsWith(section.dir + "/") &&
      (!best || section.dir.length > best.dir.length)
    ) {
      best = section;
    }
  }
  return best;
}

/** Generate llms.txt content from collected page metadata. */
function generateLlmsTxt(pages) {
  const lines = [
    "# ICP Developer Docs",
    "",
    "> Developer documentation for building full-stack web applications, DeFi protocols, and cross-chain integrations on the Internet Computer.",
    "",
  ];

  // Root index page
  const rootIndex = pages.find((p) => p.file === "index.md");
  if (rootIndex) {
    lines.push(`- [${rootIndex.title}](/index.md): ${rootIndex.description}`);
    lines.push("");
  }

  // Group pages by section
  const grouped = new Map();
  for (const section of SECTIONS) {
    grouped.set(section.label, []);
  }

  for (const page of pages) {
    if (page.file === "index.md") continue;
    const section = findSection(page.file);
    if (section) {
      grouped.get(section.label).push(page);
    }
  }

  // Emit sections
  for (const [label, sectionPages] of grouped) {
    if (sectionPages.length === 0) continue;

    sectionPages.sort((a, b) => a.order - b.order);

    lines.push(`## ${label}`);
    lines.push("");
    for (const page of sectionPages) {
      const entry = page.description
        ? `- [${page.title}](/${page.file}): ${page.description}`
        : `- [${page.title}](/${page.file})`;
      lines.push(entry);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export default function agentDocs() {
  return {
    name: "agent-docs",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const docsDir = path.resolve("docs");

        const files = await glob("**/*.md", { cwd: docsDir });
        const pages = [];

        // 1. Generate markdown endpoints
        for (const file of files) {
          const raw = fs.readFileSync(path.join(docsDir, file), "utf-8");
          const { data: frontmatter } = matter(raw);

          // Write cleaned .md to build output
          const outFile = path.join(outDir, file);
          fs.mkdirSync(path.dirname(outFile), { recursive: true });
          fs.writeFileSync(outFile, cleanMarkdown(raw));

          pages.push({
            file,
            title: frontmatter.title || path.basename(file, ".md"),
            description: frontmatter.description || "",
            order: frontmatter.sidebar?.order ?? 999,
          });
        }

        logger.info(`Generated ${pages.length} markdown endpoints`);

        // 2. Generate llms.txt
        const llmsTxt = generateLlmsTxt(pages);
        fs.writeFileSync(path.join(outDir, "llms.txt"), llmsTxt);
        logger.info(
          `Generated llms.txt (${llmsTxt.length} chars, ${pages.length} pages)`
        );
      },
    },
  };
}
