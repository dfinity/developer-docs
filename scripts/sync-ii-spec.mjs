#!/usr/bin/env node
// Syncs the Internet Identity specification from .sources/internetidentity into
// docs/references/internet-identity-spec.md and public/references/internet-identity.did.
//
// Transformations applied:
//   - Strip MDX import lines
//   - Remove the H1 heading (Starlight renders the frontmatter title as H1)
//   - Rewrite absolute / relative links that point outside this site
//   - Replace <CodeBlock> component with a download link to internet-identity.did
//   - Copy internet_identity.did to public/references/internet-identity.did
//
// Usage: node scripts/sync-ii-spec.mjs
//   or:  npm run sync:ii-spec

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const SOURCE_MDX = '.sources/internetidentity/docs/ii-spec.mdx';
const SOURCE_DID = '.sources/internetidentity/src/internet_identity/internet_identity.did';
const TARGET     = 'docs/references/internet-identity-spec.md';
const TARGET_DID = 'public/references/internet-identity.did';

if (!existsSync(SOURCE_MDX)) {
  console.error(
    `ERROR: ${SOURCE_MDX} not found.\n` +
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
    '](../guides/authentication/verifiable-credentials.md)',
  ],
];

for (const [old, replacement] of linkMap) {
  content = content.replaceAll(old, replacement);
}

// 4. Replace the <CodeBlock> component with a download link to the .did file
content = content.replace(
  '<CodeBlock language="candid">{IICandidInterface}</CodeBlock>',
  'The complete Candid interface definition is available at [`internet-identity.did`](/references/internet-identity.did).' +
  ' This file defines all types and method signatures in machine-readable Candid format' +
  ' and can be used for binding generation and type checking.'
);

// 5. Strip leading blank lines, then inject frontmatter
content = content.replace(/^\n+/, '');
content =
  `---\n` +
  `title: "Internet Identity specification"\n` +
  `description: "Technical specification of the Internet Identity service: authentication protocol, backend interface, and implementation notes."\n` +
  `sidebar:\n` +
  `  order: 14\n` +
  `---\n\n` +
  content;

// 6. Append the link-adaptation log and Upstream comment
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
  `  - vc-spec.md (relative, same dir in source repo) → ../guides/authentication/verifiable-credentials.md\n` +
  `Other changes from source:\n` +
  `  - \`# The Internet Identity Specification\` H1 removed (Starlight renders frontmatter title as H1)\n` +
  `  - \`<CodeBlock language="candid">{IICandidInterface}</CodeBlock>\` replaced with download link to /references/internet-identity.did\n` +
  `-->\n` +
  `<!-- Upstream: sync from dfinity/internet-identity — docs/ii-spec.mdx, src/internet_identity/internet_identity.did -->\n`;

writeFileSync(TARGET, content);
console.log(`Written: ${TARGET}`);

// Copy the .did file to public/references/
copyFileSync(SOURCE_DID, TARGET_DID);
console.log(`Written: ${TARGET_DID}`);

// Warn about any remaining absolute docs links that weren't rewritten.
const remaining = [...content.matchAll(/https?:\/\/internetcomputer\.org\/docs[^\s\)">]*/g)]
  .map(m => m[0]);
const unique = [...new Set(remaining)];
if (unique.length) {
  console.warn('\nWARNING: Unhandled absolute links — add them to the linkMap:');
  unique.forEach(l => console.warn(`  ${l}`));
  process.exit(1);
} else {
  console.log('\nAll absolute links adapted. Run `npm run build` to verify.');
}
