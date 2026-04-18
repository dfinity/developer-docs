#!/usr/bin/env node
/**
 * Post-process synced Motoko docs:
 * 1. Remove duplicate H1 headings (Starlight renders title from frontmatter)
 * 2. Rewrite relative links to match the flattened directory structure
 * 3. Redirect core library links to mops.one
 * 4. Remove _category_.yml and sub-section index.md files
 * 5. Expand Docusaurus file-embed blocks (```lang file=<path>)
 * 6. Convert Docusaurus remote-reference blocks (```md reference) to links
 */

import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolve as resolvePath } from 'node:path';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const MOTOKO_DIR = join(ROOT, 'docs', 'languages', 'motoko');
const MOTOKO_SOURCE_MD = join(ROOT, '.sources', 'motoko', 'doc', 'md');

// Build slug index: basename (without .md) -> absolute URL path
const slugIndex = new Map();

function indexDir(dir, urlPrefix) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      indexDir(join(dir, entry.name), `${urlPrefix}/${entry.name}`);
    } else if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
      const slug = entry.name.replace(/\.md$/, '');
      slugIndex.set(slug, `${urlPrefix}/${slug}`);
    }
  }
}

indexDir(MOTOKO_DIR, '/languages/motoko');

let unresolvedCount = 0;

function rewriteLink(matchedPath, anchor, sourceFile) {
  const cleanPath = matchedPath.replace(/\.md$/, '').replace(/\/index$/, '');

  // Core library links -> mops.one
  const coreMatch = cleanPath.match(/(?:(?:\.\.\/)*|\.\/?)core(?:\/(\w+))?/);
  if (coreMatch) {
    const mod = coreMatch[1];
    return mod
      ? `https://mops.one/core/docs/${mod}${anchor}`
      : `https://mops.one/core${anchor}`;
  }

  // Non-synced Motoko docs (language manual, style guide, tooling) -> external docs
  if (
    cleanPath.includes('language-manual') ||
    cleanPath.includes('style') ||
    cleanPath.includes('motoko-tooling')
  ) {
    return `https://docs.motoko.org${anchor}`;
  }

  const parts = cleanPath.split('/');
  const fileSlug = parts[parts.length - 1];

  // Section index links (e.g. ./index.md) — redirect to the section page
  if (fileSlug === 'index' || fileSlug === '' || fileSlug === '.') {
    const sourceDir = sourceFile.split('/').slice(-2, -1)[0];
    return `/languages/motoko/${sourceDir}/${anchor}`;
  }

  // Direct match
  if (slugIndex.has(fileSlug)) return `${slugIndex.get(fileSlug)}${anchor}`;

  // Strip numeric prefix (e.g. "10-comments" -> "comments")
  const stripped = fileSlug.replace(/^\d+-/, '');
  if (slugIndex.has(stripped)) return `${slugIndex.get(stripped)}${anchor}`;

  // Nested file: try parent-dir + filename (e.g. orthogonal-persistence/enhanced -> orthogonal-persistence-enhanced)
  if (parts.length >= 2) {
    const parent = parts[parts.length - 2].replace(/^\d+-/, '');
    const combined = `${parent}-${stripped}`;
    if (slugIndex.has(combined)) return `${slugIndex.get(combined)}${anchor}`;
  }

  // Same-directory sibling: infer prefix from the source file's own slug
  // e.g. orthogonal-persistence-classical.md linking to ./enhanced.md -> orthogonal-persistence-enhanced
  const sourceSlug = sourceFile.split('/').pop().replace(/\.md$/, '');
  const sourceParts = sourceSlug.split('-');
  for (let i = sourceParts.length - 1; i >= 1; i--) {
    const prefix = sourceParts.slice(0, i).join('-');
    const candidate = `${prefix}-${stripped}`;
    if (slugIndex.has(candidate)) return `${slugIndex.get(candidate)}${anchor}`;
  }

  unresolvedCount++;
  console.warn(`  UNRESOLVED: ${matchedPath} in ${sourceFile}`);
  return null;
}

function processFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  const relPath = filePath.replace(ROOT + '/', '');
  let changed = false;

  // Expand Docusaurus file-embed blocks: ```lang file=<relative-path>
  // The path is relative to the source file's original location in the submodule.
  // After flattening, that depth information is lost, so we probe at increasing
  // subdirectory depths (0, 1, 2) until the file resolves.
  const fileEmbedRe = /^```\s*(\w+) file=([^\n]+)\n```/gm;
  content = content.replace(fileEmbedRe, (match, lang, filePath) => {
    const sectionMatch = relPath.match(/docs\/languages\/motoko\/([^/]+)\//);
    const section = sectionMatch ? sectionMatch[1] : 'reference';
    const fp = filePath.trim();
    let abs = null;
    for (let depth = 0; depth <= 2; depth++) {
      // Simulate being `depth` levels deeper by adding placeholder subdirs
      const candidate = resolvePath(join(MOTOKO_SOURCE_MD, section, 'x/'.repeat(depth)), fp);
      if (existsSync(candidate)) { abs = candidate; break; }
    }
    if (abs) {
      changed = true;
      return `\`\`\`${lang}\n${readFileSync(abs, 'utf-8').trim()}\n\`\`\``;
    }
    console.warn(`  FILE-EMBED UNRESOLVED: ${filePath} in ${relPath}`);
    return match;
  });

  // Expand Docusaurus remote-reference blocks by reading from the local submodule.
  // Maps https://github.com/<org>/<repo>/blob/<ref>/<path> -> .sources/<repo>/<path>
  const remoteRefRe = /^```(\w+) reference\n(https?:\/\/[^\n]+)\n```/gm;
  content = content.replace(remoteRefRe, (match, lang, url) => {
    const ghMatch = url.match(/github\.com\/[^/]+\/([^/]+)\/blob\/[^/]+\/(.+)/);
    if (ghMatch) {
      const localPath = join(ROOT, '.sources', ghMatch[1], ghMatch[2]);
      if (existsSync(localPath)) {
        changed = true;
        const fileContent = readFileSync(localPath, 'utf-8').trim();
        return lang === 'md' ? fileContent : `\`\`\`${lang}\n${fileContent}\n\`\`\``;
      }
    }
    console.warn(`  REMOTE-REF UNRESOLVED: ${url} in ${relPath}`);
    return match;
  });

  // Normalize Starlight aside syntax
  // 1. Map unsupported types: info -> note, warn -> caution
  // 2. Space-separated title (same line only) -> bracket title: :::note Title -> :::note[Title]
  //    Use [^\S\n]+ to match only horizontal whitespace, not newlines, so the first body
  //    line is not accidentally promoted to a title.
  const normalized = content
    .replace(/^:::info\b/gm, ':::note')
    .replace(/^:::warn\b/gm, ':::caution')
    .replace(/^(:::(?:note|tip|caution|danger|warning))[^\S\n]+([^\n\[]+)/gm, '$1[$2]');
  if (normalized !== content) { content = normalized; changed = true; }

  // Remove duplicate H1 when frontmatter already has a title
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (fmMatch && /^title:/m.test(fmMatch[1])) {
    const afterFm = content.slice(fmMatch[0].length);
    const h1Match = afterFm.match(/^\s*\n?# .+\n/);
    if (h1Match) {
      content = fmMatch[0] + afterFm.slice(h1Match[0].length);
      changed = true;
    }
  }

  // Rewrite relative links (./ and ../ paths)
  const linkRe = /\]\((\.[^)#]*?)(#[^)]+)?\)/g;
  content = content.replace(linkRe, (match, path, anchor) => {
    anchor = anchor || '';
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

// Remove _category_.yml files and sub-section index.md files
function removeNavFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      removeNavFiles(full);
    } else if (entry.name === '_category_.yml' || entry.name === '_category_.json') {
      unlinkSync(full);
      console.log(`  Removed ${full.replace(ROOT + '/', '')}`);
    }
  }
}

for (const section of ['fundamentals', 'icp-features', 'reference']) {
  const idx = join(MOTOKO_DIR, section, 'index.md');
  if (existsSync(idx)) {
    unlinkSync(idx);
    console.log(`  Removed ${section}/index.md`);
  }
}

removeNavFiles(MOTOKO_DIR);

// Process all .md files
let filesChanged = 0;

function walkAndProcess(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkAndProcess(full);
    } else if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
      if (processFile(full)) filesChanged++;
    }
  }
}

walkAndProcess(MOTOKO_DIR);

console.log(`\nPost-processing complete: ${filesChanged} files updated.`);

if (unresolvedCount > 0) {
  console.error(`\nWARNING: ${unresolvedCount} unresolved link(s) — review output above.`);
}
