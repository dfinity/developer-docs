// Heading ids as the site generates them.
//
// Starlight slugs the *rendered* heading text with github-slugger, so inline
// markdown is stripped first and an explicit `{#id}` wins. Using the same
// library rather than an approximation is deliberate: compared over the 2995
// headings in docs/, a hand-rolled slug disagreed on 21 of them, all headings
// containing an arrow, an ampersand, or `/*`.
//
// Shared by scripts/validate.js (every page, every PR) and
// scripts/sync-static-site.mjs (the synced tree, before it is written).

import fs from 'fs';
import GithubSlugger from 'github-slugger';
import { HEADING_ID } from '../../plugins/remark-heading-id.mjs';

function renderedText(heading) {
  return heading
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
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
    anchors.add(explicit ? explicit[1] : slugger.slug(renderedText(m[1])));
  }
  return anchors;
}

// Cached: a hub page can link the same target many times.
const cache = new Map();

export function anchorsOfFile(file) {
  if (!cache.has(file)) cache.set(file, anchorsOfText(fs.readFileSync(file, 'utf8')));
  return cache.get(file);
}
