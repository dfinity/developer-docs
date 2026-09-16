#!/usr/bin/env node
// Syncs the user documentation of dfinity/certified-assets (the canister the
// `@dfinity/static-site` recipe deploys) into docs/guides/frontends/static-site/.
//
// That repo is the single source of truth for how the canister behaves. Its
// docs/ pages carry Starlight frontmatter and page order upstream, so this
// script copies rather than authors: no headings are added, no prose rewritten.
//
// Unlike the motoko and internet-identity syncs, nothing here is a submodule.
// The build resolves no file from certified-assets, only markdown links, so the
// pin is a ref recorded in .sources/upstream.json and the pages are fetched at
// that ref. Read content through raw.githubusercontent.com, never the contents
// API, which returns base64 that gets truncated for larger files.
//
// Transformations:
//   - Rewrite absolute links to this docs site into relative .md links (LINK_MAP)
//   - Record provenance as source_repo / source_ref in the frontmatter
//   - Normalize what the brand rules lock: em dash (U+2014), en dash (U+2013)
//     as a prose separator, and "tamperproof" as one word. Prose only, never
//     inside a fence. These are near no-ops today (upstream dropped its em
//     dashes in certified-assets#125) and exist so a future page cannot
//     reintroduce them silently.
//   - Append a do-not-edit marker
//
// Validation (exits non-zero on failure, so a bad sync never lands quietly):
//   - Frontmatter must carry title, description and sidebar.order. This is the
//     contract agreed in certified-assets#124; without it the Starlight build
//     fails or the page sorts arbitrarily.
//   - No absolute link to this docs site may survive the rewrite. A miss means
//     upstream linked a page LINK_MAP does not know about yet.
//   - Every relative .md link must resolve on disk, including the ones pointing
//     out of the synced tree.
//   - No banned character may survive normalization.
//
// Usage: node scripts/sync-static-site.mjs [--ref <git-ref>]
//   or:  npm run sync:static-site
//
// --ref overrides the pin for a local trial run. The workflow writes the new
// pin into .sources/upstream.json first, then runs the script with no argument,
// so what lands is always what the file records.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { anchorsOfText, anchorsOfFile } from './lib/anchors.mjs';

const UPSTREAM_JSON = '.sources/upstream.json';
const REPO = 'dfinity/certified-assets';
const SOURCE_DIR = 'docs';
const TARGET_DIR = 'docs/guides/frontends/static-site';

// Absolute links to this site, canonicalized to `path` or `path#fragment`,
// mapped to a link relative to TARGET_DIR. Upstream writes these as absolute
// URLs because its docs/ is also read on GitHub, where a relative link into
// this repo would not resolve. Page-level rather than section-level on purpose:
// each of these links points at a whole procedure or specification, which is
// what the sentence around it promises the reader.
const LINK_MAP = {
  'guides/frontends/custom-domains': '../custom-domains.md',
  'guides/canister-calls/calling-from-clients': '../../canister-calls/calling-from-clients.md',
  'references/http-gateway-protocol-spec': '../../../references/http-gateway-protocol-spec.md',
};

// Matches an absolute link to this docs site in either form: the current
// docs.internetcomputer.org subdomain, or the retired internetcomputer.org/docs
// path. Does not match bare internetcomputer.org, which upstream links
// legitimately for the project home page.
const SITE_LINK = /https?:\/\/(?:docs\.)?internetcomputer\.org(?:\/docs)?\/[^\s)">]+/g;

