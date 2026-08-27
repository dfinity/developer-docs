#!/usr/bin/env node
/**
 * Check every upstream in `.sources/upstream.json` for a newer ref than the one
 * the docs are pinned to, and write an issue body for each that moved.
 *
 * Covers two groups. `watched` repos are compared against the ref recorded in
 * that file. `vendored` submodules are compared gitlink against branch head, so
 * git stays the single source of truth for their pin; an entry may narrow that
 * to the paths the docs actually depend on via `pathFilter`. `motoko` and
 * `internetidentity` are in neither group: their own sync workflows
 * release-check them and open the bump PR.
 *
 * A watched repo declares where its releases actually appear: `release` (git
 * tags matching a pattern), `crate` (crates.io) or `npm` (the npm registry) for
 * repos that publish without tagging, or `commit` for repos with no releases at
 * all.
 * See AGENTS.md "Source material" and .agents/upstream-tracking.md.
 *
 * Usage:
 *   node scripts/check-upstream-releases.mjs [--repo owner/name] [--out-dir DIR]
 *
 * Writes DIR/<slug>.md per repo that moved and prints one `slug<TAB>title`
 * line per issue to stdout, for the workflow to consume. Exit codes:
 *   0  nothing moved
 *   1  at least one repo moved (bodies written)
 *   2  a check failed (network, bad config)
 *
 * Needs `git` on PATH and network access. No GitHub token required: tags come
 * from `git ls-remote` and file diffs from raw.githubusercontent.com.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const CONFIG = join(ROOT, '.sources', 'upstream.json');

const args = process.argv.slice(2);
const only = argValue('--repo');
const outDir = argValue('--out-dir') ?? join(ROOT, '.upstream-checks');

function argValue(flag) {
  const i = args.indexOf(flag);
  return i === -1 ? undefined : args[i + 1];
}

/**
 * Compare two refs the way a human reads a version: numeric runs compare as
 * numbers, everything else as text. Needed because these repos tag in at least
 * four shapes (`v1.3.0`, `0.20.1`, `static-site-v0.3.3`, `2025-12-18`) and none
 * of them sort correctly as plain strings — lexicographically `0.9.4` beats
 * `0.20.1`, which would silently report a downgrade as the latest release.
 */
function compareRefs(a, b) {
  const split = (s) => s.split(/(\d+)/).filter((p) => p !== '');
  const pa = split(a);
  const pb = split(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i];
    const y = pb[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const nx = /^\d+$/.test(x);
    const ny = /^\d+$/.test(y);
    if (nx && ny) {
      const d = Number(x) - Number(y);
      if (d !== 0) return d;
    } else if (x !== y) {
      return x < y ? -1 : 1;
    }
  }
  return 0;
}

