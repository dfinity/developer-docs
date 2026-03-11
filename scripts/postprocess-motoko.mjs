#!/usr/bin/env node
/**
 * Post-process synced Motoko docs:
 * 1. Remove duplicate H1 headings (Starlight generates from title frontmatter)
 * 2. Rewrite broken relative links to match the flattened directory structure
 * 3. Replace core library links with mops.one links
 * 4. Replace links to pages outside the synced set with external URLs
 * 5. Remove sub-section index.md and _category_.yml files (sidebar is config-driven)
 *
 * Run after sync-motoko.sh and before building.
 */

import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const MOTOKO_DIR = resolve("src/content/docs/languages/motoko");

// ── Build slug index: basename (without .md) -> absolute URL path ──

const slugIndex = new Map();

function indexDir(dir, urlPrefix) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      indexDir(join(dir, entry.name), `${urlPrefix}/${entry.name}`);
    } else if (entry.name.endsWith(".md") && entry.name !== "index.md") {
      const slug = entry.name.replace(/\.md$/, "");
      slugIndex.set(slug, `${urlPrefix}/${slug}`);
    }
  }
}

indexDir(MOTOKO_DIR, "/languages/motoko");

// ── Map original nested filenames to flattened slugs ──
// The sync script strips numeric prefixes: "1-actors-async.md" -> "actors-async.md"
// These mappings handle links that reference the OLD numbered filenames.

const oldToSlug = {
  // fundamentals/1-basic-syntax/*
  "1-defining-an-actor": "defining-an-actor",
  "2-imports": "imports",
  "3-comments": "comments",
  "4-identifiers": "identifiers",
  "5-literals": "literals",
  "6-printing-values": "printing-values",
  "7-whitespace": "whitespace",
  "8-functions": "functions",
  "9-blocks": "blocks",
  "10-expression-declarations": "expression-declarations",
  "11-operators": "operators",
  "12-traps": "traps",
  // fundamentals/2-actors/*
  "1-actors-async": "actors-async",
  "2-state": "state",
  "3-data-persistence": "data-persistence",
  "4-compatibility": "compatibility",
  "5-messaging": "messaging",
  // fundamentals/3-types/*
  "1-primitive-types": "primitive-types",
  "2-shared-types": "shared-types",
  "3-functions": "functions",
  "4-tuples": "tuples",
  "5-records": "records",
  "6-objects-classes": "objects-classes",
  "7-variants": "variants",
  "8-immutable-arrays": "immutable-arrays",
  "9-mutable-arrays": "mutable-arrays",
  "10-options": "options",
  "11-results": "results",
  "12-advanced-types": "advanced-types",
  "13-stable-types": "stable-types",
  "14-subtyping": "subtyping",
  // fundamentals/4-declarations/*
  "1-variable-declarations": "variable-declarations",
  "2-type-declarations": "type-declarations",
  "3-object-declaration": "object-declaration",
  "4-class-declarations": "class-declarations",
  "5-module-declarations": "module-declarations",
  "6-function-declarations": "function-declarations",
  // fundamentals/5-control-flow/*
  "1-basic-control-flow": "basic-control-flow",
  "2-conditionals": "conditionals",
  "3-loops": "loops",
  "4-numbers": "numbers",
  "5-switch": "switch",
  "6-characters-text": "characters-text",
  "7-type-conversions": "type-conversions",
  // fundamentals/2-actors/6-orthogonal-persistence/*
  "enhanced": "orthogonal-persistence-enhanced",
  "classical": "orthogonal-persistence-classical",
};

let unresolvedCount = 0;

// ── Rewrite a single relative link ──

function rewriteLink(matchedPath, anchor, sourceFile) {
  const cleanPath = matchedPath.replace(/\.md$/, "").replace(/\/index$/, "");

  // Core library links -> mops.one
  const coreMatch = cleanPath.match(/(?:\.\.\/)*core\/(\w+)/);
  if (coreMatch) {
    const mod = coreMatch[1];
    if (mod === "index") return `https://mops.one/core${anchor}`;
    return `https://mops.one/core/docs/${mod}${anchor}`;
  }

  // Extract the filename slug from the path
  const parts = cleanPath.split("/");
  const fileSlug = parts[parts.length - 1];

  // Try direct match in slug index
  if (slugIndex.has(fileSlug)) return `${slugIndex.get(fileSlug)}${anchor}`;

  // Try oldToSlug mapping
  if (oldToSlug[fileSlug] && slugIndex.has(oldToSlug[fileSlug])) {
    return `${slugIndex.get(oldToSlug[fileSlug])}${anchor}`;
  }

  // Fallback: external Motoko docs for pages we don't sync
  if (
    cleanPath.includes("style") ||
    cleanPath.includes("language-manual") ||
    cleanPath.includes("motoko-tooling")
  ) {
    return `/languages/motoko/reference/2-motoko-grammar/${anchor}`;
  }

  unresolvedCount++;
  console.warn(`  UNRESOLVED: ${matchedPath} in ${sourceFile}`);
  return null;
}

// ── Process a single file ──

function processFile(filePath) {
  let content = readFileSync(filePath, "utf-8");
  const relPath = filePath.replace(resolve(".") + "/", "");
  let changed = false;

  // 1. Remove duplicate H1 if frontmatter has title
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (fmMatch && /^title:/m.test(fmMatch[1])) {
    const afterFm = content.slice(fmMatch[0].length);
    const h1Match = afterFm.match(/^\s*\n?# .+\n/);
    if (h1Match) {
      content = fmMatch[0] + afterFm.slice(h1Match[0].length);
      changed = true;
    }
  }

  // 2. Rewrite relative links (../ paths)
  const linkRegex = /\]\((\.\.[^)]*?)(#[^)]+)?\)/g;
  content = content.replace(linkRegex, (match, path, anchor) => {
    anchor = anchor || "";
    const newUrl = rewriteLink(path, anchor, relPath);
    if (newUrl) {
      changed = true;
      return `](${newUrl})`;
    }
    return match;
  });

  if (changed) writeFileSync(filePath, content);
  return changed;
}

// ── Remove sub-section index.md and _category_.yml files ──

function removeNavFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      removeNavFiles(full);
    } else if (entry.name === "_category_.yml" || entry.name === "_category_.json") {
      unlinkSync(full);
      console.log(`  Removed ${full.replace(resolve(".") + "/", "")}`);
    }
  }
}

// Remove index.md from subsections (not the top-level motoko/index.md)
for (const section of ["fundamentals", "icp-features", "reference"]) {
  const idx = join(MOTOKO_DIR, section, "index.md");
  if (existsSync(idx)) {
    unlinkSync(idx);
    console.log(`  Removed ${section}/index.md`);
  }
}

removeNavFiles(MOTOKO_DIR);

// ── Process all .md files ──

let filesChanged = 0;

function walkAndProcess(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkAndProcess(full);
    } else if (entry.name.endsWith(".md")) {
      if (processFile(full)) filesChanged++;
    }
  }
}

walkAndProcess(MOTOKO_DIR);

console.log(`\nPost-processing complete: ${filesChanged} files updated.`);

if (unresolvedCount > 0) {
  console.error(
    `\nERROR: ${unresolvedCount} unresolved link(s). Update oldToSlug mapping in postprocess-motoko.mjs.`,
  );
  process.exit(1);
}