function canonicalize(url) {
  return url
    .replace(/^https?:\/\/(?:docs\.)?internetcomputer\.org(?:\/docs)?\//, '')
    .replace(/\/(#|$)/, '$1');
}

// Brand rules of record: https://jgwns-tqaaa-aaaao-ba5ua-cai.icp0.io/rules.json
// (banned_characters, one_word_spellings). Prose only: a fence can hold a
// hyphenated identifier or a range that is none of our business.
const PROSE_RULES = [
  { re: /\s*—\s*/g, to: ': ', what: 'em dash' },
  { re: /\s–\s/g, to: ', ', what: 'en dash as separator' },
  { re: /tamper[- ]proof/gi, to: 'tamperproof', what: 'hyphenated tamperproof' },
];

// `dfx` is banned in this repo (AGENTS.md "Never"), and a command reaches a
// reader from inside a fence, where the prose rules deliberately do not go. Only
// this exact shape is rewritten, verified equivalent against `icp canister call`
// in icp-cli v1.5.0: <CANISTER> accepts a principal, and `-e` selects the
// network. Any other `dfx` occurrence fails the sync rather than being guessed at.
const DFX_CALL = /\bdfx canister call (\S+) (\S+)(?: --network ic)?/g;
const rewriteDfx = (text) => text.replace(DFX_CALL, 'icp canister call $1 $2 -e ic');

// Prose means prose: not a fenced block, not the frontmatter, and within a line,
// not an inline code span and not a link destination. A rule that reached into
// those could silently break an identifier or a URL containing the pattern.
function mapProse(text, fn) {
  const cut = text.startsWith('---\n') ? text.indexOf('\n---', 4) + 4 : 0;
  let inFence = false;
  const body = text
    .slice(cut)
    .split('\n')
    .map((line) => {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      // Odd-indexed parts are the protected regions, so only the rest is passed
      // to fn.
      return line
        .split(/(`[^`]*`|\]\([^)]*\))/g)
        .map((part, i) => (i % 2 === 1 ? part : fn(part)))
        .join('');
    })
    .join('\n');
  return text.slice(0, cut) + body;
}

function normalizeProse(text) {
  const applied = [];
  const out = mapProse(text, (line) => {
    let l = line;
    for (const { re, to, what } of PROSE_RULES) {
      if (re.test(l)) {
        applied.push(what);
        l = l.replace(re, to);
      }
    }
    return l;
  });
  return { out, applied: [...new Set(applied)] };
}

function rewriteSiteLinks(text) {
  const unmapped = [];
  const out = text.replace(SITE_LINK, (url) => {
    const target = LINK_MAP[canonicalize(url)];
    if (!target) {
      unmapped.push(url);
      return url;
    }
    return target;
  });
  return { out, unmapped };
}

// Insert provenance into the existing frontmatter block rather than rewriting
// it, so upstream keeps ownership of title, description and order.
function stampProvenance(text, file, ref) {
  const end = text.indexOf('\n---', 4);
  const head = text.slice(0, end);
  return (
    `${head}\n` +
    `source_repo: "${REPO}"\n` +
    `source_ref: "${ref}"\n` +
    text.slice(end + 1)
  );
}

function marker(file, ref) {
  return (
    `\n<!-- Generated by scripts/sync-static-site.mjs from ${REPO} ` +
    `${SOURCE_DIR}/${file} at ${ref}. Do not edit directly: the next sync ` +
    `overwrites it. Content changes belong upstream. -->\n`
  );
}

// Every link must resolve, in the synced tree and out of it, and a link to a
// section has to land on one: upstream renames headings freely, and a renamed
// heading would otherwise drop readers at the top of a long page with a clean
// build. Sibling targets are resolved against `prepared`, the pages about to be
// written, so this runs before anything touches the tree.
function brokenLinks(text, file, prepared) {
  const broken = [];
  const anchorsIn = (href) => {
    if (href.startsWith('#')) return anchorsOfText(text);
    const [linkPath] = href.split('#');
    const sibling = prepared.get(path.basename(linkPath));
    if (sibling && path.resolve(TARGET_DIR, linkPath) === path.join(path.resolve(TARGET_DIR), path.basename(linkPath))) {
      return anchorsOfText(sibling);
    }
    const resolved = path.resolve(TARGET_DIR, linkPath);
    const target = existsSync(resolved)
      ? resolved
      : existsSync(resolved.replace(/\.md$/, '.mdx'))
        ? resolved.replace(/\.md$/, '.mdx')
        : null;
    return target ? anchorsOfFile(target) : null;
  };

  for (const [, href] of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    if (/^(https?:|\/)/.test(href)) continue;
    const [linkPath, fragment] = href.split('#');
    if (linkPath && !linkPath.endsWith('.md')) continue;
    const anchors = anchorsIn(href);
    if (!anchors) {
      broken.push(`${href} (no such page)`);
      continue;
    }
    if (fragment && !anchors.has(fragment)) {
      broken.push(`${href} (no heading slugs to "${fragment}")`);
    }
  }
  return broken;
}

function parseFrontmatter(text, file) {
  if (!text.startsWith('---\n')) {
    throw new Error(`${file}: no frontmatter. See ${REPO}#124 for the contract.`);
  }
  const end = text.indexOf('\n---', 4);
  if (end === -1) throw new Error(`${file}: unterminated frontmatter`);
  const block = text.slice(4, end);
  const missing = [];
  if (!/^title:/m.test(block)) missing.push('title');
  if (!/^description:/m.test(block)) missing.push('description');
  if (!/^\s+order:/m.test(block)) missing.push('sidebar.order');
  if (missing.length) {
    throw new Error(
      `${file}: frontmatter is missing ${missing.join(', ')}. ` +
        `See ${REPO}#124 for the contract.`
    );
  }
}

async function get(url, accept) {
  const headers = { accept };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res;
}

// List the pages upstream has at this ref, rather than hardcoding the eight
// that exist today: a page added upstream should reach readers through the
// sync PR, not wait for someone to notice it.
async function sourcePages(ref) {
  const res = await get(
    `https://api.github.com/repos/${REPO}/contents/${SOURCE_DIR}?ref=${ref}`,
    'application/vnd.github+json'
  );
  const pages = (await res.json())
    .filter((e) => e.type === 'file' && e.name.endsWith('.md'))
    .map((e) => e.name)
    .sort();
  if (pages.length === 0) throw new Error(`${REPO}: no markdown pages in ${SOURCE_DIR}/ at ${ref}`);
  return pages;
}

async function fetchPage(ref, file) {
  const res = await get(
    `https://raw.githubusercontent.com/${REPO}/${ref}/${SOURCE_DIR}/${file}`,
    'text/plain'
  );
  return res.text();
}

function pin() {
  const config = JSON.parse(readFileSync(UPSTREAM_JSON, 'utf8'));
  const entry = (config.synced ?? []).find((e) => e.repo === REPO);
  if (!entry?.pinned) {
    throw new Error(`${UPSTREAM_JSON}: no synced entry with a pin for ${REPO}`);
  }
  return entry.pinned;
}
async function main() {
  const refArg = process.argv.indexOf('--ref');
  const ref = refArg === -1 ? pin() : process.argv[refArg + 1];
  if (!ref) {
    console.error('Usage: node scripts/sync-static-site.mjs [--ref <git-ref>]');
    process.exit(1);
  }

  console.log(`Syncing ${REPO} ${SOURCE_DIR}/ at ${ref}`);

  const pages = await sourcePages(ref);
  const written = [];
  const normalized = [];

  mkdirSync(TARGET_DIR, { recursive: true });

  // Transform every page before writing any of them. A page that violates the
  // contract then leaves the tree exactly as it was, rather than a mix of two
  // refs that still builds and still validates.
  const prepared = new Map();

  for (const file of pages) {
    const source = await fetchPage(ref, file);
    parseFrontmatter(source, file);

    const { out: linked, unmapped } = rewriteSiteLinks(source);
    if (unmapped.length) {
      throw new Error(
        `${file} links to this site with no LINK_MAP entry:\n` +
          unmapped.map((u) => `  ${u}`).join('\n') +
          `\nAdd the canonical path to LINK_MAP in scripts/sync-static-site.mjs.`
      );
    }

    const deDfxed = rewriteDfx(linked);
    const { out: clean, applied } = normalizeProse(deDfxed);
    if (deDfxed !== linked) applied.push('dfx command rewritten to icp');
    if (applied.length) normalized.push(`${file}: ${applied.join(', ')}`);

    prepared.set(file, stampProvenance(clean, file, ref) + marker(file, ref));
  }

  // Check everything while it is still only in memory, so a failure leaves the
  // tree exactly as it was rather than half-written.
  const problems = [];
  for (const [file, content] of prepared) {
    for (const href of brokenLinks(content, file, prepared)) {
      problems.push(`${file}: broken link ${href}`);
    }
    if (/—|\s–\s/.test(content)) {
      problems.push(`${file}: a banned character survived normalization`);
    }
    if (/\bdfx\b/.test(content)) {
      problems.push(
        `${file}: publishes a \`dfx\` command this script does not know how to ` +
          `rewrite. dfx is banned here (AGENTS.md "Never"), so fix it upstream, ` +
          `or extend DFX_CALL if the shape is safe to translate.`
      );
    }
  }
  if (problems.length) {
    throw new Error(
      `${problems.length} problem(s) found, nothing written:\n` +
        problems.map((p) => `  ${p}`).join('\n')
    );
  }

  for (const [file, content] of prepared) {
    writeFileSync(path.join(TARGET_DIR, file), content);
    written.push(file);
  }

  // A page removed upstream has to disappear here too, or the sidebar keeps
  // serving something nobody maintains any more.
  const stale = readdirSync(TARGET_DIR).filter((f) => f.endsWith('.md') && !pages.includes(f));
  for (const file of stale) rmSync(path.join(TARGET_DIR, file));

  console.log(`\nWrote ${written.length} page(s) to ${TARGET_DIR}/:`);
  for (const file of written) console.log(`  ${file}`);
  if (stale.length) console.log(`Removed ${stale.length} page(s) gone upstream: ${stale.join(', ')}`);
  if (normalized.length) {
    console.log('\nNormalized (report upstream so these become no-ops):');
    for (const line of normalized) console.log(`  ${line}`);
  }
}

// Every failure path is a contract violation with something specific to fix, so
// report it as one line rather than a stack trace, and exit non-zero so the
// sync workflow opens no PR.
try {
  await main();
} catch (err) {
  console.error(`\nERROR: ${err.message}\n`);
  process.exit(1);
}
