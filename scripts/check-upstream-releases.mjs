#!/usr/bin/env node
/**
 * Check every upstream in `.sources/upstream.json` for a newer ref than the one
 * the docs are pinned to, and write an issue body for each that moved.
 *
 * Covers both groups in that file: `vendored` submodules whose pin has no sync
 * workflow of its own (their pin is read from the gitlink, so git stays the
 * single source of truth), and `watched` repos that are not vendored at all.
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
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
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
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);
  const added = newLines.filter((l) => l.trim() && !oldSet.has(l));
  const removed = oldLines.filter((l) => l.trim() && !newSet.has(l));
  const heading = (l) => /^#{1,6}\s/.test(l);
  return {
    addedHeadings: added.filter(heading),
    removedHeadings: removed.filter(heading),
    addedCount: added.length,
    removedCount: removed.length,
  };
}

function slugFor(repo) {
  return repo.replace('/', '-');
}

function checkVendored(entry) {
  const { path, repo, branch, affects } = entry;
  const pinnedSha = gitlinkSha(path);
  if (!pinnedSha) throw new Error(`${path}: not a submodule in this commit`);
  const headSha = branchHead(repo, branch);
  if (!headSha) throw new Error(`${repo}: no branch ${branch}`);
  if (pinnedSha === headSha) return null;

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
    `| Compare | https://github.com/${repo}/compare/${pinned}...${latest} |`,
    '',
    '## What to re-check',
    '',
    affects ?? 'No notes recorded for this submodule.',
    '',
    '## How to close this',
    '',
    '```bash',
    `git -C ${path} fetch origin ${branch}`,
    `git -C ${path} checkout ${latest}`,
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
  if (track === 'release') {
    if (!tagPattern) throw new Error(`${repo}: track "release" needs a tagPattern`);
    const re = new RegExp(tagPattern);
    const matching = remoteTags(repo).filter((t) => re.test(t));
    if (matching.length === 0) {
      throw new Error(`${repo}: no tags match ${tagPattern}`);
    }
    matching.sort(compareRefs);
    latest = matching[matching.length - 1];
    kind = 'release';
  } else if (track === 'commit') {
    const { branch, sha } = defaultBranchHead(repo);
    if (!sha) throw new Error(`${repo}: could not resolve HEAD`);
    latest = sha.slice(0, 7);
    kind = `commit on ${branch}`;
  } else {
    throw new Error(`${repo}: unknown track "${track}"`);
  }

  if (compareRefs(latest, pinned) <= 0) return null;

  const title = `chore: upstream ${repo} moved to ${latest}`;
  const lines = [
    `\`${repo}\` has moved past the ref the docs are verified against.`,
    '',
    `| | |`,
    `|---|---|`,
    `| Pinned in \`.sources/upstream.json\` | \`${pinned}\` |`,
    `| Latest ${kind} | \`${latest}\` |`,
    `| Compare | https://github.com/${repo}/compare/${pinned}...${latest} |`,
  ];
  if (reference) lines.push(`| Published reference | ${reference} |`);
  lines.push('');
  lines.push('## What to re-check');
  lines.push('');
  lines.push(affects ?? 'No notes recorded for this repo.');

  if (verify) {
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

  return { slug: slugFor(repo), title, body: lines.join('\n') };
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
    const r = checkVendored(entry);
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
