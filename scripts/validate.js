#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';
import matter from 'gray-matter';

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

function checkUpstream(file, content) {
  if (isSynced(file) || isStub(content) || path.basename(file) === 'index.md') return [];
  if (!/<!--\s*Upstream:\s*(hand-written|sync from|informed by)/.test(content)) {
    return ['missing <!-- Upstream: hand-written|sync from|informed by --> comment'];
  }
  return [];
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

const FORBIDDEN = [
  { re: /mo:base/, msg: '"mo:base" is banned — use "mo:core" instead' },
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
    if (inFence) continue;
    for (const { re, msg } of FORBIDDEN) {
      if (re.test(line)) errors.push(`line ${i + 1}: ${msg}`);
    }
  }
  return errors;
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
    const [linkPath] = href.split('#');
    if (!linkPath?.endsWith('.md')) continue;
    const resolved = path.resolve(dir, linkPath);
    const resolvedMdx = resolved.replace(/\.md$/, '.mdx');
    if (!fs.existsSync(resolved) && !fs.existsSync(resolvedMdx)) {
      errors.push(`broken link: ${href}`);
    }
  }
  return errors;
}

function validate(file) {
  const content = fs.readFileSync(file, 'utf8');
  return [
    ...checkUpstream(file, content),
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
