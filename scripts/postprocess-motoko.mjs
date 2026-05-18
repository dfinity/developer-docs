#!/usr/bin/env node
/**
 * Post-process synced Motoko docs:
 * 1. Remove duplicate H1 headings (Starlight renders title from frontmatter)
 * 2. Rewrite relative links to match the new directory structure
 * 3. Rewrite external internetcomputer.org/docs links to internal paths
 * 4. Redirect core library links to mops.one
 * 5. Redirect motoko-tooling links to docs.motoko.org (section is not synced)
 * 6. Remove _category_.yml and sub-section index.md files
 * 7. Rewrite Docusaurus file-embed paths to use <motokoExamples> placeholder
 *    (remark-include-file resolves these at build time from the pinned submodule)
 * 8. Convert Docusaurus remote-reference blocks (```md reference) to links
 * 9. Normalize Starlight aside syntax
 *
 * Directory structure after sync:
 *   fundamentals/
 *     hello-world.md, modules-imports.md, ...  (top-level standalone pages)
 *     basic-syntax/   actors/   types/   declarations/   control-flow/
 *     actors/orthogonal-persistence/
 *   icp-features/  (flat)
 *   reference/     (flat, including language-manual.md, style-guide.md, compiler-ref.md)
 *
 * Known renames applied during sync (sync-motoko.sh):
 *   fundamentals/3-types/3-functions.md → fundamentals/types/function-types.md
 *     (avoids slug collision with fundamentals/1-basic-syntax/8-functions.md)
 */

import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const MOTOKO_DIR = join(ROOT, 'docs', 'languages', 'motoko');

// ---------------------------------------------------------------------------
// Slug index: basename (without .md) → absolute URL path
// Handles subdirectories recursively.
// When two files share the same basename, the LAST one encountered wins in
// the simple lookup; the full-path lookup (dirSlug/fileSlug) always disambiguates.
// ---------------------------------------------------------------------------
const slugIndex = new Map();      // basename-slug → url
const fullSlugIndex = new Map();  // "dir/basename-slug" → url  (for disambiguation)

function indexDir(dir, urlPrefix) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      indexDir(join(dir, entry.name), `${urlPrefix}/${entry.name}`);
    } else if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
      const slug = entry.name.replace(/\.md$/, '');
      slugIndex.set(slug, `${urlPrefix}/${slug}`);
      // Also store with parent directory for disambiguation
      fullSlugIndex.set(`${urlPrefix.split('/').pop()}/${slug}`, `${urlPrefix}/${slug}`);
    }
  }
}

indexDir(MOTOKO_DIR, '/languages/motoko');

// ---------------------------------------------------------------------------
// Known renames: source-relative path (with numeric prefixes) → dest slug.
// Used so that links referencing the pre-rename source path still resolve.
// ---------------------------------------------------------------------------
const syncRenames = new Map([
  // types/3-functions.md was renamed to types/function-types.md
  ['3-types/3-functions', 'function-types'],
  ['types/functions', 'function-types'],   // also catches stripped-prefix form
  // Top-level reference files with numeric prefixes
  ['14-style', 'style-guide'],
  ['style', 'style-guide'],
  ['15-compiler-ref', 'compiler-ref'],
  ['16-language-manual', 'language-manual'],
]);

