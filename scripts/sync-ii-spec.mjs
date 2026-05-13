#!/usr/bin/env node
// Syncs specs from .sources/internetidentity:
//   - docs/ii-spec.mdx       → docs/references/internet-identity-spec.md
//   - docs/vc-spec.md        → docs/references/verifiable-credentials-spec.md
//   - src/internet_identity/internet_identity.did → public/references/internet-identity.did
//
// Transformations applied to ii-spec:
//   - Strip MDX import lines
//   - Remove the H1 heading (Starlight renders the frontmatter title as H1)
//   - Rewrite absolute / relative links that point outside this site
//   - Convert Mermaid sequenceDiagram blocks to PlantUML (site uses remarkPlantUML)
//   - Replace <CodeBlock> component with a download link to internet-identity.did
//   - Copy internet_identity.did to public/references/internet-identity.did
//
// Transformations applied to vc-spec:
//   - Remove the H1 heading (Starlight renders the frontmatter title as H1)
//   - Rewrite absolute links that point to the retired portal
//
// Validation (exits non-zero on failure):
//   - Unhandled absolute internetcomputer.org/docs links (both specs)
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
const linkMap = [
  [
    'https://internetcomputer.org/docs/current/references/ic-interface-spec#id-classes',
    './ic-interface-spec/index.md#id-classes',
  ],
  [
    'https://internetcomputer.org/docs/current/references/ic-interface-spec/#canister-signatures',
    './ic-interface-spec/index.md#canister-signatures',
  ],
  [
    'https://internetcomputer.org/docs/current/references/ic-interface-spec/#signatures',
    './ic-interface-spec/index.md#signatures',
  ],
  [
    'https://internetcomputer.org/docs/current/references/ic-interface-spec/#system-api-inspect-message',
    './ic-interface-spec/canister-interface.md#system-api-inspect-message',
  ],
  [
    'https://internetcomputer.org/docs/current/references/ic-interface-spec#authentication',
    './ic-interface-spec/https-interface.md#authentication',
  ],
  [
    'https://internetcomputer.org/docs/current/references/http-gateway-protocol-spec',
    './http-gateway-protocol-spec.md',
  ],
  [
    'https://internetcomputer.org/docs/current/developer-docs/web-apps/custom-domains/using-custom-domains',
    '../guides/frontends/custom-domains.md',
  ],
  [
    '](vc-spec.md)',
    '](./verifiable-credentials-spec.md)',
  ],
];

