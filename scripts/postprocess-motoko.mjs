#!/usr/bin/env node
/**
 * Post-process synced Motoko docs.
 *
 * Most cleanup that this script previously did is now handled upstream in
 * caffeinelabs/motoko doc/md/ (PR #6132): numeric prefix removal, frontmatter
 * migration, aside syntax normalization, H1 removal, _category_.yml deletion,
 * <motokoExamples> placeholder insertion, mo:base→mo:core rewrites.
 *
 * What remains:
 * 1. Rewrite docs.internetcomputer.org links to internal paths.
 * 2. Replace em-dashes (banned per ICP style guide).
 *    Still needed for Changelog entries.
 * 3. Redirect remaining core/base library relative links to mops.one (safety net).
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const MOTOKO_DIR = join(ROOT, 'docs', 'languages', 'motoko');

let unresolvedExternalCount = 0;

function rewriteExternalLink(url) {
  const normalized = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const withoutAnchor = normalized.replace(/#.*$/, '');
  const anchor = normalized.includes('#') ? '#' + normalized.split('#').slice(1).join('#') : '';

  // docs.internetcomputer.org is the developer-docs site itself — convert to a
  // root-relative internal path by stripping the domain. This covers all links
  // that upstream PR #6132 §5 rewrote from the retired internetcomputer.org/docs/
  // portal format to the current docs.internetcomputer.org/... format.
  if (withoutAnchor.startsWith('docs.internetcomputer.org/')) {
    return '/' + withoutAnchor.slice('docs.internetcomputer.org/'.length) + anchor;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Process a single file
// ---------------------------------------------------------------------------
function processFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  const relPath = filePath.replace(ROOT + '/', '');
  let changed = false;

  // Mark subdirectory index.md stubs as sidebar.hidden so Starlight autogenerate
  // doesn't surface them as duplicate entries alongside the explicit sidebar groups.
  // These stubs have no body (only frontmatter); the root index.md has content and
  // is excluded by the path check below.
  const isSubdirIndex =
    filePath !== join(MOTOKO_DIR, 'index.md') &&
    filePath.endsWith('/index.md');
  if (isSubdirIndex && !content.includes('hidden:')) {
    content = content.replace(/^(sidebar:\s*\n(?:[ \t]+.*\n)*)/m, (match) => {
      changed = true;
      return match.trimEnd() + '\n  hidden: true\n';
    });
  }

  // Redirect remaining core/base relative links to mops.one (safety net — should
  // be a no-op for content fixed in PR #6132, but catches any stragglers).
  const relLinkRe = /\]\((\.[^)#]*?\.md)(#[^)]+)?\)/g;
  content = content.replace(relLinkRe, (match, path, anchor) => {
    anchor = anchor || '';
    const clean = path.replace(/\.md$/, '').replace(/\/index$/, '');
    const coreMatch = clean.match(/(?:(?:\.\.\/)*|\.\/?)core(?:\/(\w+))?/);
    if (coreMatch) {
      changed = true;
      return `](${coreMatch[1] ? `https://mops.one/core/docs/${coreMatch[1]}` : 'https://mops.one/core'}${anchor})`;
    }
    const baseMatch = clean.match(/(?:(?:\.\.\/)*|\.\/?)base\/(\w+)/);
    if (baseMatch) {
      changed = true;
      return `](https://mops.one/core/docs/${baseMatch[1]}${anchor})`;
    }
    return match;
  });

  // Rewrite external links to internal paths.
  const extDomain = 'docs\\.internetcomputer\\.org\\/';
  const extLinkRe = new RegExp(
    `\\((https?:\\/\\/${extDomain}[^)\\s]*)\\)|(?<!\\()(https?:\\/\\/${extDomain}[^\\s)]*)`,
    'g',
  );
  content = content.replace(extLinkRe, (match, inParen, bare) => {
    const url = inParen || bare;
    const internal = rewriteExternalLink(url);
    if (internal) {
      changed = true;
      return inParen ? `(${internal})` : internal;
    }
    unresolvedExternalCount++;
    console.warn(`  UNRESOLVED-EXTERNAL: ${url} in ${relPath}`);
    return match;
  });

  // Replace em-dashes in prose (banned per ICP style guide). Skip code blocks.
  const parts = content.split(/(^```[\s\S]*?^```)/m);
  const fixed = parts
    .map((part, i) => (i % 2 === 0 ? part.replace(/ — /g, ': ') : part))
    .join('');
  if (fixed !== content) { content = fixed; changed = true; }

  if (changed) writeFileSync(filePath, content);
  return changed;
}

// ---------------------------------------------------------------------------
// Inline Changelog.md at sync time — before walkAndProcess so that
// em-dash replacement and link rewrites apply to the inlined content too.
//
// The upstream changelog.md stub uses ```md file=<motokoRoot>/Changelog.md```
// (a build-time file include). That mechanism relies on .sources/motoko being
// present during `npm run build`, which is true locally but not when `icp
// deploy` runs the build inside its own recipe (the submodule is not in scope
// at that point). To avoid a silent empty page, we expand the include here at
// sync time so the file is fully self-contained in docs/.
// ---------------------------------------------------------------------------
const CHANGELOG_STUB = join(MOTOKO_DIR, 'reference', 'changelog.md');
const UPSTREAM_CHANGELOG = join(ROOT, '.sources', 'motoko', 'Changelog.md');

if (existsSync(CHANGELOG_STUB) && existsSync(UPSTREAM_CHANGELOG)) {
  const stub = readFileSync(CHANGELOG_STUB, 'utf-8');
  if (stub.includes('file=<motokoRoot>/Changelog.md')) {
    const changelogContent = readFileSync(UPSTREAM_CHANGELOG, 'utf-8');
    const inlined = stub.replace(/```md file=<motokoRoot>\/Changelog\.md\n```/, changelogContent.trimEnd());
    writeFileSync(CHANGELOG_STUB, inlined);
    console.log('  Inlined Changelog.md into reference/changelog.md');
  }
}

// ---------------------------------------------------------------------------
// Walk and process all .md files (including index.md stubs)
// ---------------------------------------------------------------------------
let filesChanged = 0;

function walkAndProcess(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkAndProcess(full);
    } else if (entry.name.endsWith('.md')) {
      if (processFile(full)) filesChanged++;
    }
  }
}

walkAndProcess(MOTOKO_DIR);

console.log(`Post-processing complete: ${filesChanged} files updated.`);

if (unresolvedExternalCount > 0) {
  console.error(`\nWARNING: ${unresolvedExternalCount} UNRESOLVED-EXTERNAL link(s) — add a rewrite handler to rewriteExternalLink in postprocess-motoko.mjs.`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Generate sidebar-motoko.mjs from upstream doc/md/sidebar.mjs
//
// When the upstream submodule includes doc/md/sidebar.mjs (caffeinelabs/motoko
// PR docs/sidebar-extraction), this generates sidebar-motoko.mjs automatically
// so it never needs hand-editing. Slugs get the "languages/motoko/" prefix;
// autogenerate.directory values are prefixed the same way. The root slug
// "index" maps to "languages/motoko" (the section overview page).
//
// If sidebar.mjs is absent (submodule pinned to an older release), this step
// is skipped and the committed sidebar-motoko.mjs is used as-is.
// ---------------------------------------------------------------------------
const UPSTREAM_SIDEBAR = join(ROOT, '.sources/motoko/doc/site/sidebar.mjs');
const PREFIX = 'languages/motoko';

function transformEntry(entry) {
  if ('slug' in entry) {
    const slug = entry.slug === 'index' ? PREFIX : `${PREFIX}/${entry.slug}`;
    return { ...entry, slug };
  }
  if ('autogenerate' in entry) {
    return {
      ...entry,
      autogenerate: { ...entry.autogenerate, directory: `${PREFIX}/${entry.autogenerate.directory}` },
    };
  }
  if ('items' in entry) {
    return { ...entry, items: entry.items.map(transformEntry) };
  }
  return entry;
}

function jsify(val, depth = 0) {
  const pad = '  '.repeat(depth);
  const inner = '  '.repeat(depth + 1);
  if (typeof val === 'string') return `"${val}"`;
  if (typeof val === 'boolean' || typeof val === 'number') return String(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return '[]';
    return `[\n${val.map(v => `${inner}${jsify(v, depth + 1)}`).join(',\n')},\n${pad}]`;
  }
  if (val !== null && typeof val === 'object') {
    const entries = Object.entries(val).map(([k, v]) => `${inner}${k}: ${jsify(v, depth + 1)}`);
    return `{\n${entries.join(',\n')},\n${pad}}`;
  }
  return String(val);
}

if (existsSync(UPSTREAM_SIDEBAR)) {
  const { sidebar } = await import(UPSTREAM_SIDEBAR);
  const motokoSidebar = { label: 'Motoko', collapsed: true, items: sidebar.map(transformEntry) };
  const output =
    `// Auto-generated by scripts/postprocess-motoko.mjs — do not edit directly.\n` +
    `// To change navigation, edit doc/md/sidebar.mjs in caffeinelabs/motoko.\n` +
    `export const motokoSidebar = ${jsify(motokoSidebar)};\n`;
  writeFileSync(join(ROOT, 'sidebar-motoko.mjs'), output);
  console.log('Generated sidebar-motoko.mjs from upstream doc/md/sidebar.mjs');
} else {
  console.log('sidebar.mjs not found in submodule — keeping existing sidebar-motoko.mjs');
}
