/* Z00 Studio Blog — bilingual two-column renderer.
   Chinese original on the left, Claude's English translation on the right,
   paired block-by-block and highlighted sentence-by-sentence. Always
   bilingual, always the light theme; only the wheel and the content scroll.
   See CLAUDE.md for the authoring contract this renderer assumes. */

import { splitPieces } from './segment.js';

const $ = (sel) => document.querySelector(sel);
const grid = () => $('#post-grid');
const content = () => $('#content');

const state = { posts: [], current: -1 };

/* ------------------------------------------------------------------ boot */

async function boot() {
  initFooterZoo();
  scheduleOwl();
  initProgressBar();
  grid().addEventListener('mouseover', onSentence(true));
  grid().addEventListener('mouseout', onSentence(false));

  try {
    const res = await fetch('posts/index.json');
    if (!res.ok) throw new Error(`posts/index.json → HTTP ${res.status}`);
    const idx = await res.json();
    state.posts = idx.posts
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug));
  } catch (err) {
    return showError(`COULD NOT LOAD POST INDEX — ${err.message}`);
  }

  buildWheel();
  window.addEventListener('hashchange', route);
  route();
}

function route() {
  const slug = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const i = slug ? state.posts.findIndex((p) => p.slug === slug) : 0;
  loadPost(i === -1 ? 0 : i);
}

/* ------------------------------------------------------------- post load */

async function loadPost(i) {
  const post = state.posts[i];
  if (!post) return showError('NO POSTS YET');
  state.current = i;
  markWheel(i);

  $('#error').hidden = true;
  $('#loading').hidden = false;
  $('#post-head').hidden = true;
  grid().innerHTML = '';

  let zhMd, enMd;
  try {
    [zhMd, enMd] = await Promise.all([
      fetchText(`posts/${post.slug}/zh.md`),
      fetchText(`posts/${post.slug}/en.md`),
    ]);
  } catch (err) {
    return showError(`COULD NOT LOAD POST — ${err.message}`);
  }

  $('#loading').hidden = true;
  renderHead(post);
  renderPair(zhMd, enMd, post.slug);
  document.title = `${post.title_zh} — Z00 Studio Blog`;
  content().scrollTo({ top: 0, behavior: 'instant' });
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

function renderHead(post) {
  $('#post-date').textContent = post.date;
  $('#post-title-zh').textContent = post.title_zh;
  $('#post-title-en').textContent = post.title_en;
  $('#post-head').hidden = false;
}

/* --------------------------------------------------- bilingual rendering */

function renderPair(zhMd, enMd, slug) {
  const g = grid();
  const heads = makeEl('div', 'col-heads');
  heads.append(
    makeEl('div', 'col-head zh', '中文 · <b>ORIGINAL</b>'),
    makeEl('div', 'col-head en', 'ENGLISH · <b>TRANSLATED BY CLAUDE</b>'),
  );
  g.append(heads);

  const zhBlocks = toBlocks(zhMd, slug);
  const enBlocks = toBlocks(enMd, slug);
  const n = Math.max(zhBlocks.length, enBlocks.length);

  for (let b = 0; b < n; b++) {
    const z = zhBlocks[b] || null;
    const e = enBlocks[b] || null;

    // A block that is just an image breaks the columns: both sides share it.
    if (isImageBlock(z) || isImageBlock(e)) {
      const cell = makeEl('div', 'cell full');
      cell.append(makeSharedFigure(z, e));
      g.append(cell);
      continue;
    }

    // Byte-identical blocks (code, tables, dividers…) render once, centered.
    if (z && e && z.outerHTML === e.outerHTML) {
      const cell = makeEl('div', 'cell full shared-verbatim');
      cell.append(z);
      g.append(cell);
      continue;
    }

    const zc = makeEl('div', 'cell zh');
    const ec = makeEl('div', 'cell en');
    zc.dataset.b = b;
    ec.dataset.b = b;
    if (z) zc.append(z);
    if (e) ec.append(e);
    wrapSentences(zc, b, 'zh');
    wrapSentences(ec, b, 'en');
    g.append(zc, ec);
  }
}

/** Parse markdown into an array of top-level DOM blocks. */
function toBlocks(md, slug) {
  const d = document.createElement('div');
  d.innerHTML = marked.parse(md);
  // Post-relative image paths ("img/foo.png") resolve inside the post folder.
  d.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    const absolute = /^([a-z]+:)?\/\//i.test(src) || src.startsWith('/');
    if (src && !absolute && !src.startsWith('assets/')) {
      img.setAttribute('src', `posts/${slug}/${src}`);
    }
  });
  return [...d.children];
}