for (const [old, replacement] of linkMap) {
  content = content.replaceAll(old, replacement);
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

// 6. Replace the <CodeBlock> component with a download link to the .did file
content = content.replace(
  '<CodeBlock language="candid">{IICandidInterface}</CodeBlock>',
  'The complete Candid interface definition is available at [`internet-identity.did`](/references/internet-identity.did).' +
  ' This file defines all types and method signatures in machine-readable Candid format' +
  ' and can be used for binding generation and type checking.'
);

// 7. Strip leading blank lines, then inject frontmatter
content = content.replace(/^\n+/, '');
content =
  `---\n` +
  `title: "Internet Identity specification"\n` +
  `description: "Technical specification of the Internet Identity service: authentication protocol, backend interface, and implementation notes."\n` +
  `sidebar:\n` +
  `  order: 14\n` +
  `---\n\n` +
  content;

// 8. Append the link-adaptation log and Upstream comment
content =
  content.trimEnd() +
  '\n' +
  `\n<!--\n` +
  `Link replacements from source (source used absolute/relative paths pointing outside this site):\n` +
  `  - internetcomputer.org [/docs]/current/references/ic-interface-spec#id-classes → ./ic-interface-spec/index.md#id-classes\n` +
  `  - internetcomputer.org [/docs]/current/references/ic-interface-spec/#canister-signatures → ./ic-interface-spec/index.md#canister-signatures (×2)\n` +
  `  - internetcomputer.org [/docs]/current/references/ic-interface-spec/#signatures → ./ic-interface-spec/index.md#signatures\n` +
  `  - internetcomputer.org [/docs]/current/references/ic-interface-spec#authentication → ./ic-interface-spec/https-interface.md#authentication\n` +
  `  - internetcomputer.org [/docs]/current/references/ic-interface-spec/#system-api-inspect-message → ./ic-interface-spec/canister-interface.md#system-api-inspect-message\n` +
  `  - internetcomputer.org [/docs]/current/references/http-gateway-protocol-spec → ./http-gateway-protocol-spec.md\n` +
  `  - internetcomputer.org [/docs]/current/developer-docs/web-apps/custom-domains/using-custom-domains → ../guides/frontends/custom-domains.md\n` +
  `  - vc-spec.md (relative, same dir in source repo) → ./verifiable-credentials-spec.md\n` +
  `Other changes from source:\n` +
  `  - \`# The Internet Identity Specification\` H1 removed (Starlight renders frontmatter title as H1)\n` +
  `  - \`<CodeBlock language="candid">{IICandidInterface}</CodeBlock>\` replaced with download link to /references/internet-identity.did\n` +
  `  - Mermaid sequenceDiagram blocks converted to PlantUML (site uses remarkPlantUML, not Mermaid)\n` +
  `-->\n` +
  `<!-- Upstream: sync from dfinity/internet-identity — docs/ii-spec.mdx, src/internet_identity/internet_identity.did -->\n`;

writeFileSync(TARGET, content);
console.log(`Written: ${TARGET}`);

// Copy the .did file to public/references/
copyFileSync(SOURCE_DID, TARGET_DID);
console.log(`Written: ${TARGET_DID}`);

let failed = false;

// Warn about any remaining absolute docs links that weren't rewritten.
const remaining = [...content.matchAll(/https?:\/\/internetcomputer\.org\/docs[^\s\)">]*/g)]
  .map(m => m[0]);
const unique = [...new Set(remaining)];
if (unique.length) {
  console.warn('\nWARNING: Unhandled absolute links — add them to the linkMap:');
  unique.forEach(l => console.warn(`  ${l}`));
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

// 2. Rewrite retired portal links to internal paths
// Note: upstream still uses internetcomputer.org/docs/current/ — tracked in
// https://github.com/dfinity/internet-identity/issues/3889
const vcLinkMap = [
  [
    'https://internetcomputer.org/docs/current/references/ii-spec#alternative-frontend-origins',
    './internet-identity-spec.md#alternative-frontend-origins',
  ],
  [
    'https://internetcomputer.org/docs/current/references/ic-interface-spec#canister-signatures',
    './ic-interface-spec/index.md#canister-signatures',
  ],
];

for (const [old, replacement] of vcLinkMap) {
  vcContent = vcContent.replaceAll(old, replacement);
}

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
  `\n<!--\n` +
  `Link replacements from source (source used absolute paths pointing to the retired portal):\n` +
  `  - internetcomputer.org/docs/current/references/ii-spec#alternative-frontend-origins → ./internet-identity-spec.md#alternative-frontend-origins (×4)\n` +
  `  - internetcomputer.org/docs/current/references/ic-interface-spec#canister-signatures → ./ic-interface-spec/index.md#canister-signatures\n` +
  `Other changes from source:\n` +
  `  - \`# II Verifiable Credential Spec (MVP)\` H1 removed (Starlight renders frontmatter title as H1)\n` +
  `-->\n` +
  `<!-- Upstream: sync from dfinity/internet-identity — docs/vc-spec.md -->\n`;

writeFileSync(TARGET_VC, vcContent);
console.log(`Written: ${TARGET_VC}`);

// Validate vc-spec for unhandled portal links
const vcRemaining = [...vcContent.matchAll(/https?:\/\/internetcomputer\.org\/docs[^\s\)">]*/g)]
  .map(m => m[0]);
const vcUnique = [...new Set(vcRemaining)];
if (vcUnique.length) {
  console.warn('\nWARNING: Unhandled absolute links in vc-spec — add them to vcLinkMap:');
  vcUnique.forEach(l => console.warn(`  ${l}`));
  failed = true;
}

if (failed) {
  process.exit(1);
} else {
  console.log('\nAll checks passed. Run `npm run build` to verify.');
}