function git(...argv) {
  return execFileSync('git', argv, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
}

function remoteTags(repo) {
  const out = git('ls-remote', '--tags', `https://github.com/${repo}.git`);
  return out
    .split('\n')
    .map((l) => l.split('refs/tags/')[1])
    .filter((t) => t && !t.endsWith('^{}'));
}

function defaultBranchHead(repo) {
  // `ls-remote --symref HEAD` reports both the branch name and its sha, so the
  // default branch does not have to be hardcoded per repo.
  const out = git('ls-remote', '--symref', `https://github.com/${repo}.git`, 'HEAD');
  const branch = out.match(/^ref:\s+refs\/heads\/(\S+)\s+HEAD$/m)?.[1] ?? 'HEAD';
  const sha = out.match(/^([0-9a-f]{40})\s+HEAD$/m)?.[1];
  return { branch, sha };
}

/**
 * Language-to-directory map, mirroring LANG_TO_DIR in plugins/remark-snippet.mjs.
 * It is copied rather than imported because that plugin pulls in remark
 * dependencies and this script must run in the workflow, which installs none.
 * Keep the two in step; an unknown language here fails the check rather than
 * silently reporting fewer files than the docs actually quote.
 */
const LANG_TO_DIR = {
  rust: 'rust',
  rs: 'rust',
  motoko: 'motoko',
  mo: 'motoko',
  javascript: 'hosting',
  js: 'hosting',
  typescript: 'hosting',
  ts: 'hosting',
};

/**
 * Every file in the examples repo that a `snippet=` in docs/ quotes, as a
 * repo-relative path. The attribute is relative to `.sources/examples/<lang>/`,
 * where the directory comes from the fence's language, so both parts are needed
 * to reconstruct the path the compare API reports.
 */
function snippetPaths() {
  const out = new Set();
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.mdx?$/.test(entry)) {
        const text = readFileSync(full, 'utf8');
        for (const m of text.matchAll(/^```(\w+)[^\n]*\ssnippet="([^"#]+)/gm)) {
          const [, lang, path] = m;
          const dir = LANG_TO_DIR[lang];
          if (!dir) {
            throw new Error(
              `${relative(ROOT, full)}: snippet in an unmapped language "${lang}"; ` +
                `add it to LANG_TO_DIR here and in plugins/remark-snippet.mjs`
            );
          }
          out.add(`${dir}/${path}`);
        }
      }
    }
  };
  walk(join(ROOT, 'docs'));
  return out;
}

/**
 * Files changed between two refs, via the compare API. Returns null when the
 * answer cannot be trusted (request failed, or the response was truncated at
 * the API's 300-file cap), so callers report rather than assume nothing moved.
 */
async function changedFiles(repo, base, head) {
  const headers = { Accept: 'application/vnd.github+json' };
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com/repos/${repo}/compare/${base}...${head}`, { headers });
  if (!res.ok) return null;
  const body = await res.json();
  if (!Array.isArray(body.files)) return null;
  if (body.files.length >= 300) return null;
  return new Set(body.files.map((f) => f.filename));
}

function gitlinkSha(path) {
  // The committed submodule pointer, readable without initializing the
  // submodule, so this works on a bare checkout in CI.
  const out = git('ls-tree', 'HEAD', path);
  return out.match(/^\d+ commit ([0-9a-f]{40})\t/)?.[1];
}

function branchHead(repo, branch) {
  const out = git('ls-remote', `https://github.com/${repo}.git`, `refs/heads/${branch}`);
  return out.match(/^([0-9a-f]{40})/)?.[1];
}

async function cratesIoNewest(crate) {
  const res = await fetch(`https://crates.io/api/v1/crates/${crate}`, {
    headers: { 'User-Agent': 'dfinity-developer-docs upstream check' },
  });
  if (!res.ok) throw new Error(`crates.io returned ${res.status} for ${crate}`);
  const body = await res.json();
  // max_stable_version excludes prereleases, which is what the docs document.
  const v = body?.crate?.max_stable_version ?? body?.crate?.newest_version;
  if (!v) throw new Error(`crates.io gave no version for ${crate}`);
  const known = (body?.versions ?? []).map((x) => x.num);
  return { latest: v, known };
}

async function npmLatest(pkg) {
  const res = await fetch(`https://registry.npmjs.org/${pkg}`);
  if (!res.ok) throw new Error(`npm returned ${res.status} for ${pkg}`);
  const body = await res.json();
  const v = body?.['dist-tags']?.latest;
  if (!v) throw new Error(`npm gave no latest version for ${pkg}`);
  return { latest: v, known: Object.keys(body?.versions ?? {}) };
}

async function fetchFile(repo, ref, path) {
  const url = `https://raw.githubusercontent.com/${repo}/${ref}/${path}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.text();
}

/** Unified-diff-free summary: which headings and how many lines changed. */
function summarizeChange(oldText, newText) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  // Count occurrences, not set membership: an added line that already appears
  // elsewhere in the file is still an added line, and set membership would
  // silently drop it from the total.
  const tally = (lines) => {
    const m = new Map();
    for (const l of lines) m.set(l, (m.get(l) ?? 0) + 1);
    return m;
  };
  const oldCount = tally(oldLines);
  const newCount = tally(newLines);
  const surplus = (lines, mine, theirs) => {
    const budget = new Map(theirs);
    const out = [];
    for (const l of lines) {
      if (!l.trim()) continue;
      const left = budget.get(l) ?? 0;
      if (left > 0) budget.set(l, left - 1);
      else out.push(l);
    }
    return out;
  };
  const added = surplus(newLines, newCount, oldCount);
  const removed = surplus(oldLines, oldCount, newCount);
  const heading = (l) => /^#{1,6}\s/.test(l);
  return {
    addedHeadings: added.filter(heading),
    removedHeadings: removed.filter(heading),
    addedCount: added.length,
    removedCount: removed.length,
  };
}

function slugFor(entry) {
  // `name` lets one repo carry several independently released things (the
  // recipes repo tags per recipe), each with its own pin, issue and label.
  const base = entry.repo.replace('/', '-');
  return entry.name ? `${base}-${entry.name}` : base;
}

async function checkVendored(entry) {
  const { path, repo, branch, affects, pathFilter, reference } = entry;
  const pinnedSha = gitlinkSha(path);
  if (!pinnedSha) throw new Error(`${path}: not a submodule in this commit`);
  const headSha = branchHead(repo, branch);
  if (!headSha) throw new Error(`${repo}: no branch ${branch}`);
  if (pinnedSha === headSha) return null;

  // Short SHAs are for the table and the issue title; anything a machine
  // consumes (the compare link, the checkout command) gets the full SHA.
  let touched;
  if (pathFilter === 'snippets') {
    // A commit on an active examples repo is not news by itself. What matters
    // is whether it touched a file the docs quote: an improvement upstream
    // leaves our copy stale while the build stays green, since the build only
    // catches a path or region that stopped resolving.
    const wanted = snippetPaths();
    const changed = await changedFiles(repo, pinnedSha, headSha);
    if (changed) {
      touched = [...wanted].filter((f) => changed.has(f));
      if (touched.length === 0) return null;
    }
    // changed === null: the comparison could not be trusted, so fall through
    // and report rather than assume nothing moved.
  }

  const pinned = pinnedSha.slice(0, 7);
  const latest = headSha.slice(0, 7);
  const name = path.replace(/^\.sources\//, '');
  const body = [
    `The \`${path}\` submodule is behind \`${repo}@${branch}\`.`,
    '',
    '| | |',
    '|---|---|',
    `| Pinned (gitlink) | \`${pinned}\` |`,
    `| Branch head | \`${latest}\` |`,
    `| Compare | https://github.com/${repo}/compare/${pinnedSha}...${headSha} |`,
    ...(reference ? [`| Published reference | ${reference} |`] : []),
    '',
    '## What to re-check',
    '',
    touched?.length
      ? 'Files the docs quote that changed in this range:\n\n' +
          touched.map((f) => `- \`${f}\``).join('\n') +
          '\n\n' + (affects ?? '')
      : affects ?? 'No notes recorded for this submodule.',
    '',
    '## How to close this',
    '',
    '```bash',
    `git -C ${path} fetch origin ${branch}`,
    `git -C ${path} checkout ${headSha}`,
    '```',
    '',
    'Then work through the submodule checklist and commit the new pointer.',
    '',
    'Procedure: `.agents/upstream-tracking.md`',
  ].join('\n');

  return { slug: `submodule-${name}`, title: `chore: submodule ${name} is behind ${repo}@${branch}`, body };
}

async function checkOne(entry) {
  const { repo, pinned, track, tagPattern, verify, affects, reference } = entry;

  let latest;
  let kind;
  // A registry-tracked ref is a package version, not something git can resolve,
  // so those entries get a registry link instead of a compare view and no file
  // diff. `moved` is set by tracks whose refs are not version-ordered.
  let compare;
  let compareLabel = 'Compare';
  let moved;
  // Published versions, for registry tracks: a pin in the wrong shape
  // (`v0.20.1` for a crate that publishes `0.20.1`) compares as older for ever
  // and would report "current" silently, so it is rejected the same way a
  // non-existent tag is.
  let known;
  if (track === 'release') {
    if (!tagPattern) throw new Error(`${repo}: track "release" needs a tagPattern`);
    const re = new RegExp(tagPattern);
    const matching = remoteTags(repo).filter((t) => re.test(t));
    if (matching.length === 0) {
      throw new Error(`${repo}: no tags match ${tagPattern}`);
    }
    // A pin that is not one of the matched tags can never be overtaken by them,
    // so the repo would report "current" forever. Fail instead of going quiet.
    if (!matching.includes(pinned)) {
      throw new Error(
        `${repo}: pinned "${pinned}" is not a tag matching ${tagPattern} ` +
          `(newest matching tag is "${[...matching].sort(compareRefs).pop()}"). ` +
          `Fix the pin, the pattern, or switch this entry to another track.`
      );
    }
    matching.sort(compareRefs);
    latest = matching[matching.length - 1];
    kind = 'release';
  } else if (track === 'crate') {
    // Some repos publish releases to a package registry without tagging them,
    // so the package version is the release identity and tags lag behind it.
    if (!entry.crate) throw new Error(`${repo}: track "crate" needs a crate name`);
    ({ latest, known } = await cratesIoNewest(entry.crate));
    kind = `crates.io release of ${entry.crate}`;
    compare = `https://crates.io/crates/${entry.crate}`;
    compareLabel = 'Registry';
  } else if (track === 'npm') {
    if (!entry.package) throw new Error(`${repo}: track "npm" needs a package name`);
    ({ latest, known } = await npmLatest(entry.package));
    kind = `npm release of ${entry.package}`;
    compare = `https://www.npmjs.com/package/${entry.package}`;
    compareLabel = 'Registry';
  } else if (track === 'commit') {
    const { branch, sha } = defaultBranchHead(repo);
    if (!sha) throw new Error(`${repo}: could not resolve HEAD`);
    latest = sha.slice(0, 7);
    kind = `commit on ${branch}`;
    // Commit SHAs have no order, so "newer" cannot be a comparison: the pin is
    // a prefix of the head or it is not. Ordering them would silently report a
    // real update as current whenever the new SHA happened to sort lower.
    moved = !sha.startsWith(pinned);
    // The head side uses the full SHA. The pin side is whatever `upstream.json`
    // records, kept short there for readability; GitHub's compare view resolves
    // a short prefix on either side.
    compare = `https://github.com/${repo}/compare/${pinned}...${sha}`;
  } else {
    throw new Error(`${repo}: unknown track "${track}"`);
  }

  if (known && !known.includes(pinned)) {
    throw new Error(
      `${repo}: pinned "${pinned}" is not a published version ` +
        `(latest is "${latest}"). Fix the pin to match the registry's format.`
    );
  }

  if (!(moved ?? compareRefs(latest, pinned) > 0)) return null;

  const title = entry.name
    ? `chore: upstream ${repo} (${entry.name}) moved to ${latest}`
    : `chore: upstream ${repo} moved to ${latest}`;
  const lines = [
    `\`${repo}\` has moved past the ref the docs are verified against.`,
    '',
    `| | |`,
    `|---|---|`,
    `| Pinned in \`.sources/upstream.json\` | \`${pinned}\` |`,
    `| Latest ${kind} | \`${latest}\` |`,
    `| ${compareLabel} | ${compare ?? `https://github.com/${repo}/compare/${pinned}...${latest}`} |`,
  ];
  if (reference) lines.push(`| Published reference | ${reference} |`);
  lines.push('');
  lines.push('## What to re-check');
  lines.push('');
  lines.push(affects ?? 'No notes recorded for this repo.');

  if (verify && compareLabel !== 'Registry') {
    const [oldText, newText] = await Promise.all([
      fetchFile(repo, pinned, verify),
      fetchFile(repo, latest, verify),
    ]);
    lines.push('');
    lines.push(`## \`${verify}\``);
    lines.push('');
    if (!oldText || !newText) {
      lines.push(`Could not fetch \`${verify}\` at both refs, so no diff summary. Compare manually:`);
      lines.push('');
      lines.push('```bash');
      lines.push(`diff <(curl -sL https://raw.githubusercontent.com/${repo}/${pinned}/${verify}) \\`);
      lines.push(`     <(curl -sL https://raw.githubusercontent.com/${repo}/${latest}/${verify})`);
      lines.push('```');
    } else if (oldText === newText) {
      lines.push('Unchanged between the two refs.');
    } else {
      const s = summarizeChange(oldText, newText);
      lines.push(`${s.addedCount} line(s) added, ${s.removedCount} removed.`);
      if (s.addedHeadings.length) {
        lines.push('');
        lines.push('New sections:');
        lines.push('');
        for (const h of s.addedHeadings) lines.push(`- \`${h.trim()}\``);
      }
      if (s.removedHeadings.length) {
        lines.push('');
        lines.push('Removed sections:');
        lines.push('');
        for (const h of s.removedHeadings) lines.push(`- \`${h.trim()}\``);
      }
      lines.push('');
      lines.push('Full diff:');
      lines.push('');
      lines.push('```bash');
      lines.push(`diff <(curl -sL https://raw.githubusercontent.com/${repo}/${pinned}/${verify}) \\`);
      lines.push(`     <(curl -sL https://raw.githubusercontent.com/${repo}/${latest}/${verify})`);
      lines.push('```');
    }
  }

  lines.push('');
  lines.push('## How to close this');
  lines.push('');
  lines.push(`1. Review the changes above against the pages named under "What to re-check".`);
  lines.push(`2. Update those pages if anything they state has changed.`);
  lines.push(`3. Set \`pinned\` to \`${latest}\` in \`.sources/upstream.json\` in the same PR.`);
  lines.push('');
  lines.push('If nothing in the docs is affected, bump the pin on its own and say so in the PR.');
  lines.push('');
  lines.push('Procedure: `.agents/upstream-tracking.md`');

  return { slug: slugFor(entry), title, body: lines.join('\n') };
}

const config = JSON.parse(readFileSync(CONFIG, 'utf8'));
const vendored = (config.vendored ?? []).filter((e) => !only || e.repo === only);
const watched = (config.watched ?? []).filter((e) => !only || e.repo === only);
if (only && vendored.length + watched.length === 0) {
  console.error(`No entry for --repo ${only} in ${CONFIG}`);
  process.exit(2);
}

const results = [];
let failed = false;

for (const entry of vendored) {
  try {
    const r = await checkVendored(entry);
    if (r) {
      results.push(r);
      console.error(`behind:   ${entry.path} -> ${entry.repo}@${entry.branch}`);
    } else {
      console.error(`current:  ${entry.path}`);
    }
  } catch (e) {
    failed = true;
    console.error(`FAILED:   ${entry.path}: ${e.message}`);
  }
}

for (const entry of watched) {
  try {
    const r = await checkOne(entry);
    if (r) {
      results.push(r);
      console.error(`moved:    ${entry.repo} ${entry.pinned} -> ${r.title.split(' ').pop()}`);
    } else {
      console.error(`current:  ${entry.repo} ${entry.pinned}`);
    }
  } catch (e) {
    failed = true;
    console.error(`FAILED:   ${entry.repo}: ${e.message}`);
  }
}

if (results.length > 0) {
  mkdirSync(outDir, { recursive: true });
  for (const r of results) {
    writeFileSync(join(outDir, `${r.slug}.md`), r.body + '\n');
    process.stdout.write(`${r.slug}\t${r.title}\n`);
  }
}

if (failed) process.exit(2);
process.exit(results.length > 0 ? 1 : 0);