// ---------------------------------------------------------------------------
// External URL rewrite table: internetcomputer.org/docs/... → internal path
// Only rewrite URLs where the internal page actually exists and is a good match.
// ---------------------------------------------------------------------------
const externalToInternal = new Map([
  // Canister management
  ['internetcomputer.org/docs/building-apps/canister-management/logs',            '/guides/canister-management/logs'],
  ['internetcomputer.org/docs/building-apps/canister-management/resource-limits', '/guides/canister-management/large-wasm'],
  ['internetcomputer.org/docs/building-apps/canister-management/snapshots',       '/guides/canister-management/snapshots'],
  ['internetcomputer.org/docs/building-apps/canister-management/upgrade',         '/guides/canister-management/lifecycle'],
  ['internetcomputer.org/docs/current/developer-docs/smart-contracts/maintain/logs',    '/guides/canister-management/logs'],
  ['internetcomputer.org/docs/current/developer-docs/smart-contracts/maintain/upgrade', '/guides/canister-management/lifecycle'],

  // Core concepts
  ['internetcomputer.org/docs/building-apps/essentials/canisters',          '/concepts/canisters'],
  ['internetcomputer.org/docs/building-apps/essentials/message-execution',  '/references/message-execution-properties'],
  ['internetcomputer.org/docs/references/async-code',                       '/references/message-execution-properties'],

  // Candid
  ['internetcomputer.org/docs/building-apps/interact-with-canisters/candid/candid-concepts', '/guides/canister-calls/candid'],
  ['internetcomputer.org/docs/building-apps/interact-with-canisters/candid/using-candid',    '/guides/canister-calls/candid'],
  ['internetcomputer.org/docs/current/developer-docs/smart-contracts/candid',                '/guides/canister-calls/candid'],
  ['internetcomputer.org/docs/current/developer-docs/smart-contracts/candid/candid-concepts','/guides/canister-calls/candid'],
  ['internetcomputer.org/docs/current/developer-docs/smart-contracts/candid/candid-howto',   '/guides/canister-calls/candid'],
  ['internetcomputer.org/docs/references/candid-ref',                                        '/references/candid-spec'],

  // Calling
  ['internetcomputer.org/docs/building-apps/interact-with-canisters/query-calls',          '/concepts/canisters'],
  ['internetcomputer.org/docs/building-apps/interact-with-canisters/update-calls',         '/concepts/canisters'],
  ['internetcomputer.org/docs/building-apps/interact-with-canisters/agents/overview',      '/guides/canister-calls/calling-from-clients'],
  ['internetcomputer.org/docs/current/developer-docs/smart-contracts/call/overview',       '/guides/canister-calls/calling-from-clients'],

  // Timers and randomness
  ['internetcomputer.org/docs/building-apps/network-features/periodic-tasks-timers',                  '/guides/backends/timers'],
  ['internetcomputer.org/docs/building-apps/network-features/randomness',                             '/guides/backends/randomness'],
  ['internetcomputer.org/docs/current/developer-docs/backend/periodic-tasks',                         '/guides/backends/timers'],
  ['internetcomputer.org/docs/current/developer-docs/smart-contracts/advanced-features/randomness',   '/guides/backends/randomness'],

  // Security
  ['internetcomputer.org/docs/building-apps/security/iam/',                                             '/guides/security/identity-and-access-management'],
  ['internetcomputer.org/docs/building-apps/security/iam',                                              '/guides/security/identity-and-access-management'],
  ['internetcomputer.org/docs/current/developer-docs/security/security-best-practices/inter-canister-calls', '/guides/security/inter-canister-calls'],

  // References
  ['internetcomputer.org/docs/references/ic-interface-spec',         '/references/ic-interface-spec/'],
  ['internetcomputer.org/docs/current/references/ic-interface-spec', '/references/ic-interface-spec/'],
  ['internetcomputer.org/docs/current/references/ic-interface-spec/','/references/ic-interface-spec/'],
  ['internetcomputer.org/docs/references/system-canisters/management-canister', '/references/management-canister'],

  // Storage (heap / stable memory concepts)
  ['internetcomputer.org/docs/building-apps/canister-management/storage', '/concepts/orthogonal-persistence'],

  // Getting started (old portal install/deploy paths)
  ['internetcomputer.org/docs/current/developer-docs/getting-started/install',           '/getting-started/quickstart'],
  ['internetcomputer.org/docs/current/developer-docs/setup/install',                     '/getting-started/quickstart'],
  ['internetcomputer.org/docs/current/developer-docs/getting-started/deploy-and-manage', '/getting-started/quickstart'],
  ['internetcomputer.org/docs/current/developer-docs/getting-started/development-workflow','/getting-started/quickstart'],

  // Motoko-internal links using old portal paths
  ['internetcomputer.org/docs/motoko/language-manual',                          '/languages/motoko/reference/language-manual'],
  ['internetcomputer.org/docs/current/motoko/main/reference/language-manual',   '/languages/motoko/reference/language-manual'],
  ['internetcomputer.org/docs/motoko/data-persistence',                         '/languages/motoko/fundamentals/actors/data-persistence'],
  ['internetcomputer.org/docs/motoko/icp-features/system-functions',            '/languages/motoko/icp-features/system-functions'],
]);

// ---------------------------------------------------------------------------
// Rewrite a single relative link path.
// matchedPath: the raw path from the markdown link (e.g. ../3-types/3-functions.md)
// anchor:      the fragment if any (e.g. #some-section), already includes leading #
// sourceFile:  the file containing the link (absolute path), used for disambiguation
// ---------------------------------------------------------------------------
let unresolvedCount = 0;
let unresolvedExternalCount = 0;

