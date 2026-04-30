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
import { execSync } from "node:child_process";
import { Resvg } from "@resvg/resvg-js";
import { fileURLToPath } from "node:url";
import { glob } from "glob";
import matter from "gray-matter";
import { sidebar } from "../sidebar.mjs";
import { TITLE, DESCRIPTION, PUBLISHER } from "../src/branding.mjs";
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

const LLMS_TXT_DIRECTIVE =
  "> For the complete documentation index, see [llms.txt](/llms.txt)\n\n";

/** Strip YAML frontmatter, HTML comments, and MDX artifacts; prepend title heading. */
function cleanMarkdown(raw, isMdx = false) {
  const { data, content } = matter(raw);
  let body = content.replace(/<!--[\s\S]*?-->/g, "");
  if (isMdx) {
    body = stripMdx(body);
  }
  body = body.replace(/\n{3,}/g, "\n\n").trim();
  const title = data.title ? `# ${data.title}\n\n` : "";
  return BOM + title + LLMS_TXT_DIRECTIVE + body + "\n";
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

    // Strip <CardGrid> layout wrappers (Starlight built-in)
    if (/^\s*<\/?CardGrid\b[^>]*>\s*$/.test(line)) {
      continue;
    }

    // Convert <Card title="X"> to a heading; strip </Card>
    if (/^\s*<\/Card>\s*$/.test(line)) {
      out.push("");
      continue;
    }
    const cardMatch = line.match(/^\s*<Card\b([^>]*)>\s*$/);
    if (cardMatch) {
      const title = cardMatch[1].match(/\btitle=["']([^"']+)["']/)?.[1];
      if (title) {
        out.push(`### ${title}`);
        out.push("");
        continue;
      }
    }

    // Convert <LinkCard title="X" description="Y" href="Z" /> to a markdown link
    const linkCardMatch = line.match(/^\s*<LinkCard\b([^>]*)\/>\s*$/);
    if (linkCardMatch) {
      const attrs = linkCardMatch[1];
      const title = attrs.match(/\btitle=["']([^"']+)["']/)?.[1];
      const description = attrs.match(/\bdescription=["']([^"']+)["']/)?.[1];
      const href = attrs.match(/\bhref=["']([^"']+)["']/)?.[1];
      if (title && href) {
        out.push(`- [${title}](${href})${description ? ` — ${description}` : ""}`);
        continue;
      }
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

    // Check for leftover JSX tags (< followed by uppercase = component).
    // Strip inline code spans first to avoid false positives on generic type
    // parameters and URL path variables like <T>, <ECID> inside backticks.
    // Skip table rows (start with |) for the same reason.
    const lineForJsxCheck = line.replace(/`[^`]*`/g, "``");
    if (!lineForJsxCheck.trimStart().startsWith("|") && /<\/?[A-Z]\w*[\s>]/.test(lineForJsxCheck)) {
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
    `# ${TITLE}`,
    "",
    `> ${DESCRIPTION}`,
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

/** Get last git commit date (ISO 8601) for a file, or null if unavailable. */
function getGitDate(filePath) {
  try {
    const date = execSync(`git log -1 --format=%cI -- "${filePath}"`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return date || null;
  } catch {
    return null;
  }
}

/** Try .md then .mdx source; return git date for whichever exists. */
function getPageGitDate(pageFile, docsDir) {
  for (const f of [
    path.join(docsDir, pageFile),
    path.join(docsDir, pageFile.replace(/\.md$/, ".mdx")),
  ]) {
    if (fs.existsSync(f)) {
      const d = getGitDate(f);
      if (d) return d;
    }
  }
  return null;
}

/** Escape special XML characters. */
function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

        // 4. Generate llms-full.txt (full content dump for bulk ingestion / RAG pipelines)
        const fullParts = [llmsTxt];
        for (const page of [...pages].sort((a, b) => a.file.localeCompare(b.file))) {
          const mdContent = fs.readFileSync(path.join(outDir, page.file), "utf-8");
          fullParts.push("\n---\n", mdContent);
        }
        fs.writeFileSync(path.join(outDir, "llms-full.txt"), fullParts.join("\n"));
        logger.info(`Generated llms-full.txt (${pages.length} pages)`);

        // 5. Generate RSS feed
        const base = siteUrl.replace(/\/$/, "");
        const feedItems = pages
          .map((p) => {
            const slug = p.file.replace(/\.md$/, "").replace(/(?:^|\/)index$/, "");
            const url = slug ? `${base}/${slug}/` : `${base}/`;
            const date = getPageGitDate(p.file, docsDir);
            return { ...p, url, date };
          })
          .sort((a, b) => {
            if (a.date && b.date) return b.date.localeCompare(a.date);
            return a.date ? -1 : b.date ? 1 : 0;
          });

        const channelPubDate = feedItems.find((i) => i.date);
        const feedXml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
          "  <channel>",
          `    <title>${escapeXml(TITLE)}</title>`,
          `    <link>${base}/</link>`,
          `    <description>${escapeXml(DESCRIPTION)}</description>`,
          "    <language>en-us</language>",
          `    <copyright>${escapeXml(PUBLISHER)}</copyright>`,
          `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
          channelPubDate
            ? `    <pubDate>${new Date(channelPubDate.date).toUTCString()}</pubDate>`
            : "",
          `    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>`,
          ...feedItems.map((item) =>
            [
              "    <item>",
              `      <title>${escapeXml(item.title)}</title>`,
              `      <link>${item.url}</link>`,
              item.description
                ? `      <description><![CDATA[${item.description}]]></description>`
                : "",
              item.date
                ? `      <pubDate>${new Date(item.date).toUTCString()}</pubDate>`
                : "",
              `      <guid isPermaLink="true">${item.url}</guid>`,
              `      <dc:creator>${escapeXml(PUBLISHER)}</dc:creator>`,
              "    </item>",
            ]
              .filter(Boolean)
              .join("\n")
          ),
          "  </channel>",
          "</rss>",
        ]
          .filter(Boolean)
          .join("\n");

        fs.writeFileSync(path.join(outDir, "feed.xml"), feedXml);
        logger.info(`Generated feed.xml (${feedItems.length} items)`);

        // 6. Inject lastmod into sitemap based on git commit dates
        const sitemapFiles = (await glob("sitemap-*.xml", { cwd: outDir })).filter(
          (f) => f !== "sitemap-index.xml" && f !== "sitemap.xml"
        );
        let lastmodCount = 0;
        for (const sitemapFile of sitemapFiles) {
          const sitemapPath = path.join(outDir, sitemapFile);
          const content = fs.readFileSync(sitemapPath, "utf-8");
          const modified = content.replace(
            /<url>\s*<loc>([^<]+)<\/loc>\s*<\/url>/g,
            (match, rawUrl) => {
              const url = rawUrl.trim();
              const pathname = url
                .replace(base, "")
                .replace(/^\//, "")
                .replace(/\/$/, "");
              const pageFile = (pathname || "index") + ".md";
              let date = getPageGitDate(pageFile, docsDir);
              if (!date && pathname) {
                date = getPageGitDate(pathname + "/index.md", docsDir);
              }
              if (!date) return match;
              lastmodCount++;
              return `<url><loc>${url}</loc><lastmod>${new Date(date).toISOString().split("T")[0]}</lastmod></url>`;
            }
          );
          fs.writeFileSync(sitemapPath, modified);
        }
        if (sitemapFiles.length > 0) {
          logger.info(`Injected lastmod into ${lastmodCount} sitemap URLs`);
        }

        // 7. Inject agent signaling directive into HTML pages
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

        // 8. Alias sitemap-index.xml → sitemap.xml
        // Astro's sitemap integration outputs sitemap-index.xml, but crawlers
        // and the agentdocsspec checker expect /sitemap.xml by convention.
        const sitemapIndex = path.join(outDir, "sitemap-index.xml");
        const sitemapAlias = path.join(outDir, "sitemap.xml");
        if (fs.existsSync(sitemapIndex) && !fs.existsSync(sitemapAlias)) {
          fs.copyFileSync(sitemapIndex, sitemapAlias);
          logger.info("Copied sitemap-index.xml → sitemap.xml");
        }

        // 9. Convert og-image.svg → og-image.png
        // SVG is the source of truth; PNG is what gets referenced in og:image / twitter:image
        // because Twitter/X rejects SVG for social sharing previews.
        const ogSvgPath = path.join(outDir, "og-image.svg");
        if (fs.existsSync(ogSvgPath)) {
          const fontsDir = path.resolve(
            path.dirname(fileURLToPath(import.meta.url)),
            "../src/fonts"
          );
          const fontFiles = [
            "Inter-Regular.ttf",
            "Inter-Medium.ttf",
            "Inter-SemiBold.ttf",
            "Inter-Bold.ttf",
            "Newsreader-Variable.ttf",
          ].map((f) => path.join(fontsDir, f));

          const svg = fs.readFileSync(ogSvgPath, "utf-8");
          const resvg = new Resvg(svg, {
            font: {
              fontFiles,
              loadSystemFonts: false,
              defaultFontFamily: "Inter",
              sansSerifFamily: "Inter",
              serifFamily: "Newsreader",
            },
            fitTo: { mode: "original" },
          });
          const pngBuffer = resvg.render().asPng();
          fs.writeFileSync(path.join(outDir, "og-image.png"), pngBuffer);
          logger.info("Generated og-image.png from og-image.svg");
        }
      },
    },
  };
}
