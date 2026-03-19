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
import { sidebar } from "../sidebar.mjs";

/**
 * Derives llms.txt section mappings from the shared sidebar definition.
 *
 * Walks the sidebar tree and extracts { dir, label } entries from every
 * `autogenerate` node. Parent groups that contain `items` but no
 * `autogenerate` get a fallback entry using the common directory prefix
 * of their children — this catches files that don't match a more specific
 * child prefix.
 *
 * The result is ordered children-first so that longest-prefix matching
 * in findSection() naturally picks the most specific match.
 */
function deriveSections(items, parentLabel = "", depth = 0) {
  const sections = [];

  for (const item of items) {
    if (item.autogenerate) {
      // Leaf with a directory — direct mapping.
      // Only prefix the parent label for items nested 2+ levels deep
      // (e.g. "Motoko — Fundamentals") but not for direct children of
      // top-level groups (e.g. "Backends" not "Guides — Backends").
      const label =
        parentLabel && depth > 1
          ? `${parentLabel} — ${item.label}`
          : item.label;
      sections.push({ dir: item.autogenerate.directory, label });
    } else if (item.items) {
      // Group with children — recurse first (children before parent)
      const childSections = deriveSections(item.items, item.label, depth + 1);
      sections.push(...childSections);

      // Add a parent fallback if children have a common directory prefix
      const childDirs = childSections.map((s) => s.dir);
      const commonPrefix = findCommonPrefix(childDirs);
      if (commonPrefix) {
        sections.push({ dir: commonPrefix, label: item.label });
      }
    }
  }

  return sections;
}

/** Find the longest common directory prefix among a list of paths. */
function findCommonPrefix(dirs) {
  if (dirs.length === 0) return "";
  const parts = dirs[0].split("/");
  let prefix = "";
  for (let i = 0; i < parts.length; i++) {
    const candidate = parts.slice(0, i + 1).join("/");
    if (dirs.every((d) => d.startsWith(candidate + "/") || d === candidate)) {
      prefix = candidate;
    } else {
      break;
    }
  }
  return prefix;
}

const SECTIONS = deriveSections(sidebar);

// UTF-8 BOM — ensures browsers interpret .md files correctly even without
// a charset=utf-8 in the Content-Type header.
const BOM = "\uFEFF";

/** Strip YAML frontmatter and HTML comments, prepend title heading. */
function cleanMarkdown(raw) {
  const { data, content } = matter(raw);
  const body = content.replace(/<!--[\s\S]*?-->/g, "").trim();
  const title = data.title ? `# ${data.title}\n\n` : "";
  return BOM + title + body + "\n";
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
function generateLlmsTxt(pages, siteUrl) {
  // Use absolute URLs so link-resolution checkers can verify them.
  const base = siteUrl.replace(/\/$/, "");

  const lines = [
    "# ICP Developer Docs",
    "",
    "> Developer documentation for building full-stack web applications, DeFi protocols, and cross-chain integrations on the Internet Computer.",
    "",
    "Agent skills for IC development: https://skills.internetcomputer.org/.well-known/skills/index.json",
    "",
  ];

  // Root index page
  const rootIndex = pages.find((p) => p.file === "index.md");
  if (rootIndex) {
    lines.push(
      `- [${rootIndex.title}](${base}/index.md): ${rootIndex.description}`
    );
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
      const url = `${base}/${page.file}`;
      const entry = page.description
        ? `- [${page.title}](${url}): ${page.description}`
        : `- [${page.title}](${url})`;
      lines.push(entry);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export default function agentDocs() {
  let siteUrl = "";

  return {
    name: "agent-docs",
    hooks: {
      "astro:config:done": ({ config }) => {
        siteUrl = config.site || "";
      },
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
        const llmsTxt = generateLlmsTxt(pages, siteUrl);
        fs.writeFileSync(path.join(outDir, "llms.txt"), llmsTxt);
        logger.info(
          `Generated llms.txt (${llmsTxt.length} chars, ${pages.length} pages)`
        );
      },
    },
  };
}
