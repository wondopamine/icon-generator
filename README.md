# Icon Generator — Hand-drawn icons for marketing

Internal tool for browsing and exporting hand-drawn, craft.do-style icons.
Built for GovTech Singapore marketing pages and feature illustrations.

## What it is

- 1,696 icons from [Lucide](https://lucide.dev) transformed into a hand-drawn style at render time via [rough.js](https://roughjs.com).
- Five style presets: **Ink**, **Pencil**, **Marker**, **Charcoal**, **Sketchy**.
- Per-icon **roughness slider** scales the preset's wobble (0 = clean, 2× = max).
- Per-icon **accessible label** embeds `<title>` into exported SVG/JSX.
- Export as SVG, JSX (React component), or raw SVG clipboard copy.
- Second icon source tab: **Golden** — curated hand-illustrated SVGs in `public/golden/`.
- Deterministic rendering — the same icon always looks the same across sessions.

Through **Week 2**. Week 3 adds AI prompt-to-icon.

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
| Download SVG | client-side, `Blob` + anchor-click |
| Copy JSX | `POST /api/export/jsx` → custom SVG-to-JSX converter |
| Copy raw SVG | `navigator.clipboard.writeText` |

The JSX route produces a TypeScript React component with `size` and `title` props (aria-label via title).

## Project layout

```
app/
├── layout.tsx               root shell + Sonner toaster
├── page.tsx                 grid + detail panel
├── globals.css              Tailwind v4 entry
└── api/export/jsx/route.ts  SVG → JSX (server)
components/
├── icon-grid.tsx            search + grid of cards
├── icon-card.tsx            single cell (memoized)
├── transformed-icon.tsx     runs the rough.js transform on mount, caches
├── icon-detail.tsx          right-side Sheet with preview + style + export
├── style-picker.tsx         Pencil / Ink radio
├── export-panel.tsx         3 export buttons
└── ui/                      shadcn components
lib/
├── icons.ts                 generated metadata (1,696 icons)
├── icon-loader.ts           dynamic-imports Lucide __iconNode with per-icon cache
├── golden.ts                Golden icon metadata + /public/golden/ loader
├── store.ts                 Zustand: selected icon, preset, search, source, per-icon roughness/title
├── transform/
│   ├── index.ts             transformIcon(iconId, shapes, preset) → SVG string
│   ├── shape-to-path.ts     rect/circle/line/polygon → path d
│   ├── seed.ts              deterministic hash + mulberry32
│   └── stroke-renderer.ts   preset configs
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
| 3 | AI prompt-to-icon via Vercel AI Gateway (embedding search → gpt-image-1 → potrace → transform) | planned |

Design doc and decision history: `~/.gstack/projects/icon-generator/`.
