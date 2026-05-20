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
 * 1. Rewrite external internetcomputer.org/docs links to internal paths.
 *    Still needed for Changelog entries and any legacy links not yet fixed upstream.
 * 2. Replace em-dashes (banned per ICP style guide).
 *    Still needed for Changelog entries.
 * 3. Redirect remaining core/base library relative links to mops.one (safety net).
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const MOTOKO_DIR = join(ROOT, 'docs', 'languages', 'motoko');

// ---------------------------------------------------------------------------
// External URL rewrite table: internetcomputer.org/docs/... → internal path
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

  // IC interface spec (anchor-specific entries before the base URL)
  ['internetcomputer.org/docs/references/ic-interface-spec#global-timer',               '/references/ic-interface-spec/canister-interface#global-timer'],
  ['internetcomputer.org/docs/references/ic-interface-spec#heartbeat',                   '/references/ic-interface-spec/canister-interface#heartbeat'],
  ['internetcomputer.org/docs/references/ic-interface-spec#system-api-inspect-message',  '/references/ic-interface-spec/canister-interface#system-api-inspect-message'],
  ['internetcomputer.org/docs/references/ic-interface-spec#ic-raw_rand',                 '/references/ic-interface-spec/management-canister#ic-raw_rand'],
  ['internetcomputer.org/docs/references/ic-interface-spec',         '/references/ic-interface-spec/'],
  ['internetcomputer.org/docs/current/references/ic-interface-spec', '/references/ic-interface-spec/'],
  ['internetcomputer.org/docs/current/references/ic-interface-spec/','/references/ic-interface-spec/'],
  ['internetcomputer.org/docs/references/system-canisters/management-canister', '/references/management-canister'],

  // Storage (anchor-specific entries before base URL)
  ['internetcomputer.org/docs/building-apps/canister-management/storage#heap-memory',            '/concepts/orthogonal-persistence#heap-wasm-linear-memory'],
  ['internetcomputer.org/docs/building-apps/canister-management/storage#motoko-storage-handling', '/concepts/orthogonal-persistence#motoko-true-orthogonal-persistence'],
  ['internetcomputer.org/docs/building-apps/canister-management/storage', '/concepts/orthogonal-persistence'],

  // Getting started
  ['internetcomputer.org/docs/current/developer-docs/getting-started/install',           '/getting-started/quickstart'],
  ['internetcomputer.org/docs/current/developer-docs/setup/install',                     '/getting-started/quickstart'],
  ['internetcomputer.org/docs/current/developer-docs/getting-started/deploy-and-manage', '/getting-started/quickstart'],
  ['internetcomputer.org/docs/current/developer-docs/getting-started/development-workflow','/getting-started/quickstart'],

  // docs.motoko.org (non-existent domain) and mo-doc link
  ['docs.motoko.org', '/developer-tools/#mo-doc'],
  ['docs.internetcomputer.org/developer-tools/#mo-doc', '/developer-tools/#mo-doc'],

  // Motoko-internal links using old portal paths
  ['internetcomputer.org/docs/motoko/language-manual',                          '/languages/motoko/reference/language-manual'],
  ['internetcomputer.org/docs/current/motoko/main/reference/language-manual',   '/languages/motoko/reference/language-manual'],
  ['internetcomputer.org/docs/motoko/data-persistence',                         '/languages/motoko/fundamentals/actors/data-persistence'],
  ['internetcomputer.org/docs/motoko/icp-features/system-functions',            '/languages/motoko/icp-features/system-functions'],
]);

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

  if (anchor && externalToInternal.has(normalized)) return externalToInternal.get(normalized);
  if (externalToInternal.has(withoutAnchor)) return externalToInternal.get(withoutAnchor) + anchor;
  for (const [key, val] of externalToInternal) {
    if (withoutAnchor.startsWith(key + '/') || withoutAnchor.startsWith(key + '#')) {
      return val + anchor;
    }
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
  const extDomain = '(?:(?:www\\.)?internetcomputer\\.org\\/docs\\/|docs\\.internetcomputer\\.org\\/|docs\\.motoko\\.org)';
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
  console.error(`\nWARNING: ${unresolvedExternalCount} UNRESOLVED-EXTERNAL link(s) — add missing entries to externalToInternal in postprocess-motoko.mjs.`);
  process.exit(1);
}
