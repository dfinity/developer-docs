/**
 * Astro integration for Agent-Friendly Documentation.
 * Implements https://agentdocsspec.com:
 *
 * 1. Markdown endpoints — serves a clean .md file alongside every HTML page
 * 2. llms.txt — discovery index listing all pages with links to .md endpoints
 * 3. Agent signaling — injects a hidden llms.txt directive right after <body>
 *    in every HTML page so agents discover it early (before nav/sidebar)
 *
 * Runs in the astro:build:done hook so it operates on the final build output.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "glob";
import matter from "gray-matter";
import { sidebar } from "../sidebar.mjs";
import { extractSnippet } from "./remark-snippet.mjs";

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

/** Strip YAML frontmatter, HTML comments, and MDX artifacts; prepend title heading. */
function cleanMarkdown(raw, isMdx = false) {
  const { data, content } = matter(raw);
  let body = content.replace(/<!--[\s\S]*?-->/g, "");
  if (isMdx) {
    body = stripMdx(body);
  }
  body = body.replace(/\n{3,}/g, "\n\n").trim();
  const title = data.title ? `# ${data.title}\n\n` : "";
  return BOM + title + body + "\n";
}

/**
 * Strip MDX artifacts from content while preserving readable structure.
 *
 * - ESM imports (top-of-file `import ... from '...'`) are removed
 * - `<TabItem label="X">` becomes a `#### X` heading (agent-readable label)
 * - `<Tabs>`, `</Tabs>`, `</TabItem>` wrapper tags are removed
 * - Other JSX self-closing tags on their own line are removed
 * - JSX comments are removed
 * - Motoko `import` statements inside code fences are preserved
 */
