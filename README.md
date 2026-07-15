# Z00 Studio Blog — instructions for Claude

You are reading the only documentation of this repo. It is written for you,
Claude: no human is expected to read the code. Lion (the founder,
`bigelephant29`) writes blog posts in Chinese and hands them to you; your job
is to translate them, register them, and open a PR. This file tells you
exactly how.

The site is fully static (GitHub Pages, no build step, no server): the browser
fetches Markdown and renders it client-side. Chinese original in the left
column, your English translation in the right, paired block-by-block and
highlighted sentence-by-sentence on hover.

## The task you will usually get: publish a post

Lion gives you Chinese text (and maybe images). Do this, in order:

1. **Create the post folder** — `posts/YYYY-MM-DD-kebab-slug/` where the date
   is the publish date. Put any images in `posts/<slug>/img/`.
2. **Write `zh.md`** — Lion's Chinese text, plain Markdown, **no
   front-matter**. Do not repeat the title in the body; the page renders it
   from the index. Never rewrite Lion's words beyond what he asked.
3. **Write `en.md`** — your translation, following the authoring contract
   below exactly.
4. **Register the post in `posts/index.json`** — this step is mandatory: the
   site builds its date rail from this file, not from the folders. A folder
   without an index entry is invisible (and fails CI). Keep newest first:

   ```json
   { "slug": "2026-07-20-example", "date": "2026-07-20",
     "title_zh": "範例標題", "title_en": "An Example Title" }
   ```

5. **Validate** — `node scripts/validate.mjs`. Fix every error. Warnings mean
   sentence-hover degrades to paragraph-hover in that block; fix them unless
   the prose genuinely demands a different sentence split.
6. **Preview** (when you can) — `python3 -m http.server -d . 8000` and check
   `http://localhost:8000`. Opening `index.html` via `file://` does NOT work
   (fetch is blocked); it must be served over HTTP.
7. **Open a PR** — branch, commit, PR to `main`, assign + request review from
   `bigelephant29`. Merges are Gate 2: Lion reviews everything. Pushes to
   `main` deploy to Pages automatically (`.github/workflows/pages.yml`).

## The authoring contract (the renderer assumes all of this)

The renderer pairs `zh.md` and `en.md` **top-level block by top-level block**,
in order. A block is one Markdown unit: paragraph, heading, list, blockquote,
code fence, table, standalone image line, or `---`.

- **Same number of blocks, same order, both files.** Hard CI error if broken.
- **Images stand alone** on their own line (`![alt](img/foo.png)`), at the
  same block position on both sides, with the **same path**. Translate only
  the alt text — it becomes the shared caption. The image renders once,
  centered, breaking the two columns.
- **Byte-identical blocks render once, centered** — use for code fences,
  tables, and dividers that need no translation: keep them *exactly*
  identical in both files.
- **Aim for a 1:1 sentence mapping inside each block.** Sentences end at
  `。！？；…` (Chinese) and `. ! ?` (English). Hover highlights counterparts
  by index, so translate sentence-for-sentence: three Chinese sentences →
  three English sentences. If English truly demands a split/merge, the block
  falls back to whole-paragraph hover (validator warns).
  - Chinese `；` ends a sentence; English `;` does not — either end the
    English sentence there too, or accept the warning.
  - "e.g. " counts as a sentence end; write "for example" instead.
- Relative image paths resolve inside the post folder (`img/foo.png` →
  `posts/<slug>/img/foo.png`). Site-wide assets: `assets/...`.

## Translation style

- Keep Lion's voice: personal, direct, a little wry. Add nothing, drop
  nothing, no editorializing.
- Chinese is the original — fidelity beats elegance, but the English must
  read as English, not as a gloss.
- Follow whatever Chinese variant Lion writes (he writes Traditional, 繁體).

## Locked design decisions (Lion's explicit direction — do not undo)

- Header is just the pixel logo + "Z00 STUDIO BLOG".
- **Always bilingual** — no language toggle. **Always the light paper theme**
  — no dark mode.
- **Fixed frame**: the page itself never scrolls; only the date rail and the
  content pane do. Header and footer stay on screen.
- The **date rail** is the only navigation: dates only (no dots/markers,
  no NEW/OLD caps), newest on top, hover shows the title, **click is the only
  way to switch posts** (no keyboard shortcuts, no scroll-to-switch), and
  scrolling over the rail just scrolls the list.
- Footer: the nine org animals **wander freely** (pause under the cursor);
  their tooltip is **only the English code name** (e.g. "Orca") — no roles,
  no Chinese. Colophon reads exactly:
  `© Z00 STUDIO — written by 🦁, translated by Claude, kept by the Z00.`
- Design principles: everything 8-bit except the post text (readable serif);
  content first; all animation respects `prefers-reduced-motion`.
- Keep the site **self-contained**: no CDNs, no trackers, relative URLs only
  (it runs from the `/blog/` project-pages subpath).

## Repo map

| Path | What |
| --- | --- |
| `index.html` | The whole app shell (single page, hash routing `#/<slug>`) |
| `assets/css/style.css` | 8-bit chrome + readable content typography |
| `assets/js/app.js` | Renderer: block pairing, sentence hover, date rail, roaming zoo |
| `assets/js/segment.js` | Sentence segmentation — shared by renderer and validator |
| `assets/js/marked.min.js` | Vendored marked v12 (MIT, `marked.LICENSE.md`) — the only dependency |
| `assets/fonts/` | Press Start 2P latin subset (OFL, `OFL.txt`) |
| `assets/avatars/` | Zoo org avatars; `transparent/` = cropped sprites used for animation |
| `posts/index.json` | The post registry — a post exists only once listed here |
| `posts/<slug>/{zh,en}.md` | One post, two languages |
| `scripts/validate.mjs` | CI-enforced check of the authoring contract |

Asset licensing (all cleared for business use): marked is MIT, the font is SIL
OFL 1.1, avatars and icon are Z00 Studio's own LLM-designed, in-house-rendered
work (zoo-hq#103/#138).

## One-time setup still pending (for Lion, not you)

Repo Settings → Pages → Source: "GitHub Actions", and make the repo public
when ready to publish.