function rewriteLink(matchedPath, anchor, sourceFile) {
  const cleanPath = matchedPath.replace(/\.md$/, '').replace(/\/index$/, '');

  // Core library links → mops.one
  const coreMatch = cleanPath.match(/(?:(?:\.\.\/)*|\.\/?)core(?:\/(\w+))?/);
  if (coreMatch) {
    const mod = coreMatch[1];
    return mod
      ? `https://mops.one/core/docs/${mod}${anchor}`
      : `https://mops.one/core${anchor}`;
  }

  // Base library links → mops.one/core (base is deprecated; core is the successor)
  // e.g. ./base/Bool.md → https://mops.one/core/docs/Bool
  const baseMatch = cleanPath.match(/(?:(?:\.\.\/)*|\.\/?)base\/(\w+)/);
  if (baseMatch) {
    const mod = baseMatch[1];
    return `https://mops.one/core/docs/${mod}${anchor}`;
  }

  // motoko-tooling (section not synced) → docs.motoko.org
  if (cleanPath.includes('motoko-tooling')) {
    return `https://docs.motoko.org${anchor}`;
  }

  // Section index links (e.g. ./index.md) → section root
  const parts = cleanPath.split('/');
  const rawSlug = parts[parts.length - 1];
  if (rawSlug === 'index' || rawSlug === '' || rawSlug === '.') {
    const sourceDir = sourceFile.split('/').slice(-2, -1)[0];
    return `/languages/motoko/${sourceDir}/${anchor}`;
  }

  // Strip numeric prefix from the filename part of the path
  const fileSlug = rawSlug.replace(/^\d+-/, '');

  // Check for known renames from sync-motoko.sh
  // Try both raw relative path (without leading ../) and stripped version
  const relPathClean = parts
    .filter(p => p !== '..' && p !== '.')
    .map(p => p.replace(/^\d+-/, ''))
    .join('/');
  if (syncRenames.has(relPathClean)) {
    const renamedSlug = syncRenames.get(relPathClean);
    if (slugIndex.has(renamedSlug)) return `${slugIndex.get(renamedSlug)}${anchor}`;
  }
  // Also try the raw path for renames (numeric prefixes preserved)
  const relPathRaw = parts.filter(p => p !== '..' && p !== '.').join('/');
  if (syncRenames.has(relPathRaw)) {
    const renamedSlug = syncRenames.get(relPathRaw);
    if (slugIndex.has(renamedSlug)) return `${slugIndex.get(renamedSlug)}${anchor}`;
  }

  // Direct slug match
  if (slugIndex.has(fileSlug)) {
    // If there could be ambiguity, prefer the match whose URL includes a
    // directory component from the original path
    const directUrl = slugIndex.get(fileSlug);
    if (parts.length >= 2) {
      const parentDir = parts[parts.length - 2].replace(/^\d+-/, '');
      const fullKey = `${parentDir}/${fileSlug}`;
      if (fullSlugIndex.has(fullKey)) return `${fullSlugIndex.get(fullKey)}${anchor}`;
    }
    return `${directUrl}${anchor}`;
  }

  // Same-directory sibling: infer prefix from the source file's own slug
  const sourceSlug = sourceFile.split('/').pop().replace(/\.md$/, '');
  const sourceParts = sourceSlug.split('-');
  for (let i = sourceParts.length - 1; i >= 1; i--) {
    const prefix = sourceParts.slice(0, i).join('-');
    const candidate = `${prefix}-${fileSlug}`;
    if (slugIndex.has(candidate)) return `${slugIndex.get(candidate)}${anchor}`;
  }

  unresolvedCount++;
  console.warn(`  UNRESOLVED: ${matchedPath} in ${sourceFile.replace(ROOT + '/', '')}`);
  return null;
}

