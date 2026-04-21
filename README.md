# Icon Generator — Hand-drawn icons for marketing

Internal tool for browsing and exporting hand-drawn, craft.do-style icons.
Built for GovTech Singapore marketing pages and feature illustrations.

## What it is

- 1,696 icons from [Lucide](https://lucide.dev) transformed into a hand-drawn style at render time via [rough.js](https://roughjs.com).
- Five style presets: **Ink**, **Pencil**, **Marker**, **Charcoal**, **Sketchy**.
- Per-icon **roughness slider** scales the preset's wobble (0 = clean, 2× = max).
- Per-icon **accessible label** embeds `<title>` into exported SVG/JSX.
- Export a single icon as **SVG / JSX / raw clipboard / share sheet**, or the whole set as a **ZIP** (all 1,696 icons, current preset baked in).
- Single-icon exports are **rasterized from the in-browser render** so they render pixel-identical in Figma / Finder / email (tools that don't execute SVG filters).
- `/tune` — live parameter workbench for tweaking presets against a reference SVG side-by-side.
- Second icon source tab: **Golden** — curated hand-illustrated SVGs in `public/golden/`.
- Deterministic rendering — the same icon always looks the same across sessions.

Through **Week 4**. Week 3 (AI prompt-to-icon) is deferred.

## Local development

```bash
pnpm install
pnpm dev
```

Opens at `http://localhost:3000`.

Keyboard: press **`/`** anywhere to focus the search.

## How the transform works

Each Lucide icon ships as a list of shape tuples (`['path', {d: "..."}]`, `['rect', {...}]`, etc.).
On selection, the app:

1. Converts every shape to a path `d` string (`lib/transform/shape-to-path.ts`)
2. Seeds a deterministic RNG from `hash(iconId + presetName)` (`lib/transform/seed.ts`)
3. Feeds each path through `rough.js`'s `generator.path(d, {seed, roughness, bowing})`
4. Converts rough.js's op array back to SVG path strings (`lib/transform/index.ts`)

No DOM required — rough.js is headless. No AI. No runtime network requests.

## Export formats

| Format | Source |
|--------|--------|
| Download SVG | rasterized from live render → embedded PNG in `<image>` wrapper, `Blob` + anchor-click |
| Copy JSX | `POST /api/export/jsx` → custom SVG-to-JSX converter |
| Copy raw SVG | `navigator.clipboard.writeText` |
| Share sheet | `navigator.share({ files: [File] })` (mobile / supported browsers) |
| Export all (ZIP) | [`lib/bulk-export.ts`](lib/bulk-export.ts) — JSZip, batched at 25/yield, portable-path renderer (no filter) so archived icons render everywhere |

Single-icon downloads go through [`lib/rasterize-svg.ts`](lib/rasterize-svg.ts): the live filter SVG is drawn into a canvas then embedded as a base64 PNG inside a 24×24 SVG wrapper. That's what makes Figma and Finder Quick Look look identical to the app preview (they don't execute `feTurbulence`). The ZIP path skips rasterization because 1,696 × `Image.onload` would be too slow — it uses the portable renderer instead.

The JSX route produces a TypeScript React component with `size` and `title` props (aria-label via title).

## Project layout

```
app/
├── layout.tsx               root shell + Sonner toaster
├── page.tsx                 grid + detail panel
├── tune/page.tsx            /tune — parameter workbench (desktop-only)
├── manifest.ts / icon.tsx   PWA manifest + adaptive icon
├── globals.css              Tailwind v4 entry
└── api/export/jsx/route.ts  SVG → JSX (server)
components/
├── icon-grid.tsx            virtualized search + grid of cards
├── icon-card.tsx            single cell (memoized)
├── transformed-icon.tsx     runs the rough.js transform on mount, caches
├── icon-detail.tsx          right-side Sheet / drawer with preview + style + export
├── style-picker.tsx         preset radio
├── export-panel.tsx         single-icon export buttons (rasterized)
├── bulk-export-button.tsx   "Export all" → ZIP with progress toast
├── tune-workbench.tsx       /tune live preset editor + reference compare
└── ui/                      shadcn components
lib/
├── icons.ts                 generated metadata (1,696 icons)
├── icon-loader.ts           dynamic-imports Lucide __iconNode with per-icon cache
├── golden.ts                Golden icon metadata + /public/golden/ loader
├── store.ts                 Zustand: selected icon, preset, search, source, per-icon roughness/title
├── build-svg.ts             high-level: loadIconShapes → transformIcon → SVG string
├── rasterize-svg.ts         filter-SVG → canvas → base64 PNG → embedded <image> wrapper
├── bulk-export.ts           batched ZIP builder (portable-path renderer)
├── use-media-query.ts       SSR-safe matchMedia hook
├── transform/
│   ├── index.ts             transformIcon / transformIconWithConfig → SVG string
│   ├── shape-to-path.ts     rect/circle/line/polygon → path d
│   ├── seed.ts              deterministic hash + mulberry32
│   └── stroke-renderer.ts   preset configs (filter + portable overrides)
└── utils.ts                 shadcn cn()
scripts/
└── generate-icons.mjs       run to refresh lib/icons.ts from node_modules/lucide-react
```

## Reference icons

Before tuning the transform further, export a few Craft.do marketing-page SVG icons into `public/references/` (devtools → inspect icon → copy outer HTML). Use them as the visual quality bar when tweaking `stroke-renderer.ts`.

## Deploy

```bash
vercel link
vercel --prod
```

Enable **Password Protection** in the Vercel project settings so only team members with the shared password can access.

## Regenerating the icon list

```bash
node scripts/generate-icons.mjs
```

Run after upgrading `lucide-react` to pick up new icons.

## Roadmap

| Week | Scope | Status |
|------|-------|--------|
| 1 | Lucide + rough.js transform, 2 presets, export, grid + search | ✓ Shipped |
| 2 | Marker + Charcoal presets, roughness slider, a11y `<title>` slot in exports, Golden icon source scaffold | ✓ Shipped |
| — | Mobile UX pass: responsive sheet, virtualized grid, PWA manifest | ✓ Shipped |
| 4 | Bulk ZIP export, `/tune` workbench, rasterized single-icon exports (pixel-match Figma/Finder), MIT + attribution | ✓ Shipped |
| 3 | AI prompt-to-icon via Vercel AI Gateway (embedding search → gpt-image-1 → potrace → transform) | deferred |

Design doc and decision history: `~/.gstack/projects/icon-generator/`.

## License

This project's source code is [MIT](./LICENSE) licensed.

The icons it renders are derivatives of [Lucide](https://lucide.dev) (ISC),
a subset of which is in turn derived from [Feather](https://feathericons.com)
(MIT). Those upstream notices are preserved in [NOTICE.md](./NOTICE.md) —
if you redistribute the SVG / JSX / ZIP output this tool produces (e.g. ship
it inside a client deliverable or a public site), include that file or the
equivalent copyright block alongside the icons.
