#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';
import matter from 'gray-matter';
import GithubSlugger from 'github-slugger';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DOCS_ROOT = path.join(ROOT, 'docs');

const SYNCED = [
  path.join(DOCS_ROOT, 'languages', 'motoko'),
];

function isSynced(file) {
  return SYNCED.some(s => file === s || file.startsWith(s + path.sep));
}

function isStub(content) {
  return content.includes('TODO: Write content');
}

function checkFrontmatter(file, content) {
  if (isSynced(file)) return [];
  try {
    const { data } = matter(content);
    const errors = [];
    if (!data.title) errors.push('missing frontmatter: title');
    if (!data.description) errors.push('missing frontmatter: description');
    return errors;
  } catch (e) {
    return [`invalid frontmatter: ${e.message}`];
  }
}

// `checkForbiddenPatterns` skips fenced code, so these patterns only ever see
// prose. `mo:base` is the exception: what must never appear is an *import*
// (`mo:base/Buffer`), which lives inside a fence, while naming the legacy
// library in prose is legitimate (base-to-core migration tables do it). It
// therefore matches the import path and is checked inside fences too.
const FORBIDDEN = [
  { re: /mo:base\//, msg: '"mo:base/" import is banned — use "mo:core" instead', includeFences: true },
  { re: /https?:\/\/(?:www\.)?internetcomputer\.org\/docs/, msg: 'internetcomputer.org/docs is retired — link internally or inline' },
  { re: /docs\.internetcomputer\.org/, msg: 'docs.internetcomputer.org is this site — use relative paths for internal links' },
];

function checkEmdash(file, content) {
  if (isSynced(file) || isStub(content)) return [];
  const errors = [];
  const lines = content.split('\n');
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line.trimStart())) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (/^\s*<!--/.test(line)) continue;
    if (line.includes('—')) {
      errors.push(`line ${i + 1}: em-dash (—) in prose — use a colon, semicolon, comma, or parentheses`);
    }
    if (/ -- /.test(line)) {
      errors.push(`line ${i + 1}: " -- " used as em-dash substitute — use a colon, semicolon, comma, or parentheses`);
    }
  }
  return errors;
}

function checkForbiddenPatterns(file, content) {
  if (isSynced(file)) return [];
  const errors = [];
  const lines = content.split('\n');
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line.trimStart())) { inFence = !inFence; continue; }
    for (const { re, msg, includeFences } of FORBIDDEN) {
      if (inFence && !includeFences) continue;
      if (re.test(line)) errors.push(`line ${i + 1}: ${msg}`);
    }
  }
  return errors;
}

// Heading ids as the site generates them: Starlight slugs the *rendered* text,
// so inline markdown is stripped first, and an explicit `{#id}` wins. Cached
// because a hub page can link the same target many times.
const anchorCache = new Map();

function renderedText(heading) {
  return heading
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function anchorsOf(file) {
  if (anchorCache.has(file)) return anchorCache.get(file);
  const slugger = new GithubSlugger();
  const anchors = new Set();
  let inFence = false;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (/^\s*```/.test(line.trimStart())) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = /^#{1,6}\s+(.*)$/.exec(line);
    if (!m) continue;
    const explicit = /\{#([^}]+)\}\s*$/.exec(m[1]);
    anchors.add(explicit ? explicit[1] : slugger.slug(renderedText(m[1])));
  }
  anchorCache.set(file, anchors);
  return anchors;
}

function checkInternalLinks(file, content) {
  if (isSynced(file)) return [];
  const errors = [];
  const dir = path.dirname(file);
  const re = /\[[^\]]*\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const href = m[1];
    if (href.startsWith('http') || href.startsWith('#') || href.startsWith('/')) continue;
    const [linkPath, fragment] = href.split('#');
    if (!linkPath?.endsWith('.md')) continue;
    const resolved = path.resolve(dir, linkPath);
    const resolvedMdx = resolved.replace(/\.md$/, '.mdx');
    const target = fs.existsSync(resolved)
      ? resolved
      : fs.existsSync(resolvedMdx)
        ? resolvedMdx
        : null;
    if (!target) {
      errors.push(`broken link: ${href}`);
      continue;
    }
    // A link to a section has to land on one. A renamed heading upstream, or on
    // a page someone else edited, otherwise drops the reader at the top of a
    // long page with no sign that anything went wrong.
    if (fragment && !anchorsOf(target).has(fragment)) {
      errors.push(`broken anchor: ${href} (no heading in ${path.relative(ROOT, target)} slugs to "${fragment}")`);
    }
  }
  return errors;
}

function validate(file) {
  const content = fs.readFileSync(file, 'utf8');
  return [
    ...checkFrontmatter(file, content),
    ...checkForbiddenPatterns(file, content),
    ...checkEmdash(file, content),
    ...checkInternalLinks(file, content),
  ];
}

const args = process.argv.slice(2);
const useAll = args.includes('--all');
const fileArgs = args.filter(a => !a.startsWith('--'));

let files;
if (useAll) {
  files = globSync('docs/**/*.{md,mdx}', { cwd: ROOT, absolute: true });
} else if (fileArgs.length > 0) {
  files = fileArgs.map(f => path.isAbsolute(f) ? f : path.resolve(ROOT, f));
} else {
  console.error('Usage: node scripts/validate.js --all | <file> [<file>...]');
  process.exit(1);
}

let total = 0;
for (const file of files) {
  const errors = validate(file);
  if (errors.length) {
    const rel = path.relative(ROOT, file);
    errors.forEach(e => console.error(`${rel}: ${e}`));
    total += errors.length;
  }
}

if (total > 0) {
  console.error(`\n${total} error(s) found across ${files.length} file(s).`);
  process.exit(1);
} else {
  console.log(`Validated ${files.length} file(s) — all checks passed.`);
}
