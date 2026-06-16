#!/usr/bin/env node
// Syncs specs from .sources/internetidentity:
//   - docs/ii-spec.mdx       → docs/references/internet-identity-spec.md
//   - docs/vc-spec.md        → docs/references/verifiable-credentials-spec.md
//   - src/internet_identity/internet_identity.did → public/references/internet-identity.did
//
// Transformations applied to ii-spec:
//   - Strip MDX import lines
//   - Remove the H1 heading (Starlight renders the frontmatter title as H1)
//   - Rewrite absolute links that point to the public docs site back to internal paths
//   - Convert Mermaid sequenceDiagram blocks to PlantUML (site uses remarkPlantUML)
//   - Replace <CodeBlock> component with a download link to internet-identity.did
//   - Copy internet_identity.did to public/references/internet-identity.did
//
// Transformations applied to vc-spec:
//   - Remove the H1 heading (Starlight renders the frontmatter title as H1)
//   - Rewrite absolute links that point to the public docs site back to internal paths
//
// Link rewriting (shared by both specs):
//   Upstream links to pages that also live in this repo as absolute URLs. Those
//   URLs are unstable — the same destination has appeared as
//   `internetcomputer.org/docs/current/...` and as `docs.internetcomputer.org/...`,
//   and the two source files are not migrated in lockstep. We therefore strip the
//   volatile domain/prefix to a canonical `path#fragment` (canonicalize) and look
//   it up in PATH_MAP. The map only encodes the irregular bits that no string
//   transform can infer — e.g. upstream's single `ic-interface-spec` page is split
//   across several files here, with each anchor in a different file.
//
// Validation (exits non-zero on failure — fail loud, never silent):
//   - Any absolute link to the public docs site left unrewritten, in EITHER the
//     `internetcomputer.org/docs` (path) or `docs.internetcomputer.org` (subdomain)
//     form. A miss means a new/renamed link upstream that needs a PATH_MAP entry.
//   - Unconverted Mermaid blocks (ii-spec only)
//
// Usage: node scripts/sync-ii-spec.mjs
//   or:  npm run sync:ii-spec

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const SOURCE_MDX    = '.sources/internetidentity/docs/ii-spec.mdx';
const SOURCE_VC     = '.sources/internetidentity/docs/vc-spec.md';
const SOURCE_DID    = '.sources/internetidentity/src/internet_identity/internet_identity.did';
const TARGET        = 'docs/references/internet-identity-spec.md';
const TARGET_VC     = 'docs/references/verifiable-credentials-spec.md';
const TARGET_DID    = 'public/references/internet-identity.did';

// --- Link rewriting ---------------------------------------------------------

