// Heading ids as the site generates them.
//
// Starlight slugs the *rendered* heading text with github-slugger, so the
// heading is parsed to its text first and an explicit `{#id}` wins. Both steps
// use the libraries the site itself uses rather than an approximation of them:
// compared against the ids in a built site, every heading on all 200 pages
// agrees, in both directions.
//
// Shared by scripts/validate.js (every page, every PR) and
// scripts/sync-static-site.mjs (the synced tree, before it is written).

import fs from 'fs';
import GithubSlugger from 'github-slugger';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toString } from 'mdast-util-to-string';
import { HEADING_ID } from '../../plugins/remark-heading-id.mjs';

// The rendered text of a heading, which is what the site slugs: inline markdown
// resolved away, so `code`, **strong**, [links](x) and raw HTML contribute their
// text and nothing else. Parsed rather than pattern-matched, because inline
// markdown does not reduce to a set of regexes. Two cases that defeated one:
// `flexible_http_request` in a code span (an inner `_http_` read as emphasis,
// so both underscores vanished), and `_foo_bar_`, where CommonMark pairs the
// outer underscores and keeps the intraword one.
//
// Takes the whole line, `#` markers included. The text alone is not the same
// document: "1. Create a canister" parses as an ordered list and renders as
// "Create a canister", losing the number the site slugs into the id.
//
// One construct is out of reach: a footnote reference in a heading renders as
// the note's *number*, which is assigned while the document is rendered, so no
// parse of the heading alone can produce it. `## API[^note]` is `footnote-api1`
// on the site. Neither CommonMark nor GFM parsing yields that, so a link to
// such a heading would be reported as broken. No heading in docs/ does this.
function renderedText(line) {
  return toString(fromMarkdown(line), { includeHtml: false }).trim();
}

export function anchorsOfText(text) {
  const slugger = new GithubSlugger();
  const anchors = new Set();
  let inFence = false;
  for (const line of text.split('\n')) {
    if (/^\s*```/.test(line.trimStart())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^#{1,6}\s+(.*)$/.exec(line);
    if (!m) continue;
    // `{#id}` and `{$id}` both set an explicit id; the plugin accepts both.
    const explicit = HEADING_ID.exec(m[1]);
    anchors.add(explicit ? explicit[1] : slugger.slug(renderedText(line)));
  }
  return anchors;
}

// Cached: a hub page can link the same target many times.
const cache = new Map();

export function anchorsOfFile(file) {
  if (!cache.has(file)) cache.set(file, anchorsOfText(fs.readFileSync(file, 'utf8')));
  return cache.get(file);
}