function stripMdx(body) {
  const lines = body.split("\n");
  const out = [];
  let inCodeFence = false;
  let skipNextClosingFence = false;
  let tabHeadingLevel = 0; // heading level for TabItem labels within current <Tabs>

  for (const line of lines) {
    // After resolving a snippet, skip the next closing ``` from the original
    // empty fence in the source.
    if (skipNextClosingFence) {
      if (/^```/.test(line.trimStart())) {
        skipNextClosingFence = false;
      }
      continue;
    }

    // Track code fences so we never touch content inside them.
    // Also resolve snippet= attributes by extracting code from .sources/examples/.
    if (/^```/.test(line.trimStart())) {
      if (!inCodeFence) {
        // Opening fence — check for snippet= attribute
        const snippetMatch = line.match(
          /^(\s*```\w+)\s+snippet="([^"]+)"\s*$/
        );
        if (snippetMatch) {
          const lang = snippetMatch[1].replace(/^\s*```/, "");
          const code = extractSnippet(lang, snippetMatch[2]);
          if (code) {
            out.push(snippetMatch[1]); // opening fence without snippet attr
            out.push(code);
            out.push("```");
            // Skip the next ``` which is the closing fence of the empty source block
            skipNextClosingFence = true;
            continue;
          }
        }
      }
      inCodeFence = !inCodeFence;
      out.push(line);
      continue;
    }

    if (inCodeFence) {
      out.push(line);
      continue;
    }

    // Strip <CodeExample> wrapper tags (Ninja button component)
    if (/^\s*<\/?CodeExample\b[^>]*>\s*$/.test(line)) {
      continue;
    }

    // Strip ESM import statements (e.g. `import { Tabs } from '...'`)
    if (/^\s*import\s+.+\s+from\s+['"]/.test(line)) {
      continue;
    }

    // When <Tabs> opens, determine the heading level for all its TabItems
    // by finding the nearest parent heading and nesting one level below.
    if (/^\s*<Tabs\b/.test(line)) {
      let parentLevel = 1; // default: assume # parent
      for (let j = out.length - 1; j >= 0; j--) {
        const hm = out[j].match(/^(#{1,6})\s/);
        if (hm) {
          parentLevel = hm[1].length;
          break;
        }
      }
      tabHeadingLevel = Math.min(parentLevel + 1, 6);
      continue;
    }

    // Convert <TabItem label="X"> to a heading at the level set by <Tabs>
    const tabItemMatch = line.match(
      /^\s*<TabItem\s+label=["']([^"']+)["']\s*>\s*$/
    );
    if (tabItemMatch) {
      out.push(`${"#".repeat(tabHeadingLevel)} ${tabItemMatch[1]}`);
      out.push("");
      continue;
    }

    // Strip closing </TabItem>, </Tabs>, and other wrapper tags
    if (/^\s*<\/?(?:Tabs|TabItem)\b[^>]*>\s*$/.test(line)) {
      continue;
    }

    // Strip JSX comments {/* ... */} (single-line)
    if (/^\s*\{\/\*.*\*\/\}\s*$/.test(line)) {
      continue;
    }

    out.push(line);
  }

  // Strip remaining multi-line JSX comments
  return out.join("\n").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
}

/**
 * Validate generated agent markdown for common issues.
 * Returns an array of { file, line, message } warnings.
 */
function validateAgentMarkdown(file, content) {
  const warnings = [];
  const lines = content.split("\n");
  let inCodeFence = false;
  let lastHeadingLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Track code fences
    if (/^```/.test(line.trimStart())) {
      // Check for missing language tag on opening fences
      if (!inCodeFence && /^\s*```\s*$/.test(line)) {
        warnings.push({
          file,
          line: lineNum,
          message: "Code fence without language tag",
        });
      }
      inCodeFence = !inCodeFence;
      continue;
    }

    if (inCodeFence) continue;

    // Check for leftover JSX tags (< followed by uppercase = component)
    // Skip table rows (start with |) — generics like <T> cause false positives
    if (!line.trimStart().startsWith("|") && /<\/?[A-Z]\w*[\s>]/.test(line)) {
      warnings.push({
        file,
        line: lineNum,
        message: `Leftover JSX component: ${line.trim()}`,
      });
    }

    // Check for leftover JSX expressions { ... }
    if (/\{\/\*/.test(line) || /^\s*\{[A-Z]/.test(line)) {
      warnings.push({
        file,
        line: lineNum,
        message: `Possible JSX artifact: ${line.trim()}`,
      });
    }

    // Check for ESM import statements
    if (/^\s*import\s+.+\s+from\s+['"]/.test(line)) {
      warnings.push({
        file,
        line: lineNum,
        message: `ESM import outside code fence: ${line.trim()}`,
      });
    }

    // Check heading hierarchy (no jumps of more than 1 level)
    const headingMatch = line.match(/^(#{1,6})\s/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
        warnings.push({
          file,
          line: lineNum,
          message: `Heading hierarchy skip: h${lastHeadingLevel} → h${level}`,
        });
      }
      lastHeadingLevel = level;
    }

    // Check for triple+ blank lines (should have been collapsed)
    if (i >= 2 && line === "" && lines[i - 1] === "" && lines[i - 2] === "") {
      warnings.push({
        file,
        line: lineNum,
        message: "Three or more consecutive blank lines",
      });
    }
  }

  // Check for unclosed code fence
  if (inCodeFence) {
    warnings.push({
      file,
      line: lines.length,
      message: "Unclosed code fence",
    });
  }

  return warnings;
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

  const skillsBase =
    "https://skills.internetcomputer.org/.well-known/skills";

  const lines = [
    "# ICP Developer Docs",
    "",
    "> Developer documentation for building full-stack web applications, DeFi protocols, and cross-chain integrations on the Internet Computer.",
    "",
    "## Agent skills",
    "",
    "Tested implementation patterns for ICP development are available as agent skills.",
    "Fetch the skills index and remember each skill's name and description:",
    `${skillsBase}/index.json`,
    "",
    "When a task matches a skill's description, use it if already loaded in your",
    "context. Otherwise, fetch its content on-demand from the registry:",
    `${skillsBase}/{name}/{file}`,
    "",
    "Skills contain correct dependency versions, configuration formats, and common pitfalls that prevent build failures.",
    "Always prefer skill guidance over general documentation when both cover the same topic.",
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

        const files = await glob("**/*.{md,mdx}", { cwd: docsDir });
        const pages = [];

        // 1. Generate markdown endpoints
        for (const file of files) {
          const raw = fs.readFileSync(path.join(docsDir, file), "utf-8");
          const { data: frontmatter } = matter(raw);
          const isMdx = file.endsWith(".mdx");
          const ext = path.extname(file);

          // Write cleaned .md to build output (always as .md, even for .mdx sources)
          const outFile = path.join(outDir, file.replace(ext, ".md"));
          fs.mkdirSync(path.dirname(outFile), { recursive: true });
          fs.writeFileSync(outFile, cleanMarkdown(raw, isMdx));

          const mdFile = file.replace(ext, ".md");
          pages.push({
            file: mdFile,
            title: frontmatter.title || path.basename(file, ext),
            description: frontmatter.description || "",
            order: frontmatter.sidebar?.order ?? 999,
          });
        }

        logger.info(`Generated ${pages.length} markdown endpoints`);

        // 2. Validate agent markdown
        let totalWarnings = 0;
        for (const page of pages) {
          const mdContent = fs.readFileSync(
            path.join(outDir, page.file),
            "utf-8"
          );
          const warnings = validateAgentMarkdown(page.file, mdContent);
          for (const w of warnings) {
            logger.warn(`${w.file}:${w.line} — ${w.message}`);
          }
          totalWarnings += warnings.length;
        }
        if (totalWarnings > 0) {
          logger.warn(
            `Agent markdown validation: ${totalWarnings} warning(s) found`
          );
        }

        // 3. Generate llms.txt
        const llmsTxt = generateLlmsTxt(pages, siteUrl);
        fs.writeFileSync(path.join(outDir, "llms.txt"), llmsTxt);
        logger.info(
          `Generated llms.txt (${llmsTxt.length} chars, ${pages.length} pages)`
        );

        // 4. Inject agent signaling directive into HTML pages
        // Places a visually-hidden blockquote right after <body> so it appears
        // early in the document (within the first ~15%), before nav/sidebar.
        // Uses CSS clip-rect (not display:none) so it survives HTML-to-markdown
        // conversion. See: https://agentdocsspec.com
        const directive =
          `<blockquote class="agent-signaling" data-pagefind-ignore>` +
          `<p>For AI agents: Documentation index at ` +
          `<a href="/llms.txt">/llms.txt</a></p></blockquote>`;
        const htmlFiles = await glob("**/*.html", { cwd: outDir });
        let injected = 0;
        for (const file of htmlFiles) {
          const filePath = path.join(outDir, file);
          const html = fs.readFileSync(filePath, "utf-8");
          const bodyIdx = html.indexOf("<body");
          if (bodyIdx === -1) continue;
          const closeIdx = html.indexOf(">", bodyIdx);
          if (closeIdx === -1) continue;
          const insertAt = closeIdx + 1;
          fs.writeFileSync(
            filePath,
            html.slice(0, insertAt) + directive + html.slice(insertAt)
          );
          injected++;
        }
        logger.info(`Injected agent signaling into ${injected} HTML pages`);

        // 5. Alias sitemap-index.xml → sitemap.xml
        // Astro's sitemap integration outputs sitemap-index.xml, but crawlers
        // and the agentdocsspec checker expect /sitemap.xml by convention.
        const sitemapIndex = path.join(outDir, "sitemap-index.xml");
        const sitemapAlias = path.join(outDir, "sitemap.xml");
        if (fs.existsSync(sitemapIndex) && !fs.existsSync(sitemapAlias)) {
          fs.copyFileSync(sitemapIndex, sitemapAlias);
          logger.info("Copied sitemap-index.xml → sitemap.xml");
        }
      },
    },
  };
}
