#!/usr/bin/env node
/* Validate the bilingual authoring contract (see CLAUDE.md).
   Uses the SAME markdown lexer (vendored marked) and the SAME sentence
   segmenter (assets/js/segment.js) as the site renderer, so what passes here
   is what renders correctly.

   Errors  (exit 1): broken index, missing files, block-count mismatches.
   Warnings (exit 0): sentence-count mismatches (renderer falls back to
   block-level highlighting), image src differences.
*/

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { countSentences } from '../assets/js/segment.js';

const require = createRequire(import.meta.url);
const { marked } = require('../assets/js/marked.min.js');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const postsDir = join(root, 'posts');

let errors = 0;
let warnings = 0;
const err = (msg) => { errors++; console.error(`  ERROR   ${msg}`); };
const warn = (msg) => { warnings++; console.warn(`  warning ${msg}`); };

/* ---------------------------------------------------------- index.json */

console.log('checking posts/index.json');
const index = JSON.parse(readFileSync(join(postsDir, 'index.json'), 'utf8'));
const slugRe = /^(\d{4}-\d{2}-\d{2})-[a-z0-9][a-z0-9-]*$/;
const seen = new Set();

for (const p of index.posts) {
  for (const field of ['slug', 'date', 'title_zh', 'title_en']) {
    if (!p[field]) err(`${p.slug || '(?)'} — missing "${field}"`);
  }
  const m = slugRe.exec(p.slug || '');
  if (!m) err(`${p.slug} — slug must look like YYYY-MM-DD-kebab-slug`);
  else if (m[1] !== p.date) err(`${p.slug} — date ${p.date} does not match slug prefix`);
  if (seen.has(p.slug)) err(`${p.slug} — duplicate slug`);
  seen.add(p.slug);
  if (!existsSync(join(postsDir, p.slug))) err(`${p.slug} — directory missing`);
}

for (const d of readdirSync(postsDir)) {
  const full = join(postsDir, d);
  if (statSync(full).isDirectory() && !seen.has(d)) {
    err(`posts/${d}/ exists but is not listed in index.json`);
  }
}

/* ------------------------------------------------------- per-post checks */

// Approximate what the renderer "sees" as hoverable text: drop link targets,
// image syntax, inline-code contents and emphasis markers from a block's raw.
function visibleText(raw) {
  return raw
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')   // images
    .replace(/\]\([^)]*\)/g, ']')           // link urls
    .replace(/`[^`]*`/g, 'code')            // inline code
    .replace(/[*_>#-]/g, ' ');              // markers
}

const blocks = (md) => marked.lexer(md).filter((t) => t.type !== 'space');
const isImg = (t) =>
  t.type === 'paragraph' && /^!\[[^\]]*\]\([^)]+\)$/.test(t.raw.trim());
const imgSrc = (t) => /\(([^)\s]+)/.exec(t.raw.trim())?.[1];

for (const p of index.posts) {
  const dir = join(postsDir, p.slug);
  if (!existsSync(dir)) continue;
  console.log(`checking posts/${p.slug}`);

  const sides = {};
  for (const lang of ['zh', 'en']) {
    const f = join(dir, `${lang}.md`);
    if (!existsSync(f)) { err(`${p.slug}/${lang}.md missing`); continue; }
    sides[lang] = blocks(readFileSync(f, 'utf8'));
  }
  if (!sides.zh || !sides.en) continue;

  if (sides.zh.length !== sides.en.length) {
    err(`${p.slug} — block count differs: zh has ${sides.zh.length}, en has ${sides.en.length}. ` +
        `Each top-level Markdown block (paragraph, heading, list, image, code fence…) must pair 1:1.`);
    continue;
  }

  sides.zh.forEach((z, i) => {
    const e = sides.en[i];
    if (isImg(z) !== isImg(e)) {
      err(`${p.slug} block ${i + 1} — image on one side only (images must sit at the same position)`);
      return;
    }
    if (isImg(z)) {
      if (imgSrc(z) !== imgSrc(e)) {
        warn(`${p.slug} block ${i + 1} — image src differs (${imgSrc(z)} vs ${imgSrc(e)})`);
      }
      return;
    }
    if (z.raw.trim() === e.raw.trim()) return; // shared verbatim block
    if (z.type !== e.type) {
      warn(`${p.slug} block ${i + 1} — type differs (zh: ${z.type}, en: ${e.type})`);
    }
    if (['code', 'table', 'hr'].includes(z.type)) return;
    const nz = countSentences(visibleText(z.raw));
    const ne = countSentences(visibleText(e.raw));
    if (nz !== ne) {
      warn(`${p.slug} block ${i + 1} (${z.type}) — sentence count differs: zh ${nz} vs en ${ne} ` +
           `(hover falls back to whole-block highlight here)`);
    }
  });
}

/* ----------------------------------------------------------------- done */

console.log(`\n${errors} error(s), ${warnings} warning(s)`);
if (errors > 0) process.exit(1);