function isImageBlock(el) {
  return (
    el &&
    el.tagName === 'P' &&
    el.querySelector('img') &&
    !el.textContent.trim()
  );
}

/** One centered figure shared by both columns; captions from the alt texts. */
function makeSharedFigure(z, e) {
  const img = (isImageBlock(z) ? z : e).querySelector('img').cloneNode(true);
  const fig = makeEl('figure', 'shared-img');
  fig.append(img);
  const altZh = isImageBlock(z) ? z.querySelector('img').alt : '';
  const altEn = isImageBlock(e) ? e.querySelector('img').alt : '';
  if (altZh || altEn) {
    const cap = document.createElement('figcaption');
    const zhSpan = makeEl('span', 'tt-zh', '');
    zhSpan.textContent = altZh || altEn;
    cap.append(zhSpan);
    if (altEn && altEn !== altZh) {
      const en = makeEl('span', 'tt-en', '');
      en.textContent = altEn;
      cap.append(en);
    }
    fig.append(cap);
  }
  return fig;
}

/* ------------------------------------------------ sentence-level pairing */

function wrapSentences(cell, b, side) {
  const root = cell.firstElementChild;
  if (!root || /^(PRE|TABLE|FIGURE|HR)$/.test(root.tagName)) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      n.parentElement.closest('pre, code')
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  let sid = 0;
  let openTail = false; // an unterminated piece keeps the sentence open
  for (const node of nodes) {
    const pieces = splitPieces(node.nodeValue);
    if (!pieces.length) continue;
    const frag = document.createDocumentFragment();
    for (const p of pieces) {
      const span = document.createElement('span');
      span.className = 'sent';
      span.dataset.b = b;
      span.dataset.s = sid;
      span.dataset.side = side;
      span.textContent = p.text;
      frag.append(span);
      openTail = !p.end;
      if (p.end) sid++;
    }
    node.replaceWith(frag);
  }
  cell.dataset.sentences = sid + (openTail ? 1 : 0);
}

function onSentence(on) {
  return (ev) => {
    const s = ev.target.closest('.sent');
    if (!s) return;
    const { b, s: sid } = s.dataset;
    const spans = grid().querySelectorAll(`.sent[data-b="${b}"][data-s="${sid}"]`);
    const sides = new Set();
    spans.forEach((sp) => {
      sp.classList.toggle('hl', on);
      sides.add(sp.dataset.side);
    });
    // No counterpart sentence (counts diverge)? Fall back to the whole block.
    for (const side of ['zh', 'en']) {
      if (!sides.has(side)) {
        const cell = grid().querySelector(`.cell.${side}[data-b="${b}"]`);
        if (cell) cell.classList.toggle('hl-block', on);
      }
    }
  };
}

/* ------------------------------------------------------------- the wheel */

function buildWheel() {
  const wheel = $('#wheel');
  wheel.innerHTML = '';
  state.posts.forEach((p, i) => {
    const [y, m, d] = p.date.split('-');
    const item = makeEl(
      'button',
      'wheel-item',
      `<span class="mmdd">${m}.${d}</span><span class="yy">${y}</span>`,
    );
    item.dataset.i = i;
    item.addEventListener('click', () => {
      hideTip();
      location.hash = '#/' + p.slug;
    });
    item.addEventListener('mouseenter', () =>
      showTip(item, p.title_zh, p.title_en),
    );
    item.addEventListener('mouseleave', hideTip);
    wheel.append(item);
  });
  // Scrolling over the rail only scrolls the date list (native overflow
  // scroll); switching posts happens on click alone.
}