// Strip the volatile domain/prefix from a public-docs URL, leaving a canonical
// `path#fragment` used as the PATH_MAP key. Handles both the legacy
// `internetcomputer.org/docs/current/` prefix and the current
// `docs.internetcomputer.org/` subdomain, plus a stray slash before the fragment
// (`.../ic-interface-spec/#signatures`) or at the end.
function canonicalize(url) {
  return url
    .replace(/^https?:\/\/(?:docs\.)?internetcomputer\.org\/(?:docs\/current\/)?/, '')
    .replace(/\/(#|$)/, '$1');
}

// canonical path#fragment → internal relative link (paths are relative to
// docs/references/, where both synced specs live).
const PATH_MAP = {
  'references/ic-interface-spec#id-classes':                     './ic-interface-spec/index.md#id-classes',
  'references/ic-interface-spec#canister-signatures':            './ic-interface-spec/index.md#canister-signatures',
  'references/ic-interface-spec#signatures':                     './ic-interface-spec/index.md#signatures',
  'references/ic-interface-spec#system-api-inspect-message':     './ic-interface-spec/canister-interface.md#system-api-inspect-message',
  'references/ic-interface-spec#authentication':                 './ic-interface-spec/https-interface.md#authentication',
  'references/http-gateway-protocol-spec':                       './http-gateway-protocol-spec.md',
  'developer-docs/web-apps/custom-domains/using-custom-domains': '../guides/frontends/custom-domains.md',
  // The II spec page has been served under both slugs; map both to be safe.
  'references/ii-spec#alternative-frontend-origins':               './internet-identity-spec.md#alternative-frontend-origins',
  'references/internet-identity-spec#alternative-frontend-origins': './internet-identity-spec.md#alternative-frontend-origins',
};

// Matches an absolute link to the public docs site in either URL form. Does NOT
// match other internetcomputer.org subdomains (e.g. identity.internetcomputer.org),
// bare internetcomputer.org, or developer.mozilla.org.
const DOCS_LINK = /https?:\/\/(?:docs\.)?internetcomputer\.org(?:\/docs\/current)?\/[^\s\)">]+/g;

// Rewrite every public-docs link found via PATH_MAP. Records each applied
// rewrite (deduped) in `applied` for the adaptation log. Unknown links are left
// untouched so the validation pass can flag them.
function rewriteDocsLinks(text, applied) {
  return text.replace(DOCS_LINK, (url) => {
    const replacement = PATH_MAP[canonicalize(url)];
    if (replacement) {
      applied.add(`${canonicalize(url)} → ${replacement}`);
      return replacement;
    }
    return url;
  });
}

// Build the trailing adaptation-log comment from the rewrites actually applied
// plus the spec-specific structural changes.
function adaptationLog(applied, otherChanges, upstream) {
  let out = '\n<!--\n';
  if (applied.size) {
    out += 'Link replacements from source (absolute public-docs links rewritten to internal paths):\n';
    for (const line of [...applied].sort()) out += `  - ${line}\n`;
  }
  if (otherChanges.length) {
    out += 'Other changes from source:\n';
    for (const c of otherChanges) out += `  - ${c}\n`;
  }
  out += '-->\n';
  out += `<!-- Upstream: ${upstream} -->\n`;
  return out;
}

// Scan rewritten content for any public-docs link left unhandled, in either the
// path form (internetcomputer.org/docs) or the subdomain form
// (docs.internetcomputer.org). Returns the unique offenders.
function unhandledDocsLinks(text) {
  const re = /https?:\/\/(?:internetcomputer\.org\/docs|docs\.internetcomputer\.org)[^\s\)">]*/g;
  return [...new Set([...text.matchAll(re)].map(m => m[0]))];
}

// ----------------------------------------------------------------------------

if (!existsSync(SOURCE_MDX)) {
  console.error(
    `ERROR: ${SOURCE_MDX} not found.\n` +
    'Run: git submodule update --init --depth 1 .sources/internetidentity'
  );
  process.exit(1);
}

if (!existsSync(SOURCE_VC)) {
  console.error(
    `ERROR: ${SOURCE_VC} not found.\n` +
    'Run: git submodule update --init --depth 1 .sources/internetidentity'
  );
  process.exit(1);
}

const version = execSync('git -C .sources/internetidentity rev-parse --short HEAD')
  .toString().trim();
console.log(`Syncing II spec from dfinity/internet-identity@${version}...`);

let content = readFileSync(SOURCE_MDX, 'utf8');

// 1. Strip MDX import lines
content = content.replace(/^import .*\n/gm, '');

// 2. Strip the H1 (Starlight renders it from frontmatter)
content = content.replace(/^# The Internet Identity Specification\n\n/m, '');

// 3. Rewrite links
const iiApplied = new Set();
content = rewriteDocsLinks(content, iiApplied);

// The source links to the VC spec by its in-repo filename; retarget to ours.
const iiOtherChanges = [];
if (content.includes('](vc-spec.md)')) {
  content = content.replaceAll('](vc-spec.md)', '](./verifiable-credentials-spec.md)');
  iiOtherChanges.push('`](vc-spec.md)` (relative, same dir in source repo) → `](./verifiable-credentials-spec.md)`');
}

// 4. Convert Mermaid sequenceDiagram blocks to PlantUML
function convertMermaidSequence(body) {
  const lines = body.split('\n');
  const out = [];
  for (const line of lines) {
    if (line.trim() === 'sequenceDiagram') continue;
    // participant X as Long Name → participant "Long Name" as X
    const pm = line.match(/^(\s*)participant\s+(\S+)\s+as\s+(.+)$/);
    if (pm) {
      out.push(`${pm[1]}participant "${pm[3].trim()}" as ${pm[2]}`);
      continue;
    }
    // <br> → \n for multiline message labels
    out.push(line.replace(/<br\s*\/?>/gi, '\\n'));
  }
  while (out.length > 0 && out[out.length - 1].trim() === '') out.pop();
  return out.join('\n');
}

content = content.replace(/^```mermaid\n([\s\S]*?)^```/gm, (_, body) => {
  return '```plantuml\n' + convertMermaidSequence(body) + '\n```';
});

// 5. Replace the <CodeBlock> component with a download link to the .did file
content = content.replace(
  '<CodeBlock language="candid">{IICandidInterface}</CodeBlock>',
  'The complete Candid interface definition is available at [`internet-identity.did`](/references/internet-identity.did).' +
  ' This file defines all types and method signatures in machine-readable Candid format' +
  ' and can be used for binding generation and type checking.'
);

// 6. Strip leading blank lines, then inject frontmatter
content = content.replace(/^\n+/, '');
content =
  `---\n` +
  `title: "Internet Identity specification"\n` +
  `description: "Technical specification of the Internet Identity service: authentication protocol, backend interface, and implementation notes."\n` +
  `sidebar:\n` +
  `  order: 14\n` +
  `---\n\n` +
  content;

// 7. Append the link-adaptation log and Upstream comment
iiOtherChanges.push(
  '`# The Internet Identity Specification` H1 removed (Starlight renders frontmatter title as H1)',
  '`<CodeBlock language="candid">{IICandidInterface}</CodeBlock>` replaced with download link to /references/internet-identity.did',
  'Mermaid sequenceDiagram blocks converted to PlantUML (site uses remarkPlantUML, not Mermaid)',
);
content =
  content.trimEnd() +
  '\n' +
  adaptationLog(
    iiApplied,
    iiOtherChanges,
    'sync from dfinity/internet-identity — docs/ii-spec.mdx, src/internet_identity/internet_identity.did',
  );

writeFileSync(TARGET, content);
console.log(`Written: ${TARGET}`);

// Copy the .did file to public/references/
copyFileSync(SOURCE_DID, TARGET_DID);
console.log(`Written: ${TARGET_DID}`);

let failed = false;

// Warn about any remaining absolute docs links that weren't rewritten.
const remaining = unhandledDocsLinks(content);
if (remaining.length) {
  console.warn('\nWARNING: Unhandled absolute docs links — add them to PATH_MAP:');
  remaining.forEach(l => console.warn(`  ${l}  (key: ${canonicalize(l)})`));
  failed = true;
}

// Warn about unconverted Mermaid blocks (unsupported diagram type added upstream).
// Only sequenceDiagram is handled; anything else needs a new conversion case.
const mermaidBlocks = [...content.matchAll(/^```mermaid$/gm)];
if (mermaidBlocks.length) {
  console.warn('\nWARNING: Unconverted Mermaid blocks remain — add conversion support in convertMermaidSequence:');
  for (const m of mermaidBlocks) {
    const line = content.slice(0, m.index).split('\n').length;
    console.warn(`  line ${line}`);
  }
  failed = true;
}

// --- vc-spec sync ---
console.log(`\nSyncing VC spec from dfinity/internet-identity@${version}...`);

let vcContent = readFileSync(SOURCE_VC, 'utf8');

// 1. Strip the H1 (Starlight renders it from frontmatter)
vcContent = vcContent.replace(/^# II Verifiable Credential Spec \(MVP\)\n\n/m, '');

// 2. Rewrite public-docs links to internal paths
const vcApplied = new Set();
vcContent = rewriteDocsLinks(vcContent, vcApplied);

// 3. Strip leading blank lines, then inject frontmatter
vcContent = vcContent.replace(/^\n+/, '');
vcContent =
  `---\n` +
  `title: "Verifiable Credentials specification"\n` +
  `description: "Normative specification of the ICP Verifiable Credentials protocol: Issuer Candid API and Identity Provider window.postMessage interface."\n` +
  `sidebar:\n` +
  `  order: 15\n` +
  `---\n\n` +
  vcContent;

// 4. Append the link-adaptation log and Upstream comment
vcContent =
  vcContent.trimEnd() +
  '\n' +
  adaptationLog(
    vcApplied,
    ['`# II Verifiable Credential Spec (MVP)` H1 removed (Starlight renders frontmatter title as H1)'],
    'sync from dfinity/internet-identity — docs/vc-spec.md',
  );

writeFileSync(TARGET_VC, vcContent);
console.log(`Written: ${TARGET_VC}`);

// Validate vc-spec for unhandled docs links
const vcRemaining = unhandledDocsLinks(vcContent);
if (vcRemaining.length) {
  console.warn('\nWARNING: Unhandled absolute docs links in vc-spec — add them to PATH_MAP:');
  vcRemaining.forEach(l => console.warn(`  ${l}  (key: ${canonicalize(l)})`));
  failed = true;
}

if (failed) {
  process.exit(1);
} else {
  console.log('\nAll checks passed. Run `npm run build` to verify.');
}