// ---------------------------------------------------------------------------
// Rewrite external internetcomputer.org/docs links to internal paths
// ---------------------------------------------------------------------------
function rewriteExternalLink(url) {
  // Strip protocol + trailing slash for map lookup
  const normalized = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const withoutAnchor = normalized.replace(/#.*$/, '');
  const anchor = normalized.includes('#') ? '#' + normalized.split('#').slice(1).join('#') : '';

  if (externalToInternal.has(withoutAnchor)) {
    return externalToInternal.get(withoutAnchor) + anchor;
  }
  // Prefix-match for URLs with additional path segments or trailing params
  for (const [key, val] of externalToInternal) {
    if (withoutAnchor.startsWith(key + '/') || withoutAnchor.startsWith(key + '#')) {
      return val + anchor;
    }
  }
  return null; // keep as-is
}

// ---------------------------------------------------------------------------
// Process a single file
// ---------------------------------------------------------------------------
function processFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  const relPath = filePath.replace(ROOT + '/', '');
  let changed = false;

  // Rewrite Docusaurus file-embed paths to use the <motokoExamples> placeholder.
  // remark-include-file resolves <motokoExamples> to .sources/motoko/doc/md/examples/
  // at build time, so examples always stay live from the pinned submodule.
  // Also normalises the leading space that the Motoko source uses before the language
  // identifier (``` motoko → ```motoko) so remark parses the lang correctly.
  // Line-range suffixes (#L49-L58) are passed through unchanged.
  //
  // Once the upstream adopts <motokoExamples> paths directly, this rewrite
  // becomes a no-op and can be removed.
  const rewritten = content.replace(
    /^```[ \t]*(\w+)([^\n]*?\bfile=)(?:\.\.\/)+examples\//gm,
    '```$1$2<motokoExamples>/',
  );
  if (rewritten !== content) { content = rewritten; changed = true; }

  // Expand Docusaurus remote-reference blocks
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
  const normalized = content
    .replace(/^:::info\b/gm, ':::note')
    .replace(/^:::warn\b/gm, ':::caution')
    // :::type [LinkText](url) → :::type[LinkText]  (Starlight titles don't support links)
    // Use [^\S\n]+ (non-newline whitespace) so multi-line notes with a link as
    // the first content line are not accidentally merged into the aside title.
    .replace(/^(:::(?:note|tip|caution|danger|warning))[^\S\n]+\[([^\]]+)\]\([^)]+\)/gm, '$1[$2]')
    // :::type plain text title → :::type[plain text title]
    .replace(/^(:::(?:note|tip|caution|danger|warning))[^\S\n]+([^\n\[]+)/gm, '$1[$2]');
  if (normalized !== content) { content = normalized; changed = true; }

  // Convert sidebar_position → sidebar.order for sections using autogenerate
  // (currently icp-features). Explicitly-listed sections (fundamentals, reference)
  // ignore sidebar.order so we only do this where autogenerate is active.
  if (relPath.includes('/icp-features/')) {
    const posMatch = content.match(/^sidebar_position:\s*(\d+)\s*$/m);
    if (posMatch && !/^sidebar:/m.test(content)) {
      content = content.replace(/^sidebar_position:\s*\d+\s*$/m, `sidebar:\n  order: ${posMatch[1]}`);
      changed = true;
    }
  }

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

  // Rewrite external internetcomputer.org/docs links to internal paths.
  // Matches both markdown link parens (url) and bare URLs in text.
  const extLinkRe = /\((https?:\/\/(?:www\.)?internetcomputer\.org\/docs\/[^)\s]+)\)|(?<!\()(https?:\/\/(?:www\.)?internetcomputer\.org\/docs\/[^\s)]+)/g;
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

  if (changed) writeFileSync(filePath, content);
  return changed;
}

// ---------------------------------------------------------------------------
// Remove _category_.yml files and sub-section index.md files
// ---------------------------------------------------------------------------
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

// Remove sub-section index.md files (Docusaurus category pages, not needed in Starlight)
for (const section of ['fundamentals', 'icp-features', 'reference']) {
  const idx = join(MOTOKO_DIR, section, 'index.md');
  if (existsSync(idx)) {
    unlinkSync(idx);
    console.log(`  Removed ${section}/index.md`);
  }
}
// Also remove index.md files inside fundamentals subdirs
for (const sub of ['basic-syntax', 'actors', 'types', 'declarations', 'control-flow']) {
  const idx = join(MOTOKO_DIR, 'fundamentals', sub, 'index.md');
  if (existsSync(idx)) {
    unlinkSync(idx);
    console.log(`  Removed fundamentals/${sub}/index.md`);
  }
}
const opIdx = join(MOTOKO_DIR, 'fundamentals', 'actors', 'orthogonal-persistence', 'index.md');
if (existsSync(opIdx)) {
  unlinkSync(opIdx);
  console.log('  Removed fundamentals/actors/orthogonal-persistence/index.md');
}

removeNavFiles(MOTOKO_DIR);

// ---------------------------------------------------------------------------
// Walk and process all .md files
// ---------------------------------------------------------------------------
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
  console.error(`\nWARNING: ${unresolvedCount} unresolved relative link(s) — review output above.`);
}
if (unresolvedExternalCount > 0) {
  console.error(`\nWARNING: ${unresolvedExternalCount} UNRESOLVED-EXTERNAL link(s) — add missing entries to externalToInternal in postprocess-motoko.mjs.`);
}