function markWheel(i) {
  document.querySelectorAll('.wheel-item').forEach((el) => {
    el.classList.toggle('current', Number(el.dataset.i) === i);
  });
  const cur = document.querySelector('.wheel-item.current');
  if (cur) cur.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/* -------------------------------------------------------------- controls */

function initProgressBar() {
  const fill = $('#progress-fill');
  const pane = content();
  const update = () => {
    const max = pane.scrollHeight - pane.clientHeight;
    fill.style.width = max > 0 ? `${(pane.scrollTop / max) * 100}%` : '0%';
  };
  pane.addEventListener('scroll', update, { passive: true });
  update();
}

/* ------------------------------------------------------------ zoo extras */

const ZOO = [
  'orca', 'owl', 'meerkat', 'dolphin', 'tortoise',
  'leopard', 'woodpecker', 'elephant', 'magpie',
];

/* The animals wander freely across the footer strip: each has its own pace
   and direction, turns at the edges, and pauses now and then (and while
   hovered, so the tooltip holds still). 8 fps steps keep it 8-bit. */
function initFooterZoo() {
  const strip = $('#zoo-strip');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const roam = [];

  ZOO.forEach((name, i) => {
    const img = document.createElement('img');
    img.className = 'animal';
    img.src = `assets/avatars/transparent/${name}.png`;
    const label = name[0].toUpperCase() + name.slice(1);
    img.alt = label;
    img.addEventListener('mouseenter', () => {
      a.hover = true;
      showTip(img, label);
    });
    img.addEventListener('mouseleave', () => {
      a.hover = false;
      hideTip();
    });
    strip.append(img);

    const a = {
      img,
      x: ((i + 0.5) / ZOO.length) * strip.clientWidth + (Math.random() - 0.5) * 40,
      dir: Math.random() < 0.5 ? -1 : 1,
      speed: 5 + Math.random() * 14, // px per second
      pause: Math.random() * 3, // seconds of standing still
      step: 0,
      hover: false,
    };
    img.style.left = `${Math.round(a.x)}px`;
    roam.push(a);
  });

  if (still) {
    // reduced motion: an evenly spaced, motionless lineup
    roam.forEach((a) => (a.img.style.transform = 'none'));
    return;
  }

  const TICK = 0.125; // 8 fps
  setInterval(() => {
    const w = strip.clientWidth;
    for (const a of roam) {
      if (a.hover) continue;
      if (a.pause > 0) {
        a.pause -= TICK;
        continue;
      }
      if (Math.random() < 0.004) a.pause = 1 + Math.random() * 4; // idle a bit
      if (Math.random() < 0.002) a.dir *= -1; // change of heart
      a.x += a.speed * a.dir * TICK;
      if (a.x < 4) { a.x = 4; a.dir = 1; }
      if (a.x > w - 50) { a.x = w - 50; a.dir = -1; }
      a.step ^= 1;
      a.img.style.left = `${Math.round(a.x / 2) * 2}px`;
      // sprites face left; flip when walking right — plus a 2px waddle
      a.img.style.transform = `translateY(${a.step ? -2 : 0}px) scaleX(${a.dir === 1 ? -1 : 1})`;
    }
  }, TICK * 1000);
}

function scheduleOwl() {
  const owl = $('#flying-owl');
  const fly = () => {
    owl.classList.add('flying');
    setTimeout(() => owl.classList.remove('flying'), 9500);
    setTimeout(fly, 30000 + Math.random() * 60000);
  };
  setTimeout(fly, 5000 + Math.random() * 10000);
}

/* ----------------------------------------------------------------- utils */

function makeEl(tag, cls, html) {
  const el = document.createElement(tag);
  el.className = cls;
  if (html != null) el.innerHTML = html;
  return el;
}

const tip = () => $('#tooltip');

function showTip(anchor, zh, en) {
  const t = tip();
  t.innerHTML = '';
  // single-line tips (footer animals) stay in the pixel font
  const zhEl = makeEl('span', en ? 'tt-zh' : 'tt-solo', '');
  zhEl.textContent = zh;
  t.append(zhEl);
  if (en) {
    const enEl = makeEl('span', 'tt-en', '');
    enEl.textContent = en;
    t.append(enEl);
  }
  t.hidden = false;
  const r = anchor.getBoundingClientRect();
  const tr = t.getBoundingClientRect();
  let left = r.right + 12;
  if (left + tr.width > window.innerWidth - 8) left = r.left - tr.width - 12;
  let top = Math.min(
    Math.max(8, r.top + r.height / 2 - tr.height / 2),
    window.innerHeight - tr.height - 8,
  );
  t.style.left = `${Math.max(8, left)}px`;
  t.style.top = `${top}px`;
}

function hideTip() {
  tip().hidden = true;
}

function showError(msg) {
  $('#loading').hidden = true;
  const e = $('#error');
  e.textContent = `⚠ ${msg}`;
  e.hidden = false;
}

boot();
